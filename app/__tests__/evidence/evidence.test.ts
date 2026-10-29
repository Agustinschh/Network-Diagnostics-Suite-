import { LocationService } from '../../src/services/evidence/LocationService';
import { PhotoService } from '../../src/services/evidence/PhotoService';
import { database } from '../../src/db';
import { EvidencePhoto } from '../../src/db/models/EvidencePhoto';
import Geolocation from 'react-native-geolocation-service';
import * as RNFS from '@dr.pogodin/react-native-fs';
import ImageResizer from '@bam.tech/react-native-image-resizer';

describe('LocationService (GPS fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves single high-accuracy GPS fix successfully', async () => {
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce((success) => {
      success({
        coords: {
          latitude: -34.603722,
          longitude: -58.381592,
          altitude: 25.4,
          accuracy: 12.5,
        },
        timestamp: 1698500000000,
      });
    });

    const fix = await LocationService.getCurrentFix();
    expect(fix.latitude).toBeCloseTo(-34.603722);
    expect(fix.longitude).toBeCloseTo(-58.381592);
    expect(fix.accuracy).toBe(12.5);
    expect(fix.lowAccuracy).toBe(false);
  });

  it('marks lowAccuracy as true when accuracy is worse than 30 meters', async () => {
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementationOnce((success) => {
      success({
        coords: {
          latitude: -34.603722,
          longitude: -58.381592,
          altitude: 25.4,
          accuracy: 45.0, // > 30m
        },
        timestamp: 1698500000000,
      });
    });

    const fix = await LocationService.getCurrentFix();
    expect(fix.accuracy).toBe(45.0);
    expect(fix.lowAccuracy).toBe(true);
  });
});

describe('PhotoService (Evidence collection and compression)', () => {
  const installationId = 'test-install-uuid-999';

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('captures, resizes and stores evidence photo in WatermelonDB', async () => {
    const rawPath = '/tmp/camera_temp_123.jpg';

    const photo = await PhotoService.capture(rawPath, installationId, 'RACK');

    expect(ImageResizer.createResizedImage).toHaveBeenCalledWith(
      'file:///tmp/camera_temp_123.jpg',
      1600,
      1600,
      'JPEG',
      70,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );

    expect(RNFS.mkdir).toHaveBeenCalledWith(
      expect.stringContaining(`photos/${installationId}`)
    );
    expect(RNFS.moveFile).toHaveBeenCalled();
    expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/camera_temp_123.jpg');

    expect(photo.installationId).toBe(installationId);
    expect(photo.photoType).toBe('RACK');
    expect(photo.width).toBe(1600);
    expect(photo.height).toBe(1200);

    const list = await PhotoService.listByInstallation(installationId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(photo.id);
  });

  it('deletes evidence photo from database and filesystem', async () => {
    const photo = await PhotoService.capture('/tmp/pic.jpg', installationId, 'OPTICAL_POWER');

    let list = await PhotoService.listByInstallation(installationId);
    expect(list.length).toBe(1);

    await PhotoService.delete(photo.id);

    list = await PhotoService.listByInstallation(installationId);
    expect(list.length).toBe(0);
    expect(RNFS.unlink).toHaveBeenCalledWith(photo.photoLocalUri.replace('file://', ''));
  });

  it('enforces maximum 12 photos per installation limit', async () => {
    // Crear 12 fotos
    for (let i = 0; i < 12; i++) {
      await PhotoService.capture(`/tmp/pic_${i}.jpg`, installationId, 'ENVIRONMENT');
    }

    const list = await PhotoService.listByInstallation(installationId);
    expect(list.length).toBe(12);

    // El intento 13 debe fallar
    await expect(
      PhotoService.capture('/tmp/pic_13.jpg', installationId, 'SERIAL_LABEL')
    ).rejects.toThrow('Se alcanzó el límite máximo de 12 fotografías');
  });
});
