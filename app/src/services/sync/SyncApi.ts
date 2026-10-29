import { Platform } from 'react-native';
import { SYNC } from '../../config/constants';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface SyncApiResponse<T = any> {
  status: string;
  id?: string;
  data?: T;
  message?: string;
}

export class SyncApi {
  private static defaultBaseUrl =
    Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  private static customBaseUrl: string | null = null;

  static setBaseUrl(url: string): void {
    this.customBaseUrl = url.trim().replace(/\/$/, '');
  }

  static getBaseUrl(): string {
    return this.customBaseUrl || this.defaultBaseUrl;
  }

  /**
   * Ejecuta una petición HTTP POST/GET con timeout de 30 segundos vía AbortController.
   */
  private static async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, SYNC.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errBody: any = null;
        try {
          errBody = await response.json();
        } catch {}

        const status = response.status;
        const msg = errBody?.message || `HTTP ${status}: ${response.statusText}`;

        if (status >= 400 && status < 500) {
          throw new AppError('UNKNOWN', `Error de cliente (${status}): ${msg}`, { status, body: errBody });
        } else {
          throw new AppError('NETWORK_UNREACHABLE', `Error de servidor (${status}): ${msg}`, { status, body: errBody });
        }
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        throw new AppError('TIMEOUT', `Timeout de sincronización (${SYNC.REQUEST_TIMEOUT_MS}ms) hacia ${url}`);
      }
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError('NETWORK_UNREACHABLE', `No se pudo conectar al servidor de sincronización: ${err?.message || 'Fallo de red'}`);
    }
  }

  /**
   * Comprueba el estado de disponibilidad del backend.
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const res = await this.request<{ status: string }>('/api/v1/sync/health', {
        method: 'GET',
      });
      return res?.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Envía un registro de instalación al backend de forma idempotente.
   */
  static async postInstallation(payload: any): Promise<SyncApiResponse> {
    return await this.request<SyncApiResponse>('/api/v1/sync/installations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Envía un registro de diagnóstico al backend de forma idempotente.
   */
  static async postDiagnostic(payload: any): Promise<SyncApiResponse> {
    return await this.request<SyncApiResponse>('/api/v1/sync/diagnostics', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
