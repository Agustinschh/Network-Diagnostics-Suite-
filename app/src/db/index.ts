import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { v4 as uuidv4 } from 'uuid';

import { schema } from './schema';
import { migrations } from './migrations';
import {
  Device,
  Diagnostic,
  Installation,
  EvidencePhoto,
  OutboxItem,
  Setting,
} from './models';

// Configurar generador de IDs UUID v4 para idempotencia estricta en sincronización (RNF-07)
setGenerator(() => uuidv4());

const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

const adapter = isTestEnv
  ? new LokiJSAdapter({
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    })
  : new SQLiteAdapter({
      schema,
      migrations,
      jsi: false,
      onSetUpError: (error) => {
        console.error('Error al inicializar SQLiteAdapter en WatermelonDB:', error);
      },
    });

export const database = new Database({
  adapter,
  modelClasses: [
    Device,
    Diagnostic,
    Installation,
    EvidencePhoto,
    OutboxItem,
    Setting,
  ],
});
