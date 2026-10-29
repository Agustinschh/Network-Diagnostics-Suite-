import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, Button } from '../../components/ui';
import { devicesRepository } from '../../db/repositories/devices';
import { z } from 'zod';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ipv4Schema = z
  .string()
  .trim()
  .regex(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Ingresá una dirección IPv4 válida (ej: 192.168.1.1)'
  );

export function ManualHostScreen() {
  const navigation = useNavigation<NavProp>();
  const [ip, setIp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const parseResult = ipv4Schema.safeParse(ip);
    if (!parseResult.success) {
      setError(parseResult.error.issues[0]?.message || 'Dirección IP inválida');
      return;
    }

    const validIp = parseResult.data;
    setError('');
    setLoading(true);

    try {
      // Guardar o actualizar en la base de datos local
      const device = await devicesRepository.upsertByIp({
        ipAddress: validIp,
        discoverySource: 'manual',
      });

      setLoading(false);
      navigation.replace('Device', { deviceId: device.id });
    } catch (e: any) {
      setLoading(false);
      setError('No se pudo guardar el equipo en la base de datos.');
    }
  };

  return (
    <Screen title="Agregar equipo" subtitle="Ingreso directo por dirección IP">
      <View style={{ flex: 1, marginTop: 16 }}>
        <Input
          label="Dirección IPv4"
          placeholder="192.168.1.1"
          value={ip}
          onChangeText={(t) => {
            setIp(t);
            if (error) setError('');
          }}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          mono
          error={error}
        />
      </View>

      <Button
        variant="primary"
        title="Continuar"
        loading={loading}
        fullWidth
        onPress={handleAdd}
      />
    </Screen>
  );
}
