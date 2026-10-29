import { create } from 'zustand';
import {
  DiscoveryService,
  DiscoveredHost,
  ScanProgress,
  LocalNetworkInfo,
} from '../services/discovery/DiscoveryService';
import { PermissionService } from '../services/permissions/PermissionService';
import { userErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

interface ScanState {
  status: ScanStatus;
  hosts: DiscoveredHost[];
  progress: ScanProgress;
  error: string | null;
  networkInfo: LocalNetworkInfo | null;
  abortController: AbortController | null;

  refreshNetworkInfo: () => Promise<void>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  status: 'idle',
  hosts: [],
  progress: { scanned: 0, total: 0, found: 0 },
  error: null,
  networkInfo: null,
  abortController: null,

  async refreshNetworkInfo() {
    try {
      const net = await DiscoveryService.getLocalNetwork();
      set({ networkInfo: net, error: null });
    } catch (e: any) {
      set({ networkInfo: null, error: userErrorMessage(e) });
    }
  },

  async startScan() {
    const { status, abortController } = get();
    if (status === 'scanning') return;

    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();

    try {
      // 1. Asegurar permiso de ubicación requerido por Android para Wi-Fi
      await PermissionService.ensure('location');

      // 2. Obtener red local
      const net = await DiscoveryService.getLocalNetwork();

      set({
        status: 'scanning',
        error: null,
        hosts: [],
        progress: { scanned: 0, total: 0, found: 0 },
        networkInfo: net,
        abortController: controller,
      });

      // 3. Ejecutar escaneo
      const results = await DiscoveryService.scan(
        (newHost) => {
          set((state) => {
            const exists = state.hosts.some((h) => h.ip === newHost.ip);
            if (exists) {
              return {
                hosts: state.hosts.map((h) => (h.ip === newHost.ip ? newHost : h)),
              };
            }
            return {
              hosts: [...state.hosts, newHost],
            };
          });
        },
        (progress) => {
          set({ progress });
        },
        controller.signal
      );

      set({
        status: 'done',
        hosts: results,
        abortController: null,
      });
    } catch (e: any) {
      if (controller.signal.aborted) {
        set({ status: 'done', abortController: null });
        return;
      }
      logger.error('Error durante el escaneo de red:', e);
      set({
        status: 'error',
        error: userErrorMessage(e),
        abortController: null,
      });
    }
  },

  stopScan() {
    const { abortController, status } = get();
    if (status === 'scanning' && abortController) {
      abortController.abort();
      set({ status: 'done', abortController: null });
    }
  },

  reset() {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      status: 'idle',
      hosts: [],
      progress: { scanned: 0, total: 0, found: 0 },
      error: null,
      abortController: null,
    });
  },
}));
