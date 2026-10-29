import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, Button } from '../../components/ui';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ManualHostScreen() {
  const navigation = useNavigation<NavProp>();
  const [ip, setIp] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(ip.trim())) {
      setError('Ingresá una dirección IPv4 válida (ej: 192.168.1.1)');
      return;
    }

    setError('');
    // Navegar a Device con un ID provisional o real
    navigation.replace('Device', { deviceId: `manual_${ip.trim()}` });
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
        fullWidth
        onPress={handleAdd}
      />
    </Screen>
  );
}
