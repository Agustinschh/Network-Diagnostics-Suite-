import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Device } from './Device';

export class Diagnostic extends Model {
  static table = 'diagnostics';
  static associations = {
    devices: { type: 'belongs_to' as const, key: 'device_id' },
  };

  @field('device_id') deviceId!: string;
  @field('kind') kind!: 'snmp' | 'ssh';
  @field('snmp_sys_name') snmpSysName?: string;
  @field('snmp_sys_descr') snmpSysDescr?: string;
  @field('snmp_uptime_ticks') snmpUptimeTicks?: number;
  @field('snmp_interfaces_json') snmpInterfacesJson?: string;
  @field('ssh_profile') sshProfile?: string;
  @field('ssh_output') sshOutput?: string;
  @field('success') success!: boolean;
  @field('error_code') errorCode?: string;
  @readonly @date('created_at') createdAt!: Date;

  @relation('devices', 'device_id') device!: any;

  get parsedInterfaces(): any[] {
    try {
      return JSON.parse(this.snmpInterfacesJson || '[]');
    } catch {
      return [];
    }
  }
}
