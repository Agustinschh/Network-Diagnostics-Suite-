import { SYNC } from '../../config/constants';

/**
 * Calcula el tiempo de espera exponencial con variación aleatoria (jitter) de ±20%.
 * delay = min(BASE_DELAY_MS * 2^retryCount, MAX_DELAY_MS)
 * jitter = delay * (±0.2)
 */
export function calculateBackoff(
  retryCount: number,
  baseDelayMs: number = SYNC.BASE_DELAY_MS,
  maxDelayMs: number = SYNC.MAX_DELAY_MS
): number {
  if (retryCount < 0) retryCount = 0;

  // Crecimiento exponencial acotado
  const rawDelay = Math.min(baseDelayMs * Math.pow(2, retryCount), maxDelayMs);

  // Variación aleatoria (jitter) de ±20% para evitar sincronización simultánea ("thundering herd")
  const jitterFactor = (Math.random() * 0.4) - 0.2; // entre -0.2 y +0.2
  const delayWithJitter = rawDelay + rawDelay * jitterFactor;

  return Math.max(1000, Math.round(delayWithJitter));
}

/**
 * Determina si un elemento de Outbox puede seguir reintentando su envío.
 */
export function shouldRetry(
  retryCount: number,
  maxRetries: number = SYNC.MAX_RETRIES
): boolean {
  return retryCount < maxRetries;
}
