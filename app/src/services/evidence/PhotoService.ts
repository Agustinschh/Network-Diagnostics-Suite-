import { Q } from '@nozbe/watermelondb';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { v4 as uuidv4 } from 'uuid';
import { PHOTO } from '../../config/constants';
import { database } from '../../db';
import { EvidencePhoto } from '../../db/models/EvidencePhoto';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export type PhotoType = 'RACK' | 'OPTICAL_POWER' | 'SERIAL_LABEL' | 'ENVIRONMENT';

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  RACK: 'Rack / Gabinete',
  OPTICAL_POWER: 'Potencia óptica',
  SERIAL_LABEL: 'Etiqueta / Serial',
  ENVIRONMENT: 'Entorno / Sitio',
};

export class PhotoService {
  /**
   * Captura una foto desde la cámara, la redimensiona a máx 1600px en JPEG 70%,
   * la traslada al directorio permanente de evidencias y la registra en la BD.
   */
  static async capture(
    rawPhotoPath: string,
    installationId: string,
    photoType: PhotoType
  ): Promise<EvidencePhoto> {
    if (!rawPhotoPath) {
      throw new AppError('UNKNOWN', 'Ruta de fotografía temporal inválida.');
    }

    const photosCollection = database.get<EvidencePhoto>('evidence_photos');

    // 1. Verificar límite de fotos por instalación
    const existingCount = await photosCollection
      .query(Q.where('installation_id', installationId))
      .fetchCount();

    if (existingCount >= PHOTO.MAX_PER_INSTALLATION) {
      throw new AppError(
        'UNKNOWN',
        `Se alcanzó el límite máximo de ${PHOTO.MAX_PER_INSTALLATION} fotografías para esta instalación.`
      );
    }

    // 2. Redimensionar y comprimir foto (1600 px lado mayor, JPEG 70)
    let resized: any = null;
    try {
      resized = await ImageResizer.createResizedImage(
        rawPhotoPath.startsWith('file://') ? rawPhotoPath : `file://${rawPhotoPath}`,
        PHOTO.MAX_SIDE_PX,
        PHOTO.MAX_SIDE_PX,
        'JPEG',
        PHOTO.JPEG_QUALITY,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );
    } catch (resizeErr: any) {
      logger.error('Error al redimensionar foto:', resizeErr);
      throw new AppError(
        'UNKNOWN',
        `Error al procesar la imagen: ${resizeErr?.message || 'Fallo de compresión'}`
      );
    }

    // 3. Crear directorio de destino permanente: DocumentDirectoryPath/photos/<installationId>/
    const destDir = `${RNFS.DocumentDirectoryPath}/photos/${installationId}`;
    const fileId = uuidv4();
    const destPath = `${destDir}/${fileId}.jpg`;

    try {
      await RNFS.mkdir(destDir);

      const sourceUri = resized.uri.replace('file://', '');
      await RNFS.moveFile(sourceUri, destPath);

      // Eliminar archivo original temporal
      const cleanRawPath = rawPhotoPath.replace('file://', '');
      await RNFS.unlink(cleanRawPath).catch(() => {});
    } catch (fsErr: any) {
      logger.error('Error de sistema de archivos al guardar foto:', fsErr);
      throw new AppError(
        'STORAGE_ERROR',
        `No se pudo almacenar la fotografía en el dispositivo: ${fsErr?.message || 'Error de E/S'}`
      );
    }

    // 4. Guardar registro en WatermelonDB
    let record: EvidencePhoto;
    try {
      record = await database.write(async () => {
        return await photosCollection.create((p) => {
          p.installationId = installationId;
          p.photoLocalUri = destPath;
          p.photoType = photoType;
          p.width = resized.width || 1600;
          p.height = resized.height || 1200;
        });
      });
    } catch (dbErr: any) {
      // Limpiar archivo si la BD falla
      await RNFS.unlink(destPath).catch(() => {});
      throw new AppError('STORAGE_ERROR', 'Error al guardar metadatos de la fotografía en la BD.');
    }

    logger.info(`Fotografía de evidencia guardada exitosamente: ${destPath}`);
    return record;
  }

  /**
   * Elimina una fotografía tanto del almacenamiento físico como de la base de datos.
   */
  static async delete(photoId: string): Promise<void> {
    const photosCollection = database.get<EvidencePhoto>('evidence_photos');
    const photo = await photosCollection.find(photoId);

    if (!photo) return;

    const filePath = photo.photoLocalUri;

    await database.write(async () => {
      await photo.markAsDeleted();
    });

    if (filePath) {
      const cleanPath = filePath.replace('file://', '');
      await RNFS.unlink(cleanPath).catch(() => {});
    }
  }

  /**
   * Obtiene la lista de fotografías asociadas a una instalación.
   */
  static async listByInstallation(installationId: string): Promise<EvidencePhoto[]> {
    return await database
      .get<EvidencePhoto>('evidence_photos')
      .query(Q.where('installation_id', installationId), Q.sortBy('created_at', Q.asc))
      .fetch();
  }
}
