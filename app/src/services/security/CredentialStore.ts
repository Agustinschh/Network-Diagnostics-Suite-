import * as Keychain from 'react-native-keychain';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

export interface SshCredentials {
  username: string;
  password: string;
}

export class CredentialStore {
  private static getSshService(deviceId: string): string {
    return `netdiag.ssh.${deviceId}`;
  }

  private static getSnmpService(deviceId: string): string {
    return `netdiag.snmp.${deviceId}`;
  }

  /**
   * Guarda credenciales con reintento seguro con fallback a ANY si SECURE_HARDWARE no está soportado.
   */
  private static async setWithFallback(
    service: string,
    username: string,
    secret: string
  ): Promise<void> {
    try {
      await Keychain.setGenericPassword(username, secret, {
        service,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
    } catch (hardwareErr) {
      logger.warn(
        `SECURE_HARDWARE no disponible para el servicio ${service}. Reintentando con SECURITY_LEVEL.ANY...`
      );
      try {
        await Keychain.setGenericPassword(username, secret, {
          service,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          securityLevel: Keychain.SECURITY_LEVEL.ANY,
        });
      } catch (fallbackErr: any) {
        throw new AppError(
          'STORAGE_ERROR',
          `No se pudieron guardar las credenciales de forma segura: ${fallbackErr?.message || 'Error desconocido'}`
        );
      }
    }
  }

  /**
   * Guarda usuario y contraseña SSH para un dispositivo.
   */
  static async saveSsh(deviceId: string, creds: SshCredentials): Promise<void> {
    if (!deviceId) throw new AppError('UNKNOWN', 'ID de dispositivo requerido.');
    if (!creds.username || !creds.password) {
      throw new AppError('UNKNOWN', 'Usuario y contraseña SSH requeridos.');
    }
    const service = this.getSshService(deviceId);
    await this.setWithFallback(service, creds.username, creds.password);
  }

  /**
   * Recupera usuario y contraseña SSH para un dispositivo.
   */
  static async getSsh(deviceId: string): Promise<SshCredentials | null> {
    if (!deviceId) return null;
    try {
      const service = this.getSshService(deviceId);
      const res = await Keychain.getGenericPassword({ service });
      if (res && typeof res !== 'boolean') {
        return {
          username: res.username,
          password: res.password,
        };
      }
      return null;
    } catch (err: any) {
      logger.warn(`Error al consultar credenciales SSH para deviceId ${deviceId}:`, err?.message);
      return null;
    }
  }

  /**
   * Elimina credenciales SSH de un dispositivo.
   */
  static async deleteSsh(deviceId: string): Promise<void> {
    if (!deviceId) return;
    try {
      const service = this.getSshService(deviceId);
      await Keychain.resetGenericPassword({ service });
    } catch (err: any) {
      logger.warn(`Error al eliminar credenciales SSH para deviceId ${deviceId}:`, err?.message);
    }
  }

  /**
   * Guarda la comunidad SNMP para un dispositivo.
   */
  static async saveSnmpCommunity(deviceId: string, community: string): Promise<void> {
    if (!deviceId) throw new AppError('UNKNOWN', 'ID de dispositivo requerido.');
    if (!community) throw new AppError('UNKNOWN', 'Comunidad SNMP requerida.');
    const service = this.getSnmpService(deviceId);
    await this.setWithFallback(service, 'snmp', community);
  }

  /**
   * Obtiene la comunidad SNMP guardada para un dispositivo.
   */
  static async getSnmpCommunity(deviceId: string): Promise<string | null> {
    if (!deviceId) return null;
    try {
      const service = this.getSnmpService(deviceId);
      const res = await Keychain.getGenericPassword({ service });
      if (res && typeof res !== 'boolean') {
        return res.password;
      }
      return null;
    } catch (err: any) {
      logger.warn(`Error al consultar comunidad SNMP para deviceId ${deviceId}:`, err?.message);
      return null;
    }
  }

  /**
   * Elimina todas las credenciales asociadas a un dispositivo (SSH y SNMP).
   */
  static async deleteAll(deviceId: string): Promise<void> {
    if (!deviceId) return;
    await Promise.all([
      this.deleteSsh(deviceId),
      Keychain.resetGenericPassword({ service: this.getSnmpService(deviceId) }).catch(() => {}),
    ]);
  }
}
