import NetInfo from '@react-native-community/netinfo';
import { DISCOVERY } from '../../config/constants';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { hostsToScan, maskToPrefix } from './subnet';
import { probeHost } from './tcpProbe';
import { scanMdns, MdnsDevice } from './mdns';
import { devicesRepository } from '../../db/repositories/devices';
import { Device } from '../../db/models/Device';

export interface DiscoveredHost {
  ip: string;
  hostname?: string;
  openPorts: number[];
  rttMs?: number;
  sources: Array<'tcp' | 'mdns' | 'snmp'>;
}

export interface ScanProgress {
  scanned: number;
  total: number;
  found: number;
}

export interface LocalNetworkInfo {
  ip: string;
  mask: string;
  prefix: number;
  ssid?: string;
}

export class DiscoveryService {
  /**
   * Obtiene la información de la red local Wi-Fi activa.
   */
  static async getLocalNetwork(): Promise<LocalNetworkInfo> {
    const state = await NetInfo.fetch();

    if (!state.isConnected || state.type !== 'wifi') {
      throw new AppError(
        'NETWORK_UNREACHABLE',
        'No estás conectado a una red Wi-Fi de gestión.'
      );
    }

    const details: any = state.details;
    const ip = details?.ipAddress;
    const mask = details?.subnet;

    if (!ip || !mask) {
      throw new AppError(
        'NETWORK_UNREACHABLE',
        'No se pudo determinar la IP o máscara de la red local.'
      );
    }

    const prefix = maskToPrefix(mask);

    return {
      ip,
      mask,
      prefix,
      ssid: details?.ssid,
    };
  }

  /**
   * Ejecuta el escaneo de descubrimiento sobre la subred local.
   * Concurrencia controlada (pool de 32 trabajadores), límite estricto de 15 segundos y mDNS en paralelo.
   */
  static async scan(
    onHost?: (host: DiscoveredHost) => void,
    onProgress?: (progress: ScanProgress) => void,
    signal?: AbortSignal
  ): Promise<DiscoveredHost[]> {
    const netInfo = await this.getLocalNetwork();
    const targets = hostsToScan(netInfo.ip, netInfo.mask);
    const total = targets.length;

    logger.info(`Iniciando escaneo de ${total} hosts en ${netInfo.ip}/${netInfo.prefix}`);

    const hostsMap = new Map<string, DiscoveredHost>();
    let scannedCount = 0;
    let foundCount = 0;

    // 1. Iniciar escaneo mDNS en segundo plano
    const mdnsPromise = scanMdns(DISCOVERY.MDNS_SERVICES, DISCOVERY.MDNS_DURATION_MS, signal);

    // 2. Pool concurrente para sondeo TCP
    let targetIndex = 0;

    const worker = async (): Promise<void> => {
      while (targetIndex < targets.length) {
        if (signal?.aborted) break;

        const currentIp = targets[targetIndex++];
        try {
          const probe = await probeHost(
            currentIp,
            DISCOVERY.PROBE_PORTS,
            DISCOVERY.TCP_TIMEOUT_MS,
            signal
          );

          if (probe.alive || probe.openPorts.length > 0) {
            const host: DiscoveredHost = {
              ip: currentIp,
              openPorts: probe.openPorts,
              rttMs: probe.rttMs,
              sources: ['tcp'],
            };
            hostsMap.set(currentIp, host);
            foundCount++;
            onHost?.(host);
          }
        } catch (err) {
          logger.warn(`Error al sondear ${currentIp}:`, err);
        } finally {
          scannedCount++;
          onProgress?.({
            scanned: scannedCount,
            total,
            found: foundCount,
          });
        }
      }
    };

    // Lanzar CONCURRENCY trabajadores en paralelo
    const workersCount = Math.min(DISCOVERY.CONCURRENCY, targets.length);
    const workers = Array.from({ length: workersCount }, () => worker());

    // Esperar a que terminen los workers de TCP
    await Promise.all(workers);

    // Esperar resultados de mDNS e integrarlos
    try {
      const mdnsResults = await mdnsPromise;
      for (const mdns of mdnsResults) {
        const existing = hostsMap.get(mdns.ip);
        if (existing) {
          if (mdns.hostname && !existing.hostname) {
            existing.hostname = mdns.hostname;
          }
          if (!existing.sources.includes('mdns')) {
            existing.sources.push('mdns');
          }
        } else {
          // Descubierto por mDNS
          const newHost: DiscoveredHost = {
            ip: mdns.ip,
            hostname: mdns.hostname,
            openPorts: [],
            sources: ['mdns'],
          };
          hostsMap.set(mdns.ip, newHost);
          foundCount++;
          onHost?.(newHost);
        }
      }
    } catch (e) {
      logger.warn('Error al procesar resultados de mDNS:', e);
    }

    const discoveredList = Array.from(hostsMap.values());

    // 3. Persistir en WatermelonDB
    try {
      for (const host of discoveredList) {
        await devicesRepository.upsertByIp({
          ipAddress: host.ip,
          hostname: host.hostname,
          openPorts: host.openPorts,
          discoverySource: host.sources[0] || 'tcp',
        });
      }
    } catch (e) {
      logger.error('Error al persistir equipos descubiertos en WatermelonDB:', e);
    }

    return discoveredList;
  }
}
