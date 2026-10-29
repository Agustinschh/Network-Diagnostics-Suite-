import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { z } from 'zod';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, Button, Card, Text, useToast, Divider } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';
import { CredentialStore } from '../../services/security/CredentialStore';
import { logger } from '../../utils/logger';

type Route = RouteProp<RootStackParamList, 'Credentials'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const credentialsSchema = z.object({
  username: z
    .string()
    .min(1, 'El usuario es obligatorio')
    .max(64, 'Máximo 64 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(128, 'Máximo 128 caracteres'),
  community: z
    .string()
    .min(1, 'La comunidad SNMP es obligatoria')
    .max(64, 'Máximo 64 caracteres'),
});

export function CredentialsScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId } = route.params;
  const { showToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [community, setCommunity] = useState('public');
  const [hasExisting, setHasExisting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; community?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [ssh, comm] = await Promise.all([
          CredentialStore.getSsh(deviceId),
          CredentialStore.getSnmpCommunity(deviceId),
        ]);
        if (mounted) {
          if (ssh) {
            setUsername(ssh.username);
            setPassword(ssh.password);
            setHasExisting(true);
          }
          if (comm) {
            setCommunity(comm);
            setHasExisting(true);
          }
        }
      } catch (e) {
        logger.warn('Error al cargar credenciales previas:', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [deviceId]);

  const handleSave = async () => {
    setErrors({});
    const validation = credentialsSchema.safeParse({
      username: username.trim(),
      password,
      community: community.trim(),
    });

    if (!validation.success) {
      const fieldErrors: { username?: string; password?: string; community?: string } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as 'username' | 'password' | 'community';
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all([
        CredentialStore.saveSsh(deviceId, {
          username: username.trim(),
          password,
        }),
        CredentialStore.saveSnmpCommunity(deviceId, community.trim()),
      ]);

      showToast('Credenciales guardadas en el almacén seguro.');
      navigation.goBack();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar credenciales en el Keychain');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar credenciales',
      '¿Seguro que deseas eliminar las credenciales guardadas para este equipo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await CredentialStore.deleteAll(deviceId);
            showToast('Credenciales eliminadas');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <Screen
      title="Credenciales"
      subtitle={`Equipo: ${deviceId}`}
      scrollable
    >
      <Card title="Acceso SSH" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
          Las credenciales se cifran con hardware seguro (Android Keystore) y nunca se envían al servidor ni se escriben en logs.
        </Text>
        <Input
          label="Usuario SSH"
          placeholder="admin"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.username}
        />
        <Input
          label="Contraseña SSH"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secure
          error={errors.password}
        />
      </Card>

      <Card title="Acceso SNMP" style={{ marginBottom: theme.spacing.xl }}>
        <Input
          label="Comunidad SNMP v1/v2c"
          placeholder="public"
          value={community}
          onChangeText={setCommunity}
          autoCapitalize="none"
          autoCorrect={false}
          mono
          error={errors.community}
        />
      </Card>

      <Button
        variant="primary"
        title={isSaving ? 'Guardando...' : 'Guardar credenciales'}
        disabled={isSaving}
        fullWidth
        onPress={handleSave}
      />

      {hasExisting && (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            variant="ghost"
            title="Eliminar credenciales de este equipo"
            fullWidth
            onPress={handleDelete}
          />
        </View>
      )}
    </Screen>
  );
}
