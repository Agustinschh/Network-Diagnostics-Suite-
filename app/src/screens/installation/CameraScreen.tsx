import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, usePhotoOutput } from 'react-native-vision-camera';
import { ArrowLeft, Check, AlertTriangle, Images } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Text, Button, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { PermissionService } from '../../services/permissions/PermissionService';
import { PhotoService, PhotoType, PHOTO_TYPE_LABELS } from '../../services/evidence/PhotoService';
import { EvidencePhoto } from '../../db/models/EvidencePhoto';
import { PHOTO } from '../../config/constants';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'Camera'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const PHOTO_TYPES: PhotoType[] = ['RACK', 'OPTICAL_POWER', 'SERIAL_LABEL', 'ENVIRONMENT'];

export function CameraScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { installationId } = route.params;
  const { showToast } = useToast();

  const photoOutput = usePhotoOutput();
  const device = useCameraDevice('back');

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoType, setPhotoType] = useState<PhotoType>('RACK');
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [permStatus, existingPhotos] = await Promise.all([
          PermissionService.check('camera'),
          PhotoService.listByInstallation(installationId),
        ]);

        if (mounted) {
          setPhotos(existingPhotos);
          if (permStatus === 'granted') {
            setHasPermission(true);
          } else {
            const requested = await PermissionService.request('camera');
            setHasPermission(requested === 'granted');
          }
        }
      } catch (e) {
        logger.warn('Error inicial en CameraScreen:', e);
        if (mounted) setHasPermission(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [installationId]);

  const handleCapture = async () => {
    if (isCapturing) return;

    if (photos.length >= PHOTO.MAX_PER_INSTALLATION) {
      showToast(`Límite de ${PHOTO.MAX_PER_INSTALLATION} fotografías alcanzado.`);
      return;
    }

    setIsCapturing(true);
    try {
      const shot = await photoOutput.capturePhoto({}, {});
      const tempPath = await shot.saveToTemporaryFileAsync();
      (shot as any).dispose?.();

      await PhotoService.capture(tempPath, installationId, photoType);
      const updatedList = await PhotoService.listByInstallation(installationId);
      setPhotos(updatedList);
      showToast(`Evidencia guardada: ${PHOTO_TYPE_LABELS[photoType]}`);
    } catch (err: any) {
      showToast(err?.message || 'Error al capturar la fotografía');
    } finally {
      setIsCapturing(false);
    }
  };

  const lastPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const isLimitReached = photos.length >= PHOTO.MAX_PER_INSTALLATION;

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior transparente */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text variant="heading" style={{ color: '#FFFFFF' }}>
          Captura de evidencia
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.doneButton}
        >
          <Text variant="bodyStrong" color="accent">
            Listo ({photos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selector de tipo de foto (Chips horizontales) */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PHOTO_TYPES.map((type) => {
            const isSelected = photoType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setPhotoType(type)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.colors.accent : 'rgba(0,0,0,0.6)',
                    borderColor: isSelected ? theme.colors.accent : 'rgba(255,255,255,0.3)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  style={{
                    color: isSelected ? theme.colors.onAccent : '#FFFFFF',
                    fontWeight: isSelected ? '700' : '500',
                  }}
                >
                  {PHOTO_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Visor de cámara o estado de error */}
      {hasPermission === false ? (
        <View style={styles.centeredMessage}>
          <AlertTriangle size={48} color={theme.colors.warning} />
          <Text variant="title" style={{ color: '#FFFFFF', marginTop: 16, textAlign: 'center' }}>
            Permiso de cámara requerido
          </Text>
          <Text variant="body" style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center', marginBottom: 24 }}>
            NetDiag necesita acceder a la cámara para documentar el estado físico de la instalación.
          </Text>
          <Button
            variant="primary"
            title="Abrir ajustes"
            onPress={() => PermissionService.openAppSettings()}
          />
        </View>
      ) : device ? (
        <View style={styles.cameraWrapper}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            outputs={[photoOutput]}
          />
        </View>
      ) : (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text variant="body" style={{ color: '#FFFFFF', marginTop: 16 }}>
            Iniciando cámara...
          </Text>
        </View>
      )}

      {/* Barra de controles inferior */}
      <View style={styles.bottomBar}>
        {/* Miniatura de la última foto */}
        <View style={styles.thumbnailWrapper}>
          {lastPhoto ? (
            <Image
              source={{ uri: `file://${lastPhoto.photoLocalUri}` }}
              style={styles.thumbnailImage}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Images size={20} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          <Text variant="caption" style={{ color: '#FFFFFF', marginTop: 4 }}>
            {photos.length}/{PHOTO.MAX_PER_INSTALLATION}
          </Text>
        </View>

        {/* Botón disparador */}
        <TouchableOpacity
          onPress={handleCapture}
          disabled={isCapturing || isLimitReached || !device}
          style={[
            styles.shutterButton,
            {
              opacity: isLimitReached ? 0.4 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  doneButton: {
    padding: 4,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cameraWrapper: {
    flex: 1,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bottomBar: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#000000',
  },
  thumbnailWrapper: {
    width: 60,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  shutterButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  spacer: {
    width: 60,
  },
});
