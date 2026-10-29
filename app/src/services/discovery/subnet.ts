import { DISCOVERY } from '../../config/constants';

/**
 * Convierte una dirección IPv4 (a.b.c.d) en un entero de 32 bits sin signo.
 */
export function ipToInt(ip: string): number {
  const parts = ip.trim().split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Dirección IP inválida: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Convierte un entero de 32 bits en una dirección IPv4 (a.b.c.d).
 */
export function intToIp(int: number): string {
  const n = int >>> 0;
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join('.');
}

/**
 * Calcula la longitud del prefijo CIDR a partir de una máscara de subred IPv4.
 * Ejemplo: "255.255.255.0" -> 24
 */
export function maskToPrefix(mask: string): number {
  const intMask = ipToInt(mask);
  let prefix = 0;
  for (let i = 31; i >= 0; i--) {
    if ((intMask & (1 << i)) !== 0) {
      prefix++;
    } else {
      break;
    }
  }
  return prefix;
}

/**
 * Genera la lista de direcciones IP a escanear en la subred local.
 * Regla C3: Si el prefijo es menor a /24 (ej: /16 o /8), se escanea exclusivamente
 * la /24 que contiene la IP local del teléfono para garantizar que el escaneo
 * se complete en <= 15 segundos sin desbordar memoria ni ancho de banda.
 *
 * Se excluyen explícitamente:
 * - La dirección de red (ej: .0 en /24)
 * - La dirección de broadcast (ej: .255 en /24)
 * - La dirección IP propia del teléfono
 */
export function hostsToScan(localIp: string, subnetMask: string): string[] {
  const rawPrefix = maskToPrefix(subnetMask);
  // Limitar prefijo mínimo a 24 (/24 = 254 hosts)
  const effectivePrefix = Math.max(rawPrefix, DISCOVERY.MAX_PREFIX_SCAN);

  const localIpInt = ipToInt(localIp);
  // Calcular máscara de 32 bits
  const maskInt = (0xffffffff << (32 - effectivePrefix)) >>> 0;
  const networkInt = (localIpInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | ~maskInt) >>> 0;

  const hosts: string[] = [];

  for (let current = networkInt + 1; current < broadcastInt; current++) {
    const currentIp = intToIp(current);
    if (currentIp !== localIp) {
      hosts.push(currentIp);
    }
  }

  return hosts;
}
