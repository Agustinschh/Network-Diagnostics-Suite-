import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';
import type { Device } from './Device';

export class Installation extends Model {
  static table = 'installations';
  static associations = {
    devices: { type: 'belongs_to' as const, key: 'device_id' },
    evidence_photos: { type: 'has_many' as const, foreignKey: 'installation_id' },
  };

  @field('device_id') deviceId!: string;
  @field('site_name') siteName!: string;
  @field('client_name') clientName!: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('altitude') altitude?: number;
  @field('accuracy') accuracy?: number;
  @field('technician_name') technicianName!: string;
  @field('technician_notes') technicianNotes!: string;
  @field('diagnostic_ids_json') diagnosticIdsJson!: string;
  @field('pdf_local_path') pdfLocalPath?: string;
  @field('status') status!: 'draft' | 'finalized';
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('devices', 'device_id') device!: any;
  @children('evidence_photos') photos!: any;

  get parsedDiagnosticIds(): string[] {
    try {
      return JSON.parse(this.diagnosticIdsJson || '[]');
    } catch {
      return [];
    }
  }
}
