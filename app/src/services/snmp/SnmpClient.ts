import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import { SNMP } from '../../config/constants';
import { BER_TAG } from './ber';
import { OID } from './oids';
import { encodeMessage, decodeMessage, Varbind, SnmpMessage } from './pdu';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface SnmpTarget {
  host: string;
  port?: number;
  community: string;
  version?: 0 | 1; // 0 = v1, 1 = v2c
}

export interface SnmpInterface {
  index: number;
  descr: string;
  mac?: string;
  operStatus: 'up' | 'down' | 'testing' | 'unknown';
  inOctets: number;
  outOctets: number;
}

export interface SnmpSystemInfo {
  sysDescr: string;
  sysName: string;
  uptimeTicks: number;
}

export class SnmpClient {
  /**
   * Envía una solicitud SNMP sobre un socket UDP efímero y espera la respuesta correspondiente.
   */
  private sendRequest(
    target: SnmpTarget,
    pduType: number,
    oids: string[],
    versionOverride?: 0 | 1,
    customRetries?: number,
    customTimeoutMs?: number
  ): Promise<Varbind[]> {
    return new Promise((resolve, reject) => {
      const port = target.port || SNMP.PORT;
      const version = versionOverride !== undefined ? versionOverride : (target.version ?? 1);
      const community = target.community || SNMP.DEFAULT_COMMUNITY;
      const maxRetries = customRetries !== undefined ? customRetries : SNMP.RETRIES;
      const timeoutMs = customTimeoutMs !== undefined ? customTimeoutMs : SNMP.TIMEOUT_MS;

      // Generar requestId aleatorio de 31 bits
      const requestId = (Math.floor(Math.random() * 0x7ffffffe) + 1) >>> 0;

      const varbinds: Varbind[] = oids.map((oid) => ({
        oid,
        type: BER_TAG.NULL,
        value: null,
      }));

      const msg: SnmpMessage = {
        version,
        community,
        pduType,
        requestId,
        errorStatus: 0,
        errorIndex: 0,
        varbinds,
      };

      const packet = encodeMessage(msg);
      let socket: any = null;
      let timer: NodeJS.Timeout | null = null;
      let attempt = 0;
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          if (socket) {
            try {
              socket.close();
            } catch {}
            socket = null;
          }
        }
      };

      try {
        socket = dgram.createSocket({ type: 'udp4' });

        socket.bind(0, (err: Error) => {
          if (err) {
            cleanup();
            reject(new AppError('NETWORK_UNREACHABLE', `Error al abrir socket UDP: ${err.message}`));
            return;
          }

          const sendPacket = () => {
            if (resolved || !socket) return;
            socket.send(packet, 0, packet.length, port, target.host, (sendErr: Error) => {
              if (sendErr) {
                cleanup();
                reject(new AppError('NETWORK_UNREACHABLE', `Error al enviar paquete UDP: ${sendErr.message}`));
                return;
              }
            });

            timer = setTimeout(() => {
              attempt++;
              if (attempt <= maxRetries) {
                logger.debug(`Reintento SNMP ${attempt}/${maxRetries} a ${target.host}`);
                sendPacket();
              } else {
                cleanup();
                reject(new AppError('TIMEOUT', `Timeout SNMP tras reintentos a ${target.host}`));
              }
            }, timeoutMs);
          };

          sendPacket();
        });

        socket.on('message', (msgBuf: Buffer | Uint8Array) => {
          try {
            const buf = Buffer.isBuffer(msgBuf) ? msgBuf : Buffer.from(msgBuf);
            const response = decodeMessage(buf);

            // Validar que corresponda al requestId enviado
            if (response.requestId !== requestId) {
              return;
            }

            cleanup();

            if (response.errorStatus && response.errorStatus !== 0) {
              reject(
                new AppError('SNMP_ERROR', `Error SNMP ${response.errorStatus}`, {
                  errorStatus: response.errorStatus,
                  errorIndex: response.errorIndex,
                })
              );
              return;
            }

            resolve(response.varbinds);
          } catch (decodeErr) {
            cleanup();
            reject(new AppError('PARSE_ERROR', 'No se pudo decodificar la respuesta SNMP recibida.'));
          }
        });

        socket.on('error', (sockErr: Error) => {
          cleanup();
          reject(new AppError('NETWORK_UNREACHABLE', `Error en socket SNMP: ${sockErr.message}`));
        });
      } catch (err: any) {
        cleanup();
        reject(new AppError('UNKNOWN', err?.message || 'Error desconocido en cliente SNMP'));
      }
    });
  }

  /**
   * Ejecuta una consulta con fallback de versión (v2c -> v1 si falla por timeout).
   */
  async requestWithFallback(target: SnmpTarget, pduType: number, oids: string[]): Promise<Varbind[]> {
    try {
      // Intentar v2c por defecto
      return await this.sendRequest(target, pduType, oids, 1);
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'TIMEOUT') {
        logger.debug(`Fallback a SNMP v1 para ${target.host}...`);
        // Reintentar una vez con v1 (Regla C4)
        return await this.sendRequest(target, pduType, oids, 0);
      }
      throw err;
    }
  }

  /**
   * Consulta OIDs individuales mediante GetRequest.
   */
  async get(target: SnmpTarget, oids: string[]): Promise<Varbind[]> {
    return await this.requestWithFallback(target, BER_TAG.GetRequest, oids);
  }

  /**
   * Consulta el siguiente OID lexicográfico mediante GetNextRequest.
   */
  async getNext(target: SnmpTarget, oids: string[]): Promise<Varbind[]> {
    return await this.requestWithFallback(target, BER_TAG.GetNextRequest, oids);
  }

  /**
   * Consulta la información general del sistema MIB-II: sysDescr, sysName, sysUpTime.
   */
  async getSystemInfo(target: SnmpTarget): Promise<SnmpSystemInfo> {
    const oids = [OID.sysDescr, OID.sysName, OID.sysUpTime];
    const varbinds = await this.get(target, oids);

    let sysDescr = 'Desconocido';
    let sysName = 'Sin nombre';
    let uptimeTicks = 0;

    for (const vb of varbinds) {
      if (vb.oid === OID.sysDescr) {
        sysDescr = typeof vb.value === 'string' ? vb.value : vb.value?.toString?.('utf-8') || '';
      } else if (vb.oid === OID.sysName) {
        sysName = typeof vb.value === 'string' ? vb.value : vb.value?.toString?.('utf-8') || '';
      } else if (vb.oid === OID.sysUpTime) {
        uptimeTicks = typeof vb.value === 'number' ? vb.value : parseInt(vb.value, 10) || 0;
      }
    }

    return {
      sysDescr: sysDescr.trim(),
      sysName: sysName.trim(),
      uptimeTicks,
    };
  }

  /**
   * Recorre la tabla de interfaces (ifTable) del MIB-II mediante walk de GetNext.
   */
  async getInterfaces(target: SnmpTarget): Promise<SnmpInterface[]> {
    const interfacesMap = new Map<number, Partial<SnmpInterface>>();

    // Columnas base
    let currentOids: string[] = [
      OID.ifDescr,
      OID.ifPhysAddress,
      OID.ifOperStatus,
      OID.ifInOctets,
      OID.ifOutOctets,
    ];

    let count = 0;

    while (count < SNMP.MAX_INTERFACES) {
      const results = await this.getNext(target, currentOids);
      if (results.length === 0) break;

      // Verificar si el primer OID devuelto sigue perteneciendo al árbol ifDescr
      const firstResult = results[0];
      if (!firstResult.oid.startsWith(OID.ifDescr + '.')) {
        break; // Fin de la tabla
      }

      // El índice de interfaz es el último segmento numérico del OID
      const parts = firstResult.oid.split('.');
      const index = parseInt(parts[parts.length - 1], 10);

      if (isNaN(index)) break;

      let iface = interfacesMap.get(index);
      if (!iface) {
        iface = { index };
        interfacesMap.set(index, iface);
      }

      for (const res of results) {
        if (res.oid.startsWith(OID.ifDescr + '.')) {
          iface.descr = typeof res.value === 'string' ? res.value : res.value?.toString?.('utf-8') || `if${index}`;
        } else if (res.oid.startsWith(OID.ifPhysAddress + '.')) {
          // Si es un Buffer de 6 bytes, formatear a MAC hexadecimal
          if (Buffer.isBuffer(res.value) && res.value.length === 6) {
            iface.mac = Array.from(res.value)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join(':')
              .toLowerCase();
          }
        } else if (res.oid.startsWith(OID.ifOperStatus + '.')) {
          // 1 = up, 2 = down, 3 = testing
          const statusNum = typeof res.value === 'number' ? res.value : 0;
          iface.operStatus =
            statusNum === 1 ? 'up' : statusNum === 2 ? 'down' : statusNum === 3 ? 'testing' : 'unknown';
        } else if (res.oid.startsWith(OID.ifInOctets + '.')) {
          iface.inOctets = typeof res.value === 'number' ? res.value : parseInt(res.value, 10) || 0;
        } else if (res.oid.startsWith(OID.ifOutOctets + '.')) {
          iface.outOctets = typeof res.value === 'number' ? res.value : parseInt(res.value, 10) || 0;
        }
      }

      currentOids = results.map((r) => r.oid);
      count++;
    }

    return Array.from(interfacesMap.values()).map((item) => ({
      index: item.index || 1,
      descr: item.descr || `Interface ${item.index}`,
      mac: item.mac,
      operStatus: item.operStatus || 'unknown',
      inOctets: item.inOctets || 0,
      outOctets: item.outOctets || 0,
    }));
  }

  /**
   * Sondeo ligero durante el descubrimiento de red (Fase 3, tarea 3 / Fase 4).
   * Envía un GetRequest sysName con timeout corto y sin reintentos.
   */
  async probe(
    host: string,
    community: string = SNMP.DEFAULT_COMMUNITY,
    timeoutMs: number = SNMP.PROBE_TIMEOUT_MS
  ): Promise<{ alive: boolean; sysName?: string }> {
    try {
      const res = await this.sendRequest(
        { host, community, version: 1 },
        BER_TAG.GetRequest,
        [OID.sysName],
        1,
        0, // 0 reintentos
        timeoutMs
      );
      if (res && res.length > 0) {
        const val = res[0].value;
        const sysName = typeof val === 'string' ? val : val?.toString?.('utf-8');
        return { alive: true, sysName };
      }
      return { alive: false };
    } catch {
      return { alive: false };
    }
  }
}

export const snmpClient = new SnmpClient();
