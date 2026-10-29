import {
  ipToInt,
  intToIp,
  maskToPrefix,
  hostsToScan,
} from '../../src/services/discovery/subnet';

describe('Subnet Calculation & CIDR Discovery Logic', () => {
  it('correctly converts IPv4 to 32-bit int and back', () => {
    const ip = '192.168.1.1';
    const int = ipToInt(ip);
    expect(int).toBe(3232235777);
    expect(intToIp(int)).toBe(ip);

    const broadcast = '255.255.255.255';
    expect(intToIp(ipToInt(broadcast))).toBe(broadcast);

    const zero = '0.0.0.0';
    expect(intToIp(ipToInt(zero))).toBe(zero);
  });

  it('correctly converts subnet masks to CIDR prefix', () => {
    expect(maskToPrefix('255.255.255.0')).toBe(24);
    expect(maskToPrefix('255.255.0.0')).toBe(16);
    expect(maskToPrefix('255.0.0.0')).toBe(8);
    expect(maskToPrefix('255.255.255.128')).toBe(25);
    expect(maskToPrefix('255.255.255.252')).toBe(30);
  });

  it('generates 253 hosts for a /24 excluding network, broadcast and own IP', () => {
    const hosts = hostsToScan('192.168.1.37', '255.255.255.0');

    expect(hosts).toHaveLength(253);
    expect(hosts).not.toContain('192.168.1.0'); // red
    expect(hosts).not.toContain('192.168.1.255'); // broadcast
    expect(hosts).not.toContain('192.168.1.37'); // IP propia del teléfono

    // El primer host debe ser .1 y el último .254
    expect(hosts[0]).toBe('192.168.1.1');
    expect(hosts[hosts.length - 1]).toBe('192.168.1.254');
  });

  it('limits wide subnets (such as /16) to the /24 containing the local IP (Rule C3)', () => {
    // Si la máscara es 255.255.0.0 (/16), no debe generar 65534 hosts sino los 253 de la /24 local
    const hosts = hostsToScan('192.168.10.45', '255.255.0.0');

    expect(hosts).toHaveLength(253);
    expect(hosts[0]).toBe('192.168.10.1');
    expect(hosts[hosts.length - 1]).toBe('192.168.10.254');
    expect(hosts).not.toContain('192.168.10.45');
    expect(hosts).not.toContain('192.168.11.1'); // No se desborda a otras /24
  });
});
