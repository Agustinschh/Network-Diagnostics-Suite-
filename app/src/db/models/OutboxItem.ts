import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class OutboxItem extends Model {
  static table = 'outbox';

  @field('entity_type') entityType!: 'INSTALLATION' | 'DIAGNOSTIC';
  @field('entity_id') entityId!: string;
  @field('payload_json') payloadJson!: string;
  @field('sync_status') status!: 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SYNCED';
  @field('retry_count') retryCount!: number;
  @field('next_attempt_at') nextAttemptAt!: number;
  @field('last_error') lastError?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get parsedPayload(): any {
    try {
      return JSON.parse(this.payloadJson || '{}');
    } catch {
      return {};
    }
  }
}
