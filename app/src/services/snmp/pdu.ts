import { Buffer } from 'buffer';
import {
  BER_TAG,
  encodeInteger,
  encodeOctetString,
  encodeNull,
  encodeOID,
  encodeSequence,
  encodeTLV,
  decodeTLV,
  decodeInteger,
  decodeUnsignedInteger,
  decodeCounter64,
  decodeOID,
} from './ber';
import { AppError } from '../../utils/errors';

export interface Varbind {
  oid: string;
  type: number;
  value: any;
}

export interface SnmpMessage {
  version: 0 | 1; // 0 = v1, 1 = v2c
  community: string;
  pduType: number; // 0xA0 = GetRequest, 0xA1 = GetNextRequest, 0xA2 = GetResponse
  requestId: number;
  errorStatus?: number;
  errorIndex?: number;
  varbinds: Varbind[];
}

/**
 * Codifica un mensaje SNMP completo (v1 o v2c).
 */
export function encodeMessage(msg: SnmpMessage): Buffer {
  const versionBuf = encodeInteger(msg.version);
  const communityBuf = encodeOctetString(msg.community);

  const reqIdBuf = encodeInteger(msg.requestId);
  const errStatusBuf = encodeInteger(msg.errorStatus || 0);
  const errIndexBuf = encodeInteger(msg.errorIndex || 0);

  // Codificar lista de varbinds
  const varbindBuffers = msg.varbinds.map((vb) => {
    const oidBuf = encodeOID(vb.oid);
    let valBuf: Buffer;

    if (vb.value === null || vb.value === undefined) {
      valBuf = encodeNull();
    } else if (typeof vb.value === 'number') {
      valBuf = encodeInteger(vb.value);
    } else if (typeof vb.value === 'string') {
      valBuf = encodeOctetString(vb.value);
    } else if (Buffer.isBuffer(vb.value)) {
      valBuf = vb.value;
    } else {
      valBuf = encodeNull();
    }

    return encodeSequence([oidBuf, valBuf]);
  });

  const varbindListSeq = encodeSequence(varbindBuffers);

  // PDU (0xA0 / 0xA1)
  const pduContent = Buffer.concat([reqIdBuf, errStatusBuf, errIndexBuf, varbindListSeq]);
  const pduBuf = encodeTLV(msg.pduType, pduContent);

  // Mensaje completo: SEQUENCE { version, community, pdu }
  return encodeSequence([versionBuf, communityBuf, pduBuf]);
}

/**
 * Decodifica un mensaje SNMP entrante.
 */
export function decodeMessage(buf: Buffer): SnmpMessage {
  const rootTLV = decodeTLV(buf, 0);
  if (rootTLV.tag !== BER_TAG.SEQUENCE) {
    throw new AppError('PARSE_ERROR', `Mensaje SNMP debe ser SEQUENCE (esperado 0x30, recibido 0x${rootTLV.tag.toString(16)})`);
  }

  const rootBuf = rootTLV.value;
  let offset = 0;

  // 1. Version
  const verTLV = decodeTLV(rootBuf, offset);
  if (verTLV.tag !== BER_TAG.INTEGER) {
    throw new AppError('PARSE_ERROR', 'Versión SNMP debe ser INTEGER.');
  }
  const versionNum = decodeInteger(verTLV.value);
  const version: 0 | 1 = versionNum === 0 ? 0 : 1;
  offset += verTLV.headerLength + verTLV.length;

  // 2. Community
  const commTLV = decodeTLV(rootBuf, offset);
  if (commTLV.tag !== BER_TAG.OCTET_STRING) {
    throw new AppError('PARSE_ERROR', 'Comunidad SNMP debe ser OCTET STRING.');
  }
  const community = commTLV.value.toString('utf-8');
  offset += commTLV.headerLength + commTLV.length;

  // 3. PDU
  const pduTLV = decodeTLV(rootBuf, offset);
  const pduType = pduTLV.tag;
  const pduBuf = pduTLV.value;
  let pduOffset = 0;

  // Request ID
  const reqIdTLV = decodeTLV(pduBuf, pduOffset);
  const requestId = decodeInteger(reqIdTLV.value);
  pduOffset += reqIdTLV.headerLength + reqIdTLV.length;

  // Error Status
  const errStatusTLV = decodeTLV(pduBuf, pduOffset);
  const errorStatus = decodeInteger(errStatusTLV.value);
  pduOffset += errStatusTLV.headerLength + errStatusTLV.length;

  // Error Index
  const errIndexTLV = decodeTLV(pduBuf, pduOffset);
  const errorIndex = decodeInteger(errIndexTLV.value);
  pduOffset += errIndexTLV.headerLength + errIndexTLV.length;

  // VarbindList
  const varbindListTLV = decodeTLV(pduBuf, pduOffset);
  if (varbindListTLV.tag !== BER_TAG.SEQUENCE) {
    throw new AppError('PARSE_ERROR', 'Lista de varbinds debe ser SEQUENCE.');
  }

  const varbindListBuf = varbindListTLV.value;
  let vbOffset = 0;
  const varbinds: Varbind[] = [];

  while (vbOffset < varbindListBuf.length) {
    const vbTLV = decodeTLV(varbindListBuf, vbOffset);
    vbOffset += vbTLV.headerLength + vbTLV.length;

    if (vbTLV.tag !== BER_TAG.SEQUENCE) continue;

    const vbBuf = vbTLV.value;
    // OID
    const oidTLV = decodeTLV(vbBuf, 0);
    const oid = decodeOID(oidTLV.value);

    // Value
    const valOffset = oidTLV.headerLength + oidTLV.length;
    const valTLV = decodeTLV(vbBuf, valOffset);

    let parsedVal: any;
    switch (valTLV.tag) {
      case BER_TAG.INTEGER:
        parsedVal = decodeInteger(valTLV.value);
        break;
      case BER_TAG.OCTET_STRING:
        parsedVal = valTLV.value; // Devolver buffer (puede ser string o binario MAC)
        break;
      case BER_TAG.OBJECT_IDENTIFIER:
        parsedVal = decodeOID(valTLV.value);
        break;
      case BER_TAG.NULL:
        parsedVal = null;
        break;
      case BER_TAG.IpAddress:
        parsedVal = Array.from(valTLV.value).join('.');
        break;
      case BER_TAG.Counter32:
      case BER_TAG.Gauge32:
      case BER_TAG.TimeTicks:
        parsedVal = decodeUnsignedInteger(valTLV.value);
        break;
      case BER_TAG.Counter64:
        parsedVal = decodeCounter64(valTLV.value);
        break;
      case BER_TAG.noSuchObject:
      case BER_TAG.noSuchInstance:
      case BER_TAG.endOfMibView:
        parsedVal = { exception: valTLV.tag };
        break;
      default:
        parsedVal = valTLV.value;
    }

    varbinds.push({
      oid,
      type: valTLV.tag,
      value: parsedVal,
    });
  }

  return {
    version,
    community,
    pduType,
    requestId,
    errorStatus,
    errorIndex,
    varbinds,
  };
}
