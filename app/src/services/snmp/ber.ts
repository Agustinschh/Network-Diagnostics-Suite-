import { Buffer } from 'buffer';
import { AppError } from '../../utils/errors';

export const BER_TAG = {
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
  IpAddress: 0x40,
  Counter32: 0x41,
  Gauge32: 0x42,
  TimeTicks: 0x43,
  Opaque: 0x44,
  Counter64: 0x46,
  noSuchObject: 0x80,
  noSuchInstance: 0x81,
  endOfMibView: 0x82,
  GetRequest: 0xa0,
  GetNextRequest: 0xa1,
  GetResponse: 0xa2,
  SetRequest: 0xa3,
} as const;

export interface TLV {
  tag: number;
  length: number;
  value: Buffer;
  headerLength: number;
}

/**
 * Codifica la longitud en formato BER (forma corta si < 128, o forma larga).
 */
export function encodeLength(len: number): Buffer {
  if (len < 0) {
    throw new AppError('PARSE_ERROR', 'Longitud negativa inválida en BER.');
  }
  if (len < 128) {
    return Buffer.from([len]);
  }

  const bytes: number[] = [];
  let temp = len;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp = temp >>> 8;
  }
  // 0x80 | cantidad de bytes de longitud
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

/**
 * Decodifica una longitud BER desde un buffer.
 */
export function decodeLength(buf: Buffer, offset: number): { length: number; bytesRead: number } {
  if (offset >= buf.length) {
    throw new AppError('PARSE_ERROR', 'Buffer truncado al leer longitud BER.');
  }

  const first = buf[offset];
  if ((first & 0x80) === 0) {
    return { length: first, bytesRead: 1 };
  }

  const numBytes = first & 0x7f;
  if (numBytes === 0) {
    throw new AppError('PARSE_ERROR', 'Longitud indefinida no soportada en SNMP BER.');
  }

  if (offset + 1 + numBytes > buf.length) {
    throw new AppError('PARSE_ERROR', 'Buffer truncado en longitud BER de forma larga.');
  }

  let len = 0;
  for (let i = 0; i < numBytes; i++) {
    len = (len << 8) | buf[offset + 1 + i];
  }

  return { length: len, bytesRead: 1 + numBytes };
}

/**
 * Empaqueta un valor con su tag y longitud: [Tag, Length, Value]
 */
export function encodeTLV(tag: number, value: Buffer): Buffer {
  const lenBuf = encodeLength(value.length);
  return Buffer.concat([Buffer.from([tag]), lenBuf, value]);
}

/**
 * Decodifica el primer elemento TLV de un buffer.
 */
export function decodeTLV(buf: Buffer, offset = 0): TLV {
  if (offset >= buf.length) {
    throw new AppError('PARSE_ERROR', 'Buffer truncado al leer tag BER.');
  }

  const tag = buf[offset];
  const { length, bytesRead } = decodeLength(buf, offset + 1);
  const headerLength = 1 + bytesRead;

  if (offset + headerLength + length > buf.length) {
    throw new AppError(
      'PARSE_ERROR',
      `Longitud de valor excede el buffer. Esperado: ${length}, Disponible: ${
        buf.length - (offset + headerLength)
      }`
    );
  }

  const value = buf.subarray(offset + headerLength, offset + headerLength + length);

  return {
    tag,
    length,
    value,
    headerLength,
  };
}

/**
 * Codifica un entero de 32 bits con signo con complemento a dos mínimo.
 */
export function encodeInteger(val: number): Buffer {
  let v = Math.floor(val);

  if (v === 0) {
    return encodeTLV(BER_TAG.INTEGER, Buffer.from([0]));
  }

  const bytes: number[] = [];
  let temp = v;

  if (v > 0) {
    while (temp > 0) {
      bytes.unshift(temp & 0xff);
      temp = Math.floor(temp / 256);
    }
    // Si el bit más significativo es 1, agregar 0x00 para indicar signo positivo
    if ((bytes[0] & 0x80) !== 0) {
      bytes.unshift(0x00);
    }
  } else {
    // Negativo (complemento a dos)
    while (temp < -1) {
      bytes.unshift(temp & 0xff);
      temp = Math.floor(temp / 256);
    }
    bytes.unshift(temp & 0xff);
    // Quitar 0xff redundantes si el siguiente byte tiene bit alto en 1
    while (bytes.length > 1 && bytes[0] === 0xff && (bytes[1] & 0x80) !== 0) {
      bytes.shift();
    }
  }

  return encodeTLV(BER_TAG.INTEGER, Buffer.from(bytes));
}

/**
 * Decodifica un entero con signo desde un buffer BER.
 */
export function decodeInteger(buf: Buffer): number {
  if (buf.length === 0) return 0;
  let val = 0;
  const isNegative = (buf[0] & 0x80) !== 0;

  if (isNegative) {
    // Extensión de signo
    val = -1;
  }

  for (let i = 0; i < buf.length; i++) {
    val = (val << 8) | buf[i];
  }

  return val;
}

/**
 * Decodifica un entero sin signo (Counter32, Gauge32, TimeTicks).
 */
export function decodeUnsignedInteger(buf: Buffer): number {
  if (buf.length === 0) return 0;
  let val = 0;
  for (let i = 0; i < buf.length; i++) {
    val = val * 256 + buf[i];
  }
  return val >>> 0;
}

/**
 * Decodifica un Counter64 como string decimal usando BigInt.
 */
export function decodeCounter64(buf: Buffer): string {
  if (buf.length === 0) return '0';
  let val = BigInt(0);
  for (let i = 0; i < buf.length; i++) {
    val = (val << BigInt(8)) | BigInt(buf[i]);
  }
  return val.toString();
}

/**
 * Codifica una cadena de texto (OCTET STRING).
 */
export function encodeOctetString(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf-8');
  return encodeTLV(BER_TAG.OCTET_STRING, strBuf);
}

/**
 * Codifica un valor nulo (NULL).
 */
export function encodeNull(): Buffer {
  return encodeTLV(BER_TAG.NULL, Buffer.alloc(0));
}

/**
 * Codifica un OID en formato string ("1.3.6.1.2.1...") a su representación binaria BER.
 */
export function encodeOID(oid: string): Buffer {
  const parts = oid
    .trim()
    .replace(/^\./, '')
    .split('.')
    .map((p) => {
      const n = parseInt(p, 10);
      if (isNaN(n) || n < 0) {
        throw new AppError('PARSE_ERROR', `Componente OID inválido: ${p} en ${oid}`);
      }
      return n;
    });

  if (parts.length < 2) {
    throw new AppError('PARSE_ERROR', `OID debe tener al menos 2 componentes: ${oid}`);
  }

  // Primer byte combina los dos primeros números: 40 * a + b
  const firstByte = 40 * parts[0] + parts[1];
  const bytes: number[] = [firstByte];

  // Componentes restantes codificados en base 128 (VLQ)
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i];
    const subBytes: number[] = [val & 0x7f];
    val = Math.floor(val / 128);

    while (val > 0) {
      subBytes.unshift((val & 0x7f) | 0x80);
      val = Math.floor(val / 128);
    }

    bytes.push(...subBytes);
  }

  return encodeTLV(BER_TAG.OBJECT_IDENTIFIER, Buffer.from(bytes));
}

/**
 * Decodifica un OID binario BER a string ("1.3.6.1.2.1...").
 */
export function decodeOID(buf: Buffer): string {
  if (buf.length === 0) return '';

  const firstByte = buf[0];
  const first = Math.floor(firstByte / 40);
  const second = firstByte % 40;
  const parts: number[] = [first, second];

  let currentVal = 0;
  for (let i = 1; i < buf.length; i++) {
    const b = buf[i];
    currentVal = currentVal * 128 + (b & 0x7f);

    if ((b & 0x80) === 0) {
      parts.push(currentVal);
      currentVal = 0;
    }
  }

  return parts.join('.');
}

/**
 * Codifica una secuencia (SEQUENCE).
 */
export function encodeSequence(items: Buffer[]): Buffer {
  const combined = Buffer.concat(items);
  return encodeTLV(BER_TAG.SEQUENCE, combined);
}
