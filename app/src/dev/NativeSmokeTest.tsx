import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Módulos nativos
import dgram from 'react-native-udp';
import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import * as Keychain from 'react-native-keychain';
import NetInfo from '@react-native-community/netinfo';
import { VisionCamera } from 'react-native-vision-camera';
import { generatePDF } from 'react-native-html-to-pdf';
import SSHClient from '@dylankenneally/react-native-ssh-sftp';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { appSchema, tableSchema, Model } from '@nozbe/watermelondb';
import { text } from '@nozbe/watermelondb/decorators';

// Modelo y esquema temporal para WatermelonDB
class SmokeModel extends Model {
  static table = 'smoke';
  @text('name') name!: string;
}

const smokeSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'smoke',
      columns: [{ name: 'name', type: 'string' }],
    }),
  ],
});

const smokeAdapter =
  process.env.NODE_ENV === 'test'
    ? new LokiJSAdapter({
        schema: smokeSchema,
        useWebWorker: false,
        useIncrementalIndexedDB: false,
      })
    : new SQLiteAdapter({
        schema: smokeSchema,
        jsi: false,
      });

const smokeDatabase = new Database({
  adapter: smokeAdapter,
  modelClasses: [SmokeModel],
});

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'ok' | 'error';
  message: string;
}

export function NativeSmokeTest() {
  const [results, setResults] = useState<Record<string, TestResult>>({
    udp: { name: 'UDP (react-native-udp)', status: 'idle', message: 'No probado' },
    tcp: { name: 'TCP (react-native-tcp-socket)', status: 'idle', message: 'No probado' },
    zeroconf: { name: 'Zeroconf (mDNS)', status: 'idle', message: 'No probado' },
    keychain: { name: 'Keychain / Keystore', status: 'idle', message: 'No probado' },
    netinfo: { name: 'NetInfo', status: 'idle', message: 'No probado' },
    camera: { name: 'Vision Camera', status: 'idle', message: 'No probado' },
    watermelondb: { name: 'WatermelonDB SQLite', status: 'idle', message: 'No probado' },
    ssh: { name: 'SSH Client', status: 'idle', message: 'No probado' },
    pdf: { name: 'HTML to PDF', status: 'idle', message: 'No probado' },
  });

  const updateResult = (key: string, status: TestResult['status'], message: string) => {
    setResults(prev => ({
      ...prev,
      [key]: { ...prev[key], status, message },
    }));
  };

  const testUDP = async () => {
    updateResult('udp', 'running', 'Probando creación de socket y bind...');
    try {
      const socket = dgram.createSocket({ type: 'udp4' });
      socket.bind(0, (err: Error) => {
        if (err) {
          updateResult('udp', 'error', `Bind error: ${err.message}`);
          socket.close();
          return;
        }
        const address = socket.address();
        socket.close();
        updateResult('udp', 'ok', `Socket creado y cerrado en puerto ${address?.port || 'aleatorio'}`);
      });
    } catch (e: any) {
      updateResult('udp', 'error', e.message || String(e));
    }
  };

  const testTCP = async () => {
    updateResult('tcp', 'running', 'Probando conexión TCP a 8.8.8.8:53...');
    try {
      const client = TcpSocket.createConnection(
        { port: 53, host: '8.8.8.8' },
        () => {
          client.destroy();
          updateResult('tcp', 'ok', 'Conexión TCP establecida correctamente');
        }
      );
      client.setTimeout(2000);
      client.on('error', (err: any) => {
        client.destroy();
        updateResult('tcp', 'error', `TCP error: ${err.message || String(err)}`);
      });
      client.on('timeout', () => {
        client.destroy();
        updateResult('tcp', 'error', 'TCP timeout');
      });
    } catch (e: any) {
      updateResult('tcp', 'error', e.message || String(e));
    }
  };

  const testZeroconf = async () => {
    updateResult('zeroconf', 'running', 'Iniciando escaneo mDNS 2s...');
    try {
      const zeroconf = new Zeroconf();
      zeroconf.scan('http', 'tcp', 'local.');
      setTimeout(() => {
        zeroconf.stop();
        zeroconf.removeDeviceListeners();
        updateResult('zeroconf', 'ok', 'Escaneo mDNS iniciado y detenido exitosamente');
      }, 2000);
    } catch (e: any) {
      updateResult('zeroconf', 'error', e.message || String(e));
    }
  };

  const testKeychain = async () => {
    updateResult('keychain', 'running', 'Escribiendo y leyendo credencial smoke...');
    try {
      await Keychain.setGenericPassword('smoke_user', 'smoke_pass', {
        service: 'netdiag.smoke.test',
      });
      const creds = await Keychain.getGenericPassword({
        service: 'netdiag.smoke.test',
      });
      await Keychain.resetGenericPassword({
        service: 'netdiag.smoke.test',
      });
      if (creds && creds.username === 'smoke_user') {
        updateResult('keychain', 'ok', `Éxito. Leído: ${creds.username}`);
      } else {
        updateResult('keychain', 'error', 'No se recuperaron las credenciales guardadas');
      }
    } catch (e: any) {
      updateResult('keychain', 'error', e.message || String(e));
    }
  };

  const testNetInfo = async () => {
    updateResult('netinfo', 'running', 'Obteniendo estado de red...');
    try {
      const state = await NetInfo.fetch();
      const ip = (state.details as any)?.ipAddress || 'Sin IP';
      const subnet = (state.details as any)?.subnet || 'Sin máscara';
      updateResult(
        'netinfo',
        'ok',
        `Tipo: ${state.type}, IP: ${ip}, Subred: ${subnet}, Conectado: ${state.isConnected}`
      );
    } catch (e: any) {
      updateResult('netinfo', 'error', e.message || String(e));
    }
  };

  const testCamera = async () => {
    updateResult('camera', 'running', 'Consultando permisos de Vision Camera...');
    try {
      const status = VisionCamera.cameraPermissionStatus;
      updateResult('camera', 'ok', `Estado del permiso de cámara: ${status}`);
    } catch (e: any) {
      updateResult('camera', 'error', e.message || String(e));
    }
  };

  const testWatermelonDB = async () => {
    updateResult('watermelondb', 'running', 'Creando y leyendo registro en SQLite...');
    try {
      await smokeDatabase.write(async () => {
        const collection = smokeDatabase.get<SmokeModel>('smoke');
        const item = await collection.create((record: SmokeModel) => {
          record.name = 'smoke_record_test';
        });
        const found = await collection.find(item.id);
        if (found && found.name === 'smoke_record_test') {
          updateResult('watermelondb', 'ok', `Éxito: registro SQLite creado id=${found.id.substring(0, 8)}`);
        } else {
          updateResult('watermelondb', 'error', 'No se pudo recuperar el registro creado');
        }
      });
    } catch (e: any) {
      updateResult('watermelondb', 'error', e.message || String(e));
    }
  };

  const testSSH = async () => {
    updateResult('ssh', 'running', 'Verificando bindings nativos de SSHClient...');
    try {
      if (SSHClient && typeof SSHClient.connectWithPassword === 'function') {
        updateResult('ssh', 'ok', 'SSHClient vinculado nativamente y API connectWithPassword disponible');
      } else {
        updateResult('ssh', 'error', 'SSHClient no expone connectWithPassword');
      }
    } catch (e: any) {
      updateResult('ssh', 'error', e.message || String(e));
    }
  };

  const testPDF = async () => {
    updateResult('pdf', 'running', 'Generando PDF de prueba <h1>ok</h1>...');
    try {
      const options = {
        html: '<h1>NetDiag Native Smoke Test OK</h1><p>Test PDF generation</p>',
        fileName: 'smoke_test',
        directory: 'Documents',
      };
      const file = await generatePDF(options);
      updateResult('pdf', 'ok', `PDF generado en: ${file.filePath}`);
    } catch (e: any) {
      updateResult('pdf', 'error', e.message || String(e));
    }
  };

  const testAll = async () => {
    await testUDP();
    await testTCP();
    await testZeroconf();
    await testKeychain();
    await testNetInfo();
    await testCamera();
    await testWatermelonDB();
    await testSSH();
    await testPDF();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Fase 0: Smoke Test Nativo</Text>
        <Text style={styles.subtitle}>
          Verificación de módulos nativos C++/Java en Android
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={testAll}>
          <Text style={styles.primaryButtonText}>Ejecutar todas las pruebas</Text>
        </TouchableOpacity>

        <View style={styles.cardList}>
          {Object.entries(results).map(([key, item]) => (
            <View key={key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    item.status === 'ok' && styles.statusOk,
                    item.status === 'error' && styles.statusError,
                    item.status === 'running' && styles.statusRunning,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E1116',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5361',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2F5BEA',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3E6EA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E1116',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A93A1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EEF0F3',
  },
  statusOk: {
    color: '#15803D',
    backgroundColor: '#E8F6EE',
  },
  statusError: {
    color: '#C62828',
    backgroundColor: '#FDECEC',
  },
  statusRunning: {
    color: '#2F5BEA',
    backgroundColor: '#EBF0FE',
  },
  cardMessage: {
    fontSize: 13,
    color: '#4A5361',
    fontFamily: 'monospace',
  },
});
