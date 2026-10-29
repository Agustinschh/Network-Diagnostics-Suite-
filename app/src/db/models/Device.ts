import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import type { Diagnostic } from './Diagnostic';
import type { Installation } from './Installation';

export class Device extends Model {
  static table = 'devices';
  static associations = {
    diagnostics: { type: 'has_many' as const, foreignKey: 'device_id' },
    installations: { type: 'has_many' as const, foreignKey: 'device_id' },
  };

  @field('ip_address') ipAddress!: string;
  @field('mac_address') macAddress?: string;
  @field('hostname') hostname?: string;
  @field('serial_number') serialNumber?: string;
  @field('vendor') vendor?: string;
  @field('model') model?: string;
  @field('open_ports') openPortsJson!: string;
  @field('discovery_source') discoverySource!: string;
  @date('last_seen_at') lastSeenAt!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('diagnostics') diagnostics!: any;
  @children('installations') installations!: any;

  get parsedOpenPorts(): number[] {
    try {
      return JSON.parse(this.openPortsJson || '[]');
    } catch {
      return [];
    }
  }
}
