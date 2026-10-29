import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Key, Play, Square } from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Button, Card, Badge, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { TerminalView } from '../../components/TerminalView';
import { SshService, SshCommandResult } from '../../services/ssh/SshService';
import { SSH_PROFILES, SshProfileId, detectSshProfile } from '../../services/ssh/profiles';
import { devicesRepository } from '../../db/repositories/devices';
import { diagnosticsRepository } from '../../db/repositories/diagnostics';
import { outboxRepository } from '../../db/repositories/outbox';
import { database } from '../../db';
import { Device } from '../../db/models/Device';
import { Diagnostic } from '../../db/models/Diagnostic';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'Ssh'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SshScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId } = route.params;
  const { showToast } = useToast();

  const [device, setDevice] = useState<Device | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SshProfileId>('linux');
  const [suggestedProfile, setSuggestedProfile] = useState<SshProfileId>('linux');
  const [results, setResults] = useState<SshCommandResult[]>([]);
  const [activeCommand, setActiveCommand] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const dev = await devicesRepository.getById(deviceId);
        if (!mounted || !dev) return;
        setDevice(dev);

        // Buscar si existe diagnóstico SNMP previo para sugerir perfil
        const prevDiags = await diagnosticsRepository.listByDevice(deviceId);
        const snmpDiag = prevDiags.find((d) => d.kind === 'snmp' && d.snmpSysDescr);
        const detected = detectSshProfile(snmpDiag?.snmpSysDescr);
        if (mounted) {
          setSuggestedProfile(detected);
          setSelectedProfile(detected);
        }
      } catch (e) {
        logger.warn('Error al cargar datos del equipo:', e);
      }
    })();

    return () => {
      mounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [deviceId]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setActiveCommand(undefined);
    showToast('Ejecución cancelada por el técnico');
  };

  const handleRun = async () => {
    if (!device) return;

    setIsRunning(true);
    setResults([]);
    setLastStatus('idle');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const accumulatedResults: SshCommandResult[] = [];

    try {
      const res = await SshService.runProfile(
        deviceId,
        device.ipAddress,
        22,
        selectedProfile,
        (cmdResult) => {
          accumulatedResults.push(cmdResult);
          setResults([...accumulatedResults]);
          setActiveCommand(cmdResult.command);
        },
        controller.signal
      );

      setActiveCommand(undefined);
      const hasErrors = res.some((r) => Boolean(r.error));
      setLastStatus(hasErrors ? 'error' : 'success');

      // Unir salida de todos los comandos para persistencia
      const fullOutput = res
        .map((r) => `$ ${r.command}\n${r.output}${r.error ? `\n[ERROR: ${r.error}]` : ''}`)
        .join('\n\n');

      // Persistir diagnóstico y encolar en Outbox de forma transaccional
      await database.write(async () => {
        const diag = await database.get<Diagnostic>('diagnostics').create((record) => {
          record.deviceId = deviceId;
          record.kind = 'ssh';
          record.sshProfile = selectedProfile;
          record.sshOutput = fullOutput;
          record.success = !hasErrors;
        });

        await outboxRepository.enqueue(
          'DIAGNOSTIC',
          diag.id,
          {
            deviceId,
            kind: 'ssh',
            sshProfile: selectedProfile,
            sshOutput: fullOutput,
            success: !hasErrors,
          }
        );
      });

      showToast(hasErrors ? 'Diagnóstico SSH finalizado con advertencias' : 'Diagnóstico SSH completado con éxito');
    } catch (err: any) {
      setActiveCommand(undefined);
      setLastStatus('error');

      if (err?.code === 'AUTH_FAILED') {
        showToast('Credenciales faltantes o inválidas. Configura usuario y contraseña.');
        navigation.navigate('Credentials', { deviceId });
        return;
      }

      const errMsg = err?.message || 'Error al ejecutar perfil SSH';
      showToast(errMsg);

      // Persistir diagnóstico fallido si falló la conexión
      try {
        await database.write(async () => {
          const diag = await database.get<Diagnostic>('diagnostics').create((record) => {
            record.deviceId = deviceId;
            record.kind = 'ssh';
            record.sshProfile = selectedProfile;
            record.success = false;
            record.errorCode = err?.code || 'SSH_ERROR';
          });

          await outboxRepository.enqueue(
            'DIAGNOSTIC',
            diag.id,
            {
              deviceId,
              kind: 'ssh',
              sshProfile: selectedProfile,
              success: false,
              errorCode: err?.code || 'SSH_ERROR',
            }
          );
        });
      } catch (dbErr) {
        logger.error('Error al guardar diagnóstico fallido:', dbErr);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const profileKeys = Object.keys(SSH_PROFILES) as SshProfileId[];

  return (
    <Screen
      title="Diagnóstico SSH"
      subtitle={device ? `${device.ipAddress} (${device.hostname || 'Sin nombre'})` : `Equipo: ${deviceId}`}
      scrollable
    >
      <View style={[styles.topBar, { marginBottom: theme.spacing.md }]}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <Text variant="overline" color="textSecondary">
            PERFIL SELECCIONADO
          </Text>
          <Text variant="heading" color="textPrimary">
            {SSH_PROFILES[selectedProfile].label}
          </Text>
        </View>

        <Button
          variant="secondary"
          title="Credenciales"
          onPress={() => navigation.navigate('Credentials', { deviceId })}
        />
      </View>

      {/* Selector de perfiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillsContainer, { marginBottom: theme.spacing.md }]}
      >
        {profileKeys.map((key) => {
          const isSelected = selectedProfile === key;
          const isSuggested = suggestedProfile === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedProfile(key)}
              disabled={isRunning}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  borderRadius: theme.radius.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  marginRight: theme.spacing.sm,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                style={{
                  color: isSelected ? theme.colors.onAccent : theme.colors.textPrimary,
                  fontWeight: isSelected ? '700' : '500',
                }}
              >
                {SSH_PROFILES[key].label} {isSuggested ? '★' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Comandos del perfil */}
      <Card title="Comandos del perfil" style={{ marginBottom: theme.spacing.md }}>
        {SSH_PROFILES[selectedProfile].commands.map((cmd, i) => (
          <Text
            key={i}
            variant="caption"
            color="textSecondary"
            style={{ fontFamily: theme.typography.mono.fontFamily, marginTop: 2 }}
          >
            • {cmd}
          </Text>
        ))}
      </Card>

      {/* Consola Terminal */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <View style={styles.consoleHeader}>
          <Text variant="overline" color="textSecondary">
            CONSOLA SSH EN VIVO
          </Text>
          {lastStatus === 'success' && <Badge status="up" label="EXITOSO" />}
          {lastStatus === 'error' && <Badge status="failed" label="CON ERRORES" />}
        </View>

        <TerminalView
          results={results}
          activeCommand={activeCommand}
          isRunning={isRunning}
        />
      </View>

      {/* Botón de acción */}
      {isRunning ? (
        <Button
          variant="danger"
          title="Detener ejecución"
          fullWidth
          onPress={handleStop}
        />
      ) : (
        <Button
          variant="primary"
          title="Ejecutar perfil SSH"
          fullWidth
          onPress={handleRun}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    borderWidth: 1,
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
