import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import { SnmpClient } from '../../src/services/snmp/SnmpClient';
import { encodeMessage, SnmpMessage } from '../../src/services/snmp/pdu';
import { BER_TAG } from '../../src/services/snmp/ber';
import { OID } from '../../src/services/snmp/oids';

describe('SnmpClient Network Logic & Data Decoding', () => {
  it('correctly retrieves and maps system info from mock SNMP response', async () => {
    const client = new SnmpClient();

    // Simular que el socket UDP devuelve un GetResponse válido
    (dgram.createSocket as jest.Mock).mockImplementationOnce(() => {
      let messageHandler: ((buf: Buffer) => void) | null = null;
      let sentPacket: Buffer | null = null;

      return {
        bind: jest.fn((port, cb) => cb && cb(null)),
        send: jest.fn((buf, offset, length, p, host, cb) => {
          sentPacket = buf;
          cb && cb(null);

          // Simular respuesta tras breve tick
          setTimeout(() => {
            if (messageHandler && sentPacket) {
              // Leer el requestId que envió el cliente
              const reqId = sentPacket.readInt32BE(17);

              const responseMsg: SnmpMessage = {
                version: 1,
                community: 'public',
                pduType: BER_TAG.GetResponse,
                requestId: reqId,
                errorStatus: 0,
                errorIndex: 0,
                varbinds: [
                  {
                    oid: OID.sysDescr,
                    type: BER_TAG.OCTET_STRING,
                    value: 'MikroTik RouterOS 7.12',
                  },
                  {
                    oid: OID.sysName,
                    type: BER_TAG.OCTET_STRING,
                    value: 'router.principal',
                  },
                  {
                    oid: OID.sysUpTime,
                    type: BER_TAG.TimeTicks,
                    value: 43200000, // 5 días en centésimas
                  },
                ],
              };

              messageHandler(encodeMessage(responseMsg));
            }
          }, 10);
        }),
        on: jest.fn((event, handler) => {
          if (event === 'message') messageHandler = handler;
        }),
        close: jest.fn(),
      };
    });

    const info = await client.getSystemInfo({
      host: '192.168.1.1',
      community: 'public',
    });

    expect(info.sysName).toBe('router.principal');
    expect(info.sysDescr).toBe('MikroTik RouterOS 7.12');
    expect(info.uptimeTicks).toBe(43200000);
  });
});
