import Geolocation from 'react-native-geolocation-service';
import { GPS } from '../../config/constants';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { PermissionService } from '../permissions/PermissionService';

export interface LocationFix {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: number;
  lowAccuracy?: boolean;
}

export class LocationService {
  /**
   * Obtiene una única lectura de geolocalización GPS de alta precisión (RNF-03).
   * No utiliza watchPosition para conservar la batería del dispositivo de campo.
   */
  static async getCurrentFix(): Promise<LocationFix> {
    // 1. Asegurar permiso de ubicación
    await PermissionService.ensure('location');

    return new Promise((resolve, reject) => {
      logger.info('Solicitando posición GPS actual...');

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude, accuracy } = position.coords;
          const timestamp = position.timestamp || Date.now();
          const lowAccuracy = accuracy > GPS.ACCEPTABLE_ACCURACY_M;

          if (lowAccuracy) {
            logger.warn(
              `GPS fix con baja precisión: ${accuracy.toFixed(1)}m (límite aceptable: ${GPS.ACCEPTABLE_ACCURACY_M}m)`
            );
          } else {
            logger.info(
              `GPS fix óptimo: lat=${latitude}, lon=${longitude}, acc=${accuracy.toFixed(1)}m`
            );
          }

          resolve({
            latitude,
            longitude,
            altitude: altitude !== null ? altitude : undefined,
            accuracy,
            timestamp,
            lowAccuracy,
          });
        },
        (error) => {
          logger.error('Error al obtener posición GPS:', error);
          if (error.code === 3) {
            // TIMEOUT
            reject(
              new AppError(
                'TIMEOUT',
                'Tiempo de espera GPS agotado. Asegúrate de tener vista al cielo o habilitar Wi-Fi.'
              )
            );
          } else if (error.code === 1) {
            // PERMISSION_DENIED
            reject(
              new AppError(
                'PERMISSION_DENIED',
                'Permiso de geolocalización denegado en el dispositivo.'
              )
            );
          } else {
            reject(
              new AppError(
                'NETWORK_UNREACHABLE',
                `No se pudo fijar la señal GPS: ${error.message || 'Servicio de ubicación no disponible'}`
              )
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: GPS.TIMEOUT_MS,
          maximumAge: GPS.MAX_AGE_MS,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );
    });
  }
}
