import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { OutboxItem } from '../models/OutboxItem';

export const outboxRepository = {
  getCollection() {
    return database.get<OutboxItem>('outbox');
  },

  async enqueue(
    entityType: 'INSTALLATION' | 'DIAGNOSTIC',
    entityId: string,
    payload: any
  ): Promise<OutboxItem> {
    return await database.write(async () => {
      return await this.getCollection().create((record) => {
        record.entityType = entityType;
        record.entityId = entityId;
        record.payloadJson = JSON.stringify(payload);
        record.status = 'PENDING';
        record.retryCount = 0;
        record.nextAttemptAt = Date.now();
      });
    });
  },

  async takeDue(now: number, limit = 5): Promise<OutboxItem[]> {
    return await this.getCollection()
      .query(
        Q.where('sync_status', 'PENDING'),
        Q.where('next_attempt_at', Q.lte(now)),
        Q.sortBy('created_at', Q.asc),
        Q.take(limit)
      )
      .fetch();
  },

  async markInProgress(id: string): Promise<void> {
    await database.write(async () => {
      const item = await this.getCollection().find(id);
      await item.update((record) => {
        record.status = 'IN_PROGRESS';
      });
    });
  },

  async markSynced(id: string): Promise<void> {
    await database.write(async () => {
      const item = await this.getCollection().find(id);
      await item.update((record) => {
        record.status = 'SYNCED';
      });
    });
  },

  async markFailed(
    id: string,
    error: string,
    permanent: boolean,
    nextAttemptAt?: number
  ): Promise<void> {
    await database.write(async () => {
      const item = await this.getCollection().find(id);
      await item.update((record) => {
        record.retryCount += 1;
        record.lastError = error;
        if (permanent) {
          record.status = 'FAILED';
        } else {
          record.status = 'PENDING';
          record.nextAttemptAt = nextAttemptAt || Date.now() + 5000;
        }
      });
    });
  },

  async resetStuck(): Promise<number> {
    return await database.write(async () => {
      const stuckItems = await this.getCollection()
        .query(Q.where('sync_status', 'IN_PROGRESS'))
        .fetch();

      for (const item of stuckItems) {
        await item.update((record) => {
          record.status = 'PENDING';
        });
      }
      return stuckItems.length;
    });
  },

  observeCounts() {
    return this.getCollection()
      .query(Q.where('sync_status', Q.oneOf(['PENDING', 'IN_PROGRESS', 'FAILED'])))
      .observe();
  },
};
