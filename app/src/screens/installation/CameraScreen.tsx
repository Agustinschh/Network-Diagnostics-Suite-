import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Text } from '../../components/ui';
import { ArrowLeft, Camera as CameraIcon } from 'lucide-react-native';

type Route = RouteProp<RootStackParamList, 'Camera'>;

export function CameraScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { installationId } = route.params;

  const [photoType, setPhotoType] = useState<'RACK' | 'OPTICAL_POWER' | 'SERIAL_LABEL' | 'ENVIRONMENT'>('RACK');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header negro con botón volver */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text variant="heading" color="onAccent" style={{ color: '#FFFFFF' }}>
          Captura de evidencia
        </Text>
      </View>

      {/* Visor de cámara simulación / componente */}
      <View style={styles.previewContainer}>
        <CameraIcon size={64} color="rgba(255,255,255,0.3)" />
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>
          Tipo: {photoType} · Instalación: {installationId}
        </Text>
      </View>

      {/* Controles inferiores */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.innerCaptureButton} />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsBar: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCaptureButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
});
