import { Platform } from 'react-native';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export type AppPermissionType = 'location' | 'camera';

export const PermissionService = {
  getPermissionKey(type: AppPermissionType): Permission | null {
    if (Platform.OS === 'android') {
      if (type === 'location') return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      if (type === 'camera') return PERMISSIONS.ANDROID.CAMERA;
    }
    return null;
  },

  async check(type: AppPermissionType): Promise<'granted' | 'denied' | 'blocked'> {
    const key = this.getPermissionKey(type);
    if (!key) return 'granted';

    try {
      const result = await check(key);
      if (result === RESULTS.GRANTED) return 'granted';
      if (result === RESULTS.BLOCKED) return 'blocked';
      return 'denied';
    } catch (e) {
      logger.warn('Error al verificar permiso:', type, e);
      return 'denied';
    }
  },

  async request(type: AppPermissionType): Promise<'granted' | 'denied' | 'blocked'> {
    const key = this.getPermissionKey(type);
    if (!key) return 'granted';

    try {
      const result = await request(key);
      if (result === RESULTS.GRANTED) return 'granted';
      if (result === RESULTS.BLOCKED) return 'blocked';
      return 'denied';
    } catch (e) {
      logger.warn('Error al solicitar permiso:', type, e);
      return 'denied';
    }
  },

  async ensure(type: AppPermissionType): Promise<'granted' | 'denied' | 'blocked'> {
    const status = await this.check(type);
    if (status === 'granted') return 'granted';

    if (status === 'denied') {
      const requested = await this.request(type);
      if (requested === 'granted') return 'granted';
      if (requested === 'blocked') return 'blocked';
      throw new AppError('PERMISSION_DENIED', `El permiso de ${type} fue denegado.`);
    }

    if (status === 'blocked') {
      throw new AppError(
        'PERMISSION_DENIED',
        `El permiso de ${type} está bloqueado en el sistema.`
      );
    }

    return 'denied';
  },

  async openAppSettings(): Promise<void> {
    await openSettings();
  },
};
