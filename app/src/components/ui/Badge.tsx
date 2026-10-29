import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export type BadgeStatus =
  | 'up'
  | 'down'
  | 'unknown'
  | 'pending'
  | 'synced'
  | 'failed'
  | 'info';

export interface BadgeProps {
  status: BadgeStatus;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ status, label, style }: BadgeProps) {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'up':
        return {
          bg: theme.colors.successSubtle,
          color: theme.colors.success,
          defaultLabel: 'Activa',
        };
      case 'down':
        return {
          bg: theme.colors.dangerSubtle,
          color: theme.colors.danger,
          defaultLabel: 'Caída',
        };
      case 'synced':
        return {
          bg: theme.colors.successSubtle,
          color: theme.colors.success,
          defaultLabel: 'Sincronizado',
        };
      case 'failed':
        return {
          bg: theme.colors.dangerSubtle,
          color: theme.colors.danger,
          defaultLabel: 'Error de envío',
        };
      case 'pending':
        return {
          bg: theme.colors.warningSubtle,
          color: theme.colors.warning,
          defaultLabel: 'Pendiente',
        };
      case 'info':
        return {
          bg: theme.colors.accentSubtle,
          color: theme.colors.accent,
          defaultLabel: 'Info',
        };
      case 'unknown':
      default:
        return {
          bg: theme.colors.surfaceAlt,
          color: theme.colors.textSecondary,
          defaultLabel: 'Desconocido',
        };
    }
  };

  const config = getStatusConfig();
  const textContent = label || config.defaultLabel;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.sm,
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        variant="caption"
        style={[styles.text, { color: config.color }]}
      >
        {textContent}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
