import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Diagnostic } from '../models/Diagnostic';

export interface CreateDiagnosticData {
  deviceId: string;
  kind: 'snmp' | 'ssh';
  snmpSysName?: string;
  snmpSysDescr?: string;
  snmpUptimeTicks?: number;
  snmpInterfaces?: any[];
  sshProfile?: string;
  sshOutput?: string;
  success: boolean;
  errorCode?: string;
}

export const diagnosticsRepository = {
  getCollection() {
    return database.get<Diagnostic>('diagnostics');
  },

  async create(data: CreateDiagnosticData): Promise<Diagnostic> {
    return await database.write(async () => {
      return await this.getCollection().create((record) => {
        record.deviceId = data.deviceId;
        record.kind = data.kind;
        record.snmpSysName = data.snmpSysName;
        record.snmpSysDescr = data.snmpSysDescr;
        record.snmpUptimeTicks = data.snmpUptimeTicks;
        record.snmpInterfacesJson = data.snmpInterfaces ? JSON.stringify(data.snmpInterfaces) : undefined;
        record.sshProfile = data.sshProfile;
        record.sshOutput = data.sshOutput;
        record.success = data.success;
        record.errorCode = data.errorCode;
      });
    });
  },

  async getById(id: string): Promise<Diagnostic | null> {
    try {
      return await this.getCollection().find(id);
    } catch {
      return null;
    }
  },

  async listByDevice(deviceId: string): Promise<Diagnostic[]> {
    return await this.getCollection()
      .query(Q.where('device_id', deviceId), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getPreviousDiagnostic(deviceId: string, beforeDate: Date, kind: 'snmp' | 'ssh'): Promise<Diagnostic | null> {
    const list = await this.getCollection()
      .query(
        Q.where('device_id', deviceId),
        Q.where('kind', kind),
        Q.where('created_at', Q.lt(beforeDate.getTime())),
        Q.sortBy('created_at', Q.desc),
        Q.take(1)
      )
      .fetch();
    return list.length > 0 ? list[0] : null;
  },

  observeRecent(limit = 50) {
    return this.getCollection()
      .query(Q.sortBy('created_at', Q.desc), Q.take(limit))
      .observe();
  },
};
