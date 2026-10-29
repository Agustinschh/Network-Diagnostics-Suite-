import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Installation } from '../models/Installation';
import { EvidencePhoto } from '../models/EvidencePhoto';

export interface CreateDraftData {
  deviceId: string;
  technicianName?: string;
  siteName?: string;
  clientName?: string;
}

export interface UpdateInstallationPatch {
  siteName?: string;
  clientName?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  technicianName?: string;
  technicianNotes?: string;
  diagnosticIds?: string[];
  pdfLocalPath?: string;
}

export const installationsRepository = {
  getCollection() {
    return database.get<Installation>('installations');
  },

  getPhotoCollection() {
    return database.get<EvidencePhoto>('evidence_photos');
  },

  async getById(id: string): Promise<Installation | null> {
    try {
      return await this.getCollection().find(id);
    } catch {
      return null;
    }
  },

  async createDraft(data: CreateDraftData): Promise<Installation> {
    return await database.write(async () => {
      return await this.getCollection().create((record) => {
        record.deviceId = data.deviceId;
        record.siteName = data.siteName || '';
        record.clientName = data.clientName || '';
        record.technicianName = data.technicianName || '';
        record.technicianNotes = '';
        record.diagnosticIdsJson = JSON.stringify([]);
        record.status = 'draft';
      });
    });
  },

  async update(id: string, patch: UpdateInstallationPatch): Promise<Installation> {
    return await database.write(async () => {
      const item = await this.getCollection().find(id);
      return await item.update((record) => {
        if (patch.siteName !== undefined) record.siteName = patch.siteName;
        if (patch.clientName !== undefined) record.clientName = patch.clientName;
        if (patch.latitude !== undefined) record.latitude = patch.latitude;
        if (patch.longitude !== undefined) record.longitude = patch.longitude;
        if (patch.altitude !== undefined) record.altitude = patch.altitude;
        if (patch.accuracy !== undefined) record.accuracy = patch.accuracy;
        if (patch.technicianName !== undefined) record.technicianName = patch.technicianName;
        if (patch.technicianNotes !== undefined) record.technicianNotes = patch.technicianNotes;
        if (patch.diagnosticIds !== undefined) record.diagnosticIdsJson = JSON.stringify(patch.diagnosticIds);
        if (patch.pdfLocalPath !== undefined) record.pdfLocalPath = patch.pdfLocalPath;
      });
    });
  },

  async finalize(id: string, pdfPath: string): Promise<Installation> {
    return await database.write(async () => {
      const item = await this.getCollection().find(id);
      return await item.update((record) => {
        record.status = 'finalized';
        record.pdfLocalPath = pdfPath;
      });
    });
  },

  async addPhoto(data: {
    installationId: string;
    photoLocalUri: string;
    photoType: 'RACK' | 'OPTICAL_POWER' | 'SERIAL_LABEL' | 'ENVIRONMENT';
    width: number;
    height: number;
  }): Promise<EvidencePhoto> {
    return await database.write(async () => {
      return await this.getPhotoCollection().create((record) => {
        record.installationId = data.installationId;
        record.photoLocalUri = data.photoLocalUri;
        record.photoType = data.photoType;
        record.width = data.width;
        record.height = data.height;
      });
    });
  },

  observeAll(filter?: { status?: 'draft' | 'finalized' }) {
    if (filter?.status) {
      return this.getCollection()
        .query(Q.where('status', filter.status), Q.sortBy('created_at', Q.desc))
        .observe();
    }
    return this.getCollection().query(Q.sortBy('created_at', Q.desc)).observe();
  },
};
