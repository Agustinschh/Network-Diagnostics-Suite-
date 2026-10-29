import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Device } from '../models/Device';

export interface UpsertDeviceData {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  serialNumber?: string;
  vendor?: string;
  model?: string;
  openPorts?: number[];
  discoverySource?: 'tcp' | 'mdns' | 'snmp' | 'manual';
}

export const devicesRepository = {
  getCollection() {
    return database.get<Device>('devices');
  },

  async getById(id: string): Promise<Device | null> {
    try {
      return await this.getCollection().find(id);
    } catch {
      return null;
    }
  },

  async getByIp(ip: string): Promise<Device | null> {
    const list = await this.getCollection().query(Q.where('ip_address', ip)).fetch();
    return list.length > 0 ? list[0] : null;
  },

  async upsertByIp(data: UpsertDeviceData): Promise<Device> {
    return await database.write(async () => {
      const existing = await this.getByIp(data.ipAddress);
      const now = Date.now();

      if (existing) {
        return await existing.update((record) => {
          if (data.macAddress) record.macAddress = data.macAddress;
          if (data.hostname) record.hostname = data.hostname;
          if (data.serialNumber) record.serialNumber = data.serialNumber;
          if (data.vendor) record.vendor = data.vendor;
          if (data.model) record.model = data.model;
          if (data.openPorts) record.openPortsJson = JSON.stringify(data.openPorts);
          if (data.discoverySource) record.discoverySource = data.discoverySource;
          record.lastSeenAt = new Date(now);
        });
      }

      return await this.getCollection().create((record) => {
        record.ipAddress = data.ipAddress;
        record.macAddress = data.macAddress;
        record.hostname = data.hostname;
        record.serialNumber = data.serialNumber;
        record.vendor = data.vendor;
        record.model = data.model;
        record.openPortsJson = JSON.stringify(data.openPorts || []);
        record.discoverySource = data.discoverySource || 'manual';
        record.lastSeenAt = new Date(now);
      });
    });
  },

  async updateIdentity(
    id: string,
    patch: { serialNumber?: string; macAddress?: string; model?: string; vendor?: string }
  ): Promise<Device> {
    return await database.write(async () => {
      const device = await this.getCollection().find(id);
      return await device.update((record) => {
        if (patch.serialNumber) record.serialNumber = patch.serialNumber;
        if (patch.macAddress) record.macAddress = patch.macAddress;
        if (patch.model) record.model = patch.model;
        if (patch.vendor) record.vendor = patch.vendor;
      });
    });
  },

  observeAll() {
    return this.getCollection().query(Q.sortBy('last_seen_at', Q.desc)).observe();
  },
};
