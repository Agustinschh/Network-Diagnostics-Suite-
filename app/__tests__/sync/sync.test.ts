import { calculateBackoff, shouldRetry } from '../../src/services/sync/backoff';
import { SyncManager } from '../../src/services/sync/SyncManager';
import { SyncApi } from '../../src/services/sync/SyncApi';
import { database } from '../../src/db';
import { outboxRepository } from '../../src/db/repositories/outbox';
import { SYNC } from '../../src/config/constants';

describe('Backoff and Retry Logic (RF-07, RNF-07)', () => {
  it('increases delay exponentially with retry count', () => {
    // Probar múltiples muestras para verificar tendencia exponencial promedio
    const d0 = calculateBackoff(0, 5000, 1800000);
    const d1 = calculateBackoff(1, 5000, 1800000);
    const d2 = calculateBackoff(2, 5000, 1800000);

    // Con +-20% jitter:
    // d0 está en [4000, 6000]
    // d1 está en [8000, 12000]
    // d2 está en [16000, 24000]
    expect(d0).toBeGreaterThanOrEqual(4000);
    expect(d0).toBeLessThanOrEqual(6000);

    expect(d1).toBeGreaterThanOrEqual(8000);
    expect(d1).toBeLessThanOrEqual(12000);

    expect(d2).toBeGreaterThanOrEqual(16000);
    expect(d2).toBeLessThanOrEqual(24000);
  });

  it('clamps maximum delay to MAX_DELAY_MS', () => {
    const maxDelay = 60000; // 60 segundos
    const highRetryDelay = calculateBackoff(20, 5000, maxDelay);
    // Con 20% jitter sobre maxDelay:
    expect(highRetryDelay).toBeLessThanOrEqual(maxDelay * 1.25);
  });

  it('determines retry eligibility up to 8 attempts', () => {
    expect(shouldRetry(0, 8)).toBe(true);
    expect(shouldRetry(7, 8)).toBe(true);
    expect(shouldRetry(8, 8)).toBe(false);
    expect(shouldRetry(9, 8)).toBe(false);
  });
});

describe('SyncManager Outbox Processing', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('processes pending outbox items and marks them SYNCED on success', async () => {
    // 1. Encolar ítem en outbox
    const payload = {
      installationId: 'inst-sync-01',
      siteName: 'Nodo Test',
    };

    const item = await outboxRepository.enqueue('INSTALLATION', 'inst-sync-01', payload);
    expect(item.status).toBe('PENDING');

    // 2. Mockear SyncApi exitoso
    const postInstSpy = jest.spyOn(SyncApi, 'postInstallation').mockResolvedValueOnce({
      status: 'created',
      id: 'inst-sync-01',
    });

    const manager = SyncManager.getInstance();
    const processed = await manager.syncNow();

    expect(processed).toBe(1);
    expect(postInstSpy).toHaveBeenCalledWith(payload);

    // 3. Verificar estado SYNCED en BD
    const updated = await database.get('outbox').find(item.id);
    expect((updated as any).status).toBe('SYNCED');
  });

  it('applies exponential backoff and increments retry count on network failure', async () => {
    const payload = {
      deviceId: 'dev-01',
      kind: 'snmp',
    };

    const item = await outboxRepository.enqueue('DIAGNOSTIC', 'diag-01', payload);

    // Mockear fallo de red en SyncApi
    jest.spyOn(SyncApi, 'postDiagnostic').mockRejectedValueOnce(new Error('Network timeout'));

    const manager = SyncManager.getInstance();
    await manager.syncNow();

    const updated: any = await database.get('outbox').find(item.id);
    expect(updated.status).toBe('PENDING'); // Sigue PENDING para ser tomado cuando expire nextAttemptAt
    expect(updated.retryCount).toBe(1);
    expect(updated.nextAttemptAt).toBeGreaterThan(Date.now());
  });
});
