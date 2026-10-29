import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Badge, Card } from './ui';
import { useTheme } from '../theme/useTheme';
import { SnmpInterface } from '../services/snmp/SnmpClient';
import { formatBytes } from '../utils/format';

export interface InterfaceRowProps {
  item: SnmpInterface;
}

export function InterfaceRow({ item }: InterfaceRowProps) {
  const theme = useTheme();

  return (
    <Card surface style={{ marginBottom: theme.spacing.sm }}>
      <View style={styles.container}>
        <View style={styles.infoCol}>
          <Text variant="bodyStrong" color="textPrimary">
            {item.descr}
          </Text>
          {item.mac ? (
            <Text variant="monoSmall" color="textSecondary" style={{ marginTop: 2 }}>
              MAC: {item.mac}
            </Text>
          ) : null}
          <Text variant="monoSmall" color="textTertiary" style={{ marginTop: 2 }}>
            ↓ {formatBytes(item.inOctets)}  ↑ {formatBytes(item.outOctets)}
          </Text>
        </View>

        <Badge
          status={item.operStatus === 'up' ? 'up' : item.operStatus === 'down' ? 'down' : 'unknown'}
          label={item.operStatus === 'up' ? 'Activa' : item.operStatus === 'down' ? 'Caída' : 'Desconocido'}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    paddingRight: 12,
  },
});
