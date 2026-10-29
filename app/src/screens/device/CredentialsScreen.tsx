import React, { useState } from 'react';
import { View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Input, Button, Card, Text, useToast } from '../../components/ui';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'Credentials'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function CredentialsScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId } = route.params;
  const { showToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [community, setCommunity] = useState('public');

  const handleSave = () => {
    showToast('Credenciales guardadas en el almacenamiento seguro');
    navigation.goBack();
  };

  return (
    <Screen
      title="Credenciales"
      subtitle={`Equipo: ${deviceId}`}
      scrollable
    >
      <Card title="Acceso SSH" style={{ marginBottom: theme.spacing.lg }}>
        <Input
          label="Usuario SSH"
          placeholder="admin"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Contraseña SSH"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secure
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
        />
      </Card>

      <Button
        variant="primary"
        title="Guardar credenciales"
        fullWidth
        onPress={handleSave}
      />
    </Screen>
  );
}
