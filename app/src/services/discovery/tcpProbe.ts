import TcpSocket from 'react-native-tcp-socket';
import { DISCOVERY } from '../../config/constants';

export interface ProbeResult {
  alive: boolean;
  openPorts: number[];
  rttMs?: number;
}

/**
 * Sondea un puerto TCP específico en una IP destino.
 */
function probePort(
  ip: string,
  port: number,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<{ port: number; isOpen: boolean; alive: boolean; rttMs: number }> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ port, isOpen: false, alive: false, rttMs: timeoutMs });
      return;
    }

    const startTime = Date.now();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          client.destroy();
        } catch {}
      }
    };

    const client = TcpSocket.createConnection({ port, host: ip }, () => {
      const rttMs = Date.now() - startTime;
      cleanup();
      resolve({ port, isOpen: true, alive: true, rttMs });
    });

    client.setTimeout(timeoutMs);

    client.on('timeout', () => {
      cleanup();
      resolve({ port, isOpen: false, alive: false, rttMs: timeoutMs });
    });

    client.on('error', (err: any) => {
      const rttMs = Date.now() - startTime;
      const message = String(err?.message || err);
      // ECONNREFUSED significa que el host está activo y respondió con un TCP RST
      const isRefused =
        message.includes('ECONNREFUSED') ||
        message.includes('Connection refused') ||
        err?.code === 'ECONNREFUSED';

      cleanup();
      resolve({
        port,
        isOpen: false,
        alive: isRefused,
        rttMs,
      });
    });

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          cleanup();
          resolve({ port, isOpen: false, alive: false, rttMs: timeoutMs });
        },
        { once: true }
      );
    }
  });
}

/**
 * Sondea un host en la subred probando los puertos comunes de telecomunicaciones en paralelo.
 */
export async function probeHost(
  ip: string,
  ports: readonly number[] = DISCOVERY.PROBE_PORTS,
  timeoutMs: number = DISCOVERY.TCP_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<ProbeResult> {
  if (signal?.aborted) {
    return { alive: false, openPorts: [] };
  }

  const probes = ports.map((port) => probePort(ip, port, timeoutMs, signal));
  const results = await Promise.all(probes);

  const openPorts: number[] = [];
  let isAlive = false;
  let minRtt: number | undefined;

  for (const r of results) {
    if (r.isOpen) {
      openPorts.push(r.port);
      isAlive = true;
    }
    if (r.alive) {
      isAlive = true;
    }
    if (r.alive || r.isOpen) {
      if (minRtt === undefined || r.rttMs < minRtt) {
        minRtt = r.rttMs;
      }
    }
  }

  return {
    alive: isAlive,
    openPorts,
    rttMs: minRtt,
  };
}
