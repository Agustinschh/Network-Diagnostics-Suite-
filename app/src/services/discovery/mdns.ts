import Zeroconf from 'react-native-zeroconf';
import { DISCOVERY } from '../../config/constants';
import { logger } from '../../utils/logger';

export interface MdnsDevice {
  ip: string;
  hostname?: string;
  service?: string;
}

export async function scanMdns(
  services: readonly string[] = DISCOVERY.MDNS_SERVICES,
  durationMs: number = DISCOVERY.MDNS_DURATION_MS,
  signal?: AbortSignal
): Promise<MdnsDevice[]> {
  if (signal?.aborted) return [];

  const foundDevices = new Map<string, MdnsDevice>();
  let zeroconf: Zeroconf | null = null;

  return new Promise((resolve) => {
    try {
      zeroconf = new Zeroconf();

      const cleanup = () => {
        try {
          if (zeroconf) {
            zeroconf.stop();
            zeroconf.removeDeviceListeners();
            zeroconf = null;
          }
        } catch (e) {
          logger.warn('Error al detener Zeroconf:', e);
        }
      };

      zeroconf.on('resolved', (service: any) => {
        const addresses: string[] = service?.addresses || [];
        const host: string | undefined = service?.host || service?.name;

        for (const addr of addresses) {
          // Filtrar solo direcciones IPv4 (formato x.x.x.x)
          if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(addr)) {
            foundDevices.set(addr, {
              ip: addr,
              hostname: host ? host.replace(/\.local\.?$/, '') : undefined,
              service: service?.name,
            });
          }
        }
      });

      zeroconf.on('error', (err: any) => {
        logger.warn('mDNS Zeroconf error:', err);
      });

      // Escanear cada servicio configurado (ssh, http, workstation, etc.)
      for (const svc of services) {
        zeroconf.scan(svc, 'tcp', 'local.');
      }

      const timer = setTimeout(() => {
        cleanup();
        resolve(Array.from(foundDevices.values()));
      }, durationMs);

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            cleanup();
            resolve(Array.from(foundDevices.values()));
          },
          { once: true }
        );
      }
    } catch (err) {
      logger.error('Fallo al inicializar Zeroconf:', err);
      resolve([]);
    }
  });
}
