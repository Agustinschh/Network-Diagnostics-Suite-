export const DISCOVERY = {
  PROBE_PORTS: [22, 80, 443, 23, 8291, 8080, 8443],
  TCP_TIMEOUT_MS: 400,
  CONCURRENCY: 32,
  MDNS_DURATION_MS: 5000,
  MDNS_SERVICES: ['ssh', 'http', 'workstation', 'snmp'],
  MAX_PREFIX_SCAN: 24,
  TOTAL_BUDGET_MS: 15000,
} as const;

export const SNMP = {
  PORT: 161,
  DEFAULT_COMMUNITY: 'public',
  TIMEOUT_MS: 2000,
  RETRIES: 2,
  MAX_INTERFACES: 64,
  PROBE_TIMEOUT_MS: 600, // sondeo rápido durante el discovery
} as const;

export const SSH = {
  PORT: 22,
  CONNECT_TIMEOUT_MS: 8000,
  COMMAND_TIMEOUT_MS: 15000,
  MAX_OUTPUT_BYTES: 256 * 1024,
} as const;

export const PHOTO = {
  MAX_SIDE_PX: 1600,
  JPEG_QUALITY: 70,
  MAX_PER_INSTALLATION: 12,
} as const;

export const GPS = {
  TIMEOUT_MS: 15000,
  MAX_AGE_MS: 10000,
  ACCEPTABLE_ACCURACY_M: 30,
} as const;

export const SYNC = {
  BASE_DELAY_MS: 5000,
  MAX_DELAY_MS: 30 * 60 * 1000,
  MAX_RETRIES: 8,
  REQUEST_TIMEOUT_MS: 30000,
  BATCH_SIZE: 5,
} as const;
