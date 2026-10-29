import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { SYNC } from '../../config/constants';
import { outboxRepository } from '../../db/repositories/outbox';
import { SyncApi } from './SyncApi';
import { calculateBackoff, shouldRetry } from './backoff';
import { logger } from '../../utils/logger';

export type SyncState = 'IDLE' | 'SYNCING' | 'ERROR';

export type SyncListener = (state: SyncState, counts?: { pending: number; synced: number; failed: number }) => void;

export class SyncManager {
  private static instance: SyncManager | null = null;
  private isSyncing = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  private listeners: Set<SyncListener> = new Set();
  private currentState: SyncState = 'IDLE';

  static getInstance(): SyncManager {
    if (!this.instance) {
      this.instance = new SyncManager();
    }
    return this.instance;
  }

  /**
   * Suscribe un listener a los cambios de estado del motor de sincronización.
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: SyncState): void {
    this.currentState = state;
    this.listeners.forEach((l) => l(state));
  }

  /**
   * Inicia el escuchador de conectividad Wi-Fi para disparar sincronizaciones automáticas.
   */
  startListening(): void {
    if (this.unsubscribeNetInfo) return;

    logger.info('Iniciando monitoreo de red para sincronización Outbox...');
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.type === 'wifi') {
        logger.info('Conexión Wi-Fi detectada. Disparando sincronización Outbox...');
        this.syncNow().catch((err) => {
          logger.warn('Error en sincronización automática:', err);
        });
      }
    });
  }

  /**
   * Detiene el monitoreo de red.
   */
  stopListening(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  /**
   * Ejecuta una ronda de sincronización de la cola Outbox con el backend.
   */
  async syncNow(): Promise<number> {
    if (this.isSyncing) {
      logger.debug('Sincronización ya en curso. Omitiendo invocación simultánea.');
      return 0;
    }

    this.isSyncing = true;
    this.notify('SYNCING');
    let processedCount = 0;

    try {
      // 1. Desbloquear ítems que hayan quedado colgados en IN_PROGRESS por crash previo
      await outboxRepository.resetStuck();

      // 2. Tomar lote de ítems listos para envío
      const now = Date.now();
      const items = await outboxRepository.takeDue(now, SYNC.BATCH_SIZE);

      if (items.length === 0) {
        logger.debug('No hay elementos pendientes en la cola Outbox.');
        this.notify('IDLE');
        return 0;
      }

      logger.info(`Procesando lote de ${items.length} elementos de Outbox...`);

      // 3. Procesar secuencialmente cada ítem del lote
      for (const item of items) {
        await outboxRepository.markInProgress(item.id);

        let payload: any = {};
        try {
          payload = JSON.parse(item.payloadJson);
        } catch {
          logger.error(`JSON inválido en ítem ${item.id}`);
          await outboxRepository.markFailed(item.id, 'JSON_PARSE_ERROR', true);
          continue;
        }

        try {
          if (item.entityType === 'INSTALLATION') {
            await SyncApi.postInstallation(payload);
          } else if (item.entityType === 'DIAGNOSTIC') {
            await SyncApi.postDiagnostic(payload);
          } else {
            logger.warn(`Tipo de entidad Outbox desconocido: ${item.entityType}`);
          }

          // Marcado como enviado exitosamente
          await outboxRepository.markSynced(item.id);
          processedCount++;
          logger.info(`Elemento ${item.id} (${item.entityType}) sincronizado correctamente.`);
        } catch (err: any) {
          logger.warn(`Error al enviar elemento ${item.id}:`, err?.message);

          const isClientError = err?.details?.status >= 400 && err?.details?.status < 500;

          if (isClientError) {
            // Error fatal de validación de cliente: no reintentar
            await outboxRepository.markFailed(item.id, `CLIENT_ERROR_${err.details.status}`, true);
          } else if (shouldRetry(item.retryCount)) {
            // Reintento con retroceso exponencial + jitter
            const delay = calculateBackoff(item.retryCount);
            const nextAttempt = now + delay;
            await outboxRepository.markFailed(item.id, err?.message || 'NETWORK_ERROR', false, nextAttempt);
            logger.debug(`Reintento para ${item.id} programado en ${delay}ms`);
          } else {
            // Se agotaron los reintentos
            await outboxRepository.markFailed(item.id, 'MAX_RETRIES_EXCEEDED', true);
            logger.warn(`Elemento ${item.id} agotó los ${SYNC.MAX_RETRIES} reintentos.`);
          }
        }
      }

      this.notify('IDLE');
      return processedCount;
    } catch (globalErr: any) {
      logger.error('Error general en SyncManager.syncNow:', globalErr);
      this.notify('ERROR');
      return processedCount;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = SyncManager.getInstance();
