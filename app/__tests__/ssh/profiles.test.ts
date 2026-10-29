import { detectSshProfile, SSH_PROFILES } from '../../src/services/ssh/profiles';
import { CredentialStore } from '../../src/services/security/CredentialStore';
import * as Keychain from 'react-native-keychain';

describe('SSH Profiles and sysDescr Detection', () => {
  it('detects MikroTik RouterOS from sysDescr', () => {
    const descr = 'RouterOS v7.12.1 (tile) on CCR1036-8G-2S+';
    expect(detectSshProfile(descr)).toBe('mikrotik');
  });

  it('detects Cisco IOS from sysDescr', () => {
    const descr =
      'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)';
    expect(detectSshProfile(descr)).toBe('cisco_ios');
  });

  it('detects OpenWrt from sysDescr', () => {
    const descr = 'OpenWrt 22.03.5 r20134-5f15225c1e / LuCI openwrt-22.03 branch';
    expect(detectSshProfile(descr)).toBe('openwrt');
  });

  it('detects Huawei VRP from sysDescr', () => {
    const descr = 'Huawei Versatile Routing Platform Software VRP (R) software, Version 5.170';
    expect(detectSshProfile(descr)).toBe('huawei_vrp');
  });

  it('detects generic Linux from sysDescr', () => {
    const descr = 'Linux ubuntu-server 5.15.0-89-generic #99-Ubuntu SMP';
    expect(detectSshProfile(descr)).toBe('linux');
  });

  it('defaults to linux when sysDescr is empty or unknown', () => {
    expect(detectSshProfile('')).toBe('linux');
    expect(detectSshProfile(undefined)).toBe('linux');
    expect(detectSshProfile('Generic Printer Firmware 1.0')).toBe('linux');
  });

  it('contains expected commands for all 5 closed profiles', () => {
    expect(SSH_PROFILES.cisco_ios.commands).toContain('terminal length 0');
    expect(SSH_PROFILES.cisco_ios.commands).toContain('show version');

    expect(SSH_PROFILES.mikrotik.commands).toContain('/system resource print');
    expect(SSH_PROFILES.mikrotik.commands).toContain('/interface print');

    expect(SSH_PROFILES.openwrt.commands).toContain('uname -a');
    expect(SSH_PROFILES.openwrt.commands).toContain('ip -br addr');

    expect(SSH_PROFILES.huawei_vrp.commands).toContain('display version');
    expect(SSH_PROFILES.huawei_vrp.commands).toContain('display ip interface brief');

    expect(SSH_PROFILES.linux.commands).toContain('uname -a');
    expect(SSH_PROFILES.linux.commands).toContain('uptime');
  });
});

describe('CredentialStore with Keychain Mock', () => {
  const deviceId = 'test-device-uuid-1234';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and reads SSH credentials correctly', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'admin_tech',
      password: 'super_secret_password_123',
    });

    await CredentialStore.saveSsh(deviceId, {
      username: 'admin_tech',
      password: 'super_secret_password_123',
    });

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'admin_tech',
      'super_secret_password_123',
      expect.objectContaining({
        service: `netdiag.ssh.${deviceId}`,
      })
    );

    const creds = await CredentialStore.getSsh(deviceId);
    expect(creds).toEqual({
      username: 'admin_tech',
      password: 'super_secret_password_123',
    });
  });

  it('saves and reads SNMP community correctly', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
      username: 'snmp',
      password: 'noc_community_read',
    });

    await CredentialStore.saveSnmpCommunity(deviceId, 'noc_community_read');

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'snmp',
      'noc_community_read',
      expect.objectContaining({
        service: `netdiag.snmp.${deviceId}`,
      })
    );

    const comm = await CredentialStore.getSnmpCommunity(deviceId);
    expect(comm).toBe('noc_community_read');
  });

  it('deletes credentials cleanly', async () => {
    await CredentialStore.deleteSsh(deviceId);
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: `netdiag.ssh.${deviceId}`,
    });

    await CredentialStore.deleteAll(deviceId);
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: `netdiag.snmp.${deviceId}`,
    });
  });
});
