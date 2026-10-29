import { Buffer } from 'buffer';
import {
  BER_TAG,
  encodeLength,
  decodeLength,
  encodeInteger,
  decodeInteger,
  decodeCounter64,
  encodeOID,
  decodeOID,
} from '../../src/services/snmp/ber';
import { encodeMessage, decodeMessage, SnmpMessage } from '../../src/services/snmp/pdu';

describe('SNMP BER / ASN.1 Codec Specification', () => {
  it('encodes GetRequest matching EXACT mandatory byte sequence from PLAN_IMPLEMENTACION §4.1', () => {
    // Vector de prueba obligatorio:
    // GetRequest v2c, comunidad "public", request-id 0x12345678, OID 1.3.6.1.2.1.1.5.0
    const msg: SnmpMessage = {
      version: 1, // v2c
      community: 'public',
      pduType: BER_TAG.GetRequest, // 0xA0
      requestId: 0x12345678,
      errorStatus: 0,
      errorIndex: 0,
      varbinds: [
        {
          oid: '1.3.6.1.2.1.1.5.0',
          type: BER_TAG.NULL,
          value: null,
        },
      ],
    };

    const encoded = encodeMessage(msg);
    const expectedHex =
      '302902010104067075626c6963a01c020412345678020100020100300e300c06082b060102010105000500';

    expect(encoded.length).toBe(43);
    expect(encoded.toString('hex')).toBe(expectedHex);

    // Validar decodificación del mismo mensaje
    const decoded = decodeMessage(encoded);
    expect(decoded.version).toBe(1);
    expect(decoded.community).toBe('public');
    expect(decoded.pduType).toBe(BER_TAG.GetRequest);
    expect(decoded.requestId).toBe(0x12345678);
    expect(decoded.varbinds).toHaveLength(1);
    expect(decoded.varbinds[0].oid).toBe('1.3.6.1.2.1.1.5.0');
    expect(decoded.varbinds[0].value).toBeNull();
  });

  it('performs round-trip encoding and decoding of integers with minimal two-complement', () => {
    const testIntegers = [0, 127, 128, 255, 256, -1, -129, 2147483647];

    for (const val of testIntegers) {
      const encoded = encodeInteger(val);
      // Extraer solo el valor sin el tag y length
      const tlvValue = encoded.subarray(2);
      const decoded = decodeInteger(tlvValue);
      expect(decoded).toBe(val);
    }
  });

  it('correctly handles OIDs with components > 127 (e.g. MikroTik enterprise OID)', () => {
    // 1.3.6.1.4.1.14988.1 (14988 = 0x75 * 128 + 0x0c -> f5 0c)
    const oid = '1.3.6.1.4.1.14988.1';
    const encoded = encodeOID(oid);
    // Verificar que los bytes del OID contengan 2b 06 01 04 01 f5 0c 01
    const tlvVal = encoded.subarray(2);
    expect(tlvVal.toString('hex')).toBe('2b06010401f50c01');

    const decoded = decodeOID(tlvVal);
    expect(decoded).toBe(oid);
  });

  it('encodes long-form lengths for contents >= 128 bytes', () => {
    // Longitud 200 -> 0x81 0xC8 (1 byte de longitud con valor 200)
    const len200 = encodeLength(200);
    expect(len200.toString('hex')).toBe('81c8');

    const decoded = decodeLength(len200, 0);
    expect(decoded.length).toBe(200);
    expect(decoded.bytesRead).toBe(2);
  });

  it('correctly decodes Counter64 large integers using BigInt', () => {
    // 18446744073709551615 = 0xFFFFFFFFFFFFFFFF (8 bytes de 0xFF)
    const max64Buf = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    const decoded = decodeCounter64(max64Buf);
    expect(decoded).toBe('18446744073709551615');
  });
});
