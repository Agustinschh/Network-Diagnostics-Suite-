import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export class EvidencePhoto extends Model {
  static table = 'evidence_photos';
  static associations = {
    installations: { type: 'belongs_to' as const, key: 'installation_id' },
  };

  @field('installation_id') installationId!: string;
  @field('photo_local_uri') photoLocalUri!: string;
  @field('photo_type') photoType!: 'RACK' | 'OPTICAL_POWER' | 'SERIAL_LABEL' | 'ENVIRONMENT';
  @field('width') width!: number;
  @field('height') height!: number;
  @readonly @date('created_at') createdAt!: Date;

  @relation('installations', 'installation_id') installation!: any;
}
