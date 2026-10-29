import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { Text } from '../../components/ui';
import { ArrowLeft, ScanLine } from 'lucide-react-native';

type Route = RouteProp<RootStackParamList, 'CodeScanner'>;

export function CodeScannerScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { deviceId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.scanArea}>
        <View style={styles.reticle}>
          <ScanLine size={48} color="#FFFFFF" />
        </View>
        <Text variant="body" style={{ color: '#FFFFFF', marginTop: 24, textAlign: 'center' }}>
          Apuntá la cámara al código QR o de barras del equipo ({deviceId})
        </Text>
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
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  reticle: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
