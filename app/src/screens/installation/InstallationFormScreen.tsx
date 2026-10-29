import React, { useState } from 'react';
import { View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Screen, Text, Input, Button, Card, ListRow } from '../../components/ui';
import { Camera, MapPin, ScanLine } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

type Route = RouteProp<RootStackParamList, 'InstallationForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function InstallationFormScreen() {
  const theme = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const { deviceId, installationId = 'draft_temp' } = route.params;

  const [siteName, setSiteName] = useState('');
  const [clientName, setClientName] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  const handleFinalize = () => {
    navigation.navigate('ReportPreview', { installationId });
  };

  return (
    <Screen
      title="Nueva instalación"
      subtitle="Borrador guardado localmente"
      scrollable
    >
      {/* Sitio y cliente */}
      <Card title="Sitio y cliente" style={{ marginBottom: theme.spacing.lg }}>
        <Input
          label="Nombre del sitio / nodo"
          placeholder="Torre Norte - Gabinete 2"
          value={siteName}
          onChangeText={setSiteName}
        />
        <Input
          label="Cliente / Operador"
          placeholder="Telecom / Cooperativa"
          value={clientName}
          onChangeText={setClientName}
        />
      </Card>

      {/* Equipo asociado */}
      <Card title="Equipo asociado" style={{ marginBottom: theme.spacing.lg }}>
        <ListRow
          title="192.168.1.1"
          subtitle={`Equipo: ${deviceId} · N/S no asignado`}
          monoTitle
          rightContent={
            <Button
              variant="secondary"
              title="Escanear"
              icon={<ScanLine size={16} color={theme.colors.textPrimary} />}
              onPress={() => navigation.navigate('CodeScanner', { deviceId })}
            />
          }
        />
      </Card>

      {/* Evidencia fotográfica */}
      <Card title="Evidencia fotográfica" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
          Capturá al menos 1 foto del rack, potencia óptica o etiqueta.
        </Text>
        <Button
          variant="secondary"
          title="Tomar fotos"
          icon={<Camera size={18} color={theme.colors.textPrimary} />}
          fullWidth
          onPress={() => navigation.navigate('Camera', { installationId })}
        />
      </Card>

      {/* Ubicación GPS */}
      <Card title="Georreferenciación" style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing.md }}>
          Coordenadas GPS requeridas para certificar la instalación.
        </Text>
        <Button
          variant="secondary"
          title="Obtener ubicación GPS"
          icon={<MapPin size={18} color={theme.colors.textPrimary} />}
          fullWidth
          onPress={() => {}}
        />
      </Card>

      {/* Observaciones */}
      <Card title="Observaciones técnicas" style={{ marginBottom: theme.spacing.xl }}>
        <Input
          placeholder="Notas de instalación, potencia óptica de recepción (dBm), conectores cambiados..."
          value={technicianNotes}
          onChangeText={setTechnicianNotes}
          multiline
          numberOfLines={4}
          style={{ height: 96, textAlignVertical: 'top' }}
        />
      </Card>

      <Button
        variant="primary"
        title="Finalizar y generar PDF"
        fullWidth
        onPress={handleFinalize}
      />
    </Screen>
  );
}
