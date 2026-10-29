import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, useObjectOutput } from 'react-native-vision-camera';
import { Q } from '@nozbe/watermelondb';
import { ArrowLeft, ScanLine, AlertTriangle } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Text, Sheet, Button, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { PermissionService } from '../../services/permissions/PermissionService';
import { devicesRepository } from '../../db/repositories/devices';
import { database } from '../../db';
import { Device } from '../../db/models/Device';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'CodeScanner'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]?){5}([0-9A-Fa-f]{2})$/;

function normalizeMac(raw: string): string {
  const clean = raw.replace(/[^0-9A-Fa-f]/g, '').toLowerCase();
  return clean.match(/.{1,2}/g)?.join(':') || raw.toLowerCase();
}

export function CodeScannerScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId } = route.params;
  const { showToast } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const device = useCameraDevice('back');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await PermissionService.check('camera');
        if (mounted) {
          if (status === 'granted') {
            setHasPermission(true);
          } else {
            const requested = await PermissionService.request('camera');
            setHasPermission(requested === 'granted');
          }
        }
      } catch {
        if (mounted) setHasPermission(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleScanned = (value: string) => {
    if (scannedCode || isProcessing) return;
    Vibration.vibrate(80);
    setScannedCode(value);

    // Verificar si ya existe otro equipo con ese serial en la BD
    (async () => {
      try {
        const duplicates = await database
          .get<Device>('devices')
          .query(Q.where('serial_number', value.trim()), Q.where('id', Q.notEq(deviceId)))
          .fetch();

        if (duplicates.length > 0) {
          const prev = duplicates[0];
          const dateStr = prev.createdAt ? new Date(prev.createdAt).toLocaleDateString() : 'fecha previa';
          setDuplicateWarning(`Este número de serie ya fue registrado el ${dateStr} (IP: ${prev.ipAddress}).`);
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {
        logger.warn('Error al verificar duplicados de serial:', e);
      }
    })();
  };

  const objectOutput = useObjectOutput({
    types: ['qr', 'code-128', 'data-matrix', 'ean-13'],
    onObjectsScanned: (objects: any[]) => {
      for (const obj of objects) {
        const val = obj?.value;
        if (val) {
          handleScanned(val);
          break;
        }
      }
    },
  });

  const isMacLike = scannedCode ? MAC_REGEX.test(scannedCode.trim()) : false;

  const handleUseAsSerial = async () => {
    if (!scannedCode) return;
    setIsProcessing(true);
    try {
      await devicesRepository.updateIdentity(deviceId, {
        serialNumber: scannedCode.trim(),
      });
      showToast('N.º de serie guardado en el equipo');
      setScannedCode(null);
      navigation.goBack();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar el número de serie');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseAsMac = async () => {
    if (!scannedCode) return;
    setIsProcessing(true);
    try {
      const mac = normalizeMac(scannedCode.trim());
      await devicesRepository.updateIdentity(deviceId, {
        macAddress: mac,
      });
      showToast('Dirección MAC guardada en el equipo');
      setScannedCode(null);
      navigation.goBack();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar la dirección MAC');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text variant="heading" style={{ color: '#FFFFFF' }}>
          Escanear código
        </Text>
      </View>

      {/* Visor de cámara o estado de permiso */}
      {hasPermission === false ? (
        <View style={styles.permissionBlocked}>
          <AlertTriangle size={48} color={theme.colors.warning} />
          <Text variant="title" style={{ color: '#FFFFFF', marginTop: 16, textAlign: 'center' }}>
            Permiso de cámara necesario
          </Text>
          <Text variant="body" style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center', marginBottom: 24 }}>
            NetDiag necesita acceder a la cámara para escanear etiquetas y códigos QR de los equipos.
          </Text>
          <Button
            variant="primary"
            title="Abrir ajustes"
            onPress={() => PermissionService.openAppSettings()}
          />
        </View>
      ) : device ? (
        <View style={styles.cameraContainer}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!scannedCode}
            outputs={[objectOutput]}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.reticle}>
              <ScanLine size={48} color={theme.colors.accent} />
            </View>
            <Text variant="body" style={styles.hintText}>
              Apuntá la cámara a la etiqueta del equipo
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.permissionBlocked}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text variant="body" style={{ color: '#FFFFFF', marginTop: 16 }}>
            Iniciando cámara...
          </Text>
        </View>
      )}

      {/* Sheet de selección de acción tras escaneo */}
      <Sheet
        visible={Boolean(scannedCode)}
        onClose={() => setScannedCode(null)}
        title="Código detectado"
      >
        <View style={{ paddingBottom: theme.spacing.lg }}>
          <View
            style={[
              styles.codeBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            <Text variant="label" color="textSecondary">
              VALOR LEÍDO
            </Text>
            <Text
              variant="heading"
              color="textPrimary"
              style={{ fontFamily: theme.typography.mono.fontFamily, marginTop: 4 }}
            >
              {scannedCode}
            </Text>
          </View>

          {duplicateWarning && (
            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: theme.colors.warningSubtle,
                  borderColor: theme.colors.warning,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              <Text variant="caption" color="warning" style={{ fontWeight: '600' }}>
                {duplicateWarning}
              </Text>
            </View>
          )}

          <Text variant="body" color="textSecondary" style={{ marginBottom: theme.spacing.lg }}>
            ¿Cómo deseas asignar este valor al equipo?
          </Text>

          <Button
            variant={isMacLike ? 'secondary' : 'primary'}
            title="Usar como N.º de serie"
            disabled={isProcessing}
            fullWidth
            onPress={handleUseAsSerial}
            style={{ marginBottom: theme.spacing.md }}
          />

          <Button
            variant={isMacLike ? 'primary' : 'secondary'}
            title={isMacLike ? `Usar como MAC (${normalizeMac(scannedCode || '')})` : 'Usar como MAC'}
            disabled={isProcessing}
            fullWidth
            onPress={handleUseAsMac}
          />
        </View>
      </Sheet>
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
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  reticle: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hintText: {
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  permissionBlocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  codeBox: {
    borderWidth: 1,
  },
  warningBox: {
    borderWidth: 1,
  },
});
