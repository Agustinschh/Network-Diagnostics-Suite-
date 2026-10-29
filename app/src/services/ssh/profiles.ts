export const SSH_PROFILES = {
  cisco_ios: {
    label: 'Cisco IOS',
    commands: [
      'terminal length 0',
      'show version',
      'show ip interface brief',
      'show interfaces status',
    ],
  },
  mikrotik: {
    label: 'MikroTik RouterOS',
    commands: [
      '/system resource print',
      '/interface print',
      '/ip address print',
      '/ping 8.8.8.8 count=3',
    ],
  },
  openwrt: {
    label: 'OpenWrt',
    commands: [
      'uname -a',
      'uptime',
      'ip -br addr',
      'ping -c 3 8.8.8.8',
    ],
  },
  huawei_vrp: {
    label: 'Huawei VRP',
    commands: [
      'screen-length 0 temporary',
      'display version',
      'display ip interface brief',
    ],
  },
  linux: {
    label: 'Linux genérico',
    commands: [
      'uname -a',
      'uptime',
      'ip -br addr',
      'ping -c 3 8.8.8.8',
    ],
  },
} as const;

export type SshProfileId = keyof typeof SSH_PROFILES;

/**
 * Detecta automáticamente el perfil SSH sugerido a partir de sysDescr (MIB-II).
 */
export function detectSshProfile(sysDescr?: string): SshProfileId {
  if (!sysDescr) return 'linux';

  const descr = sysDescr.toLowerCase();

  if (descr.includes('cisco')) {
    return 'cisco_ios';
  }

  if (descr.includes('routeros') || descr.includes('mikrotik')) {
    return 'mikrotik';
  }

  if (descr.includes('openwrt')) {
    return 'openwrt';
  }

  if (descr.includes('huawei') || descr.includes('vrp')) {
    return 'huawei_vrp';
  }

  if (descr.includes('linux')) {
    return 'linux';
  }

  return 'linux';
}
