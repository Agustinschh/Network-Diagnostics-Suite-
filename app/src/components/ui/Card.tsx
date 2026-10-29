import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  surface?: boolean;
}

export function Card({ title, action, children, style, surface = false }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: surface ? theme.colors.surface : theme.colors.bg,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      {title || action ? (
        <View style={[styles.header, { marginBottom: theme.spacing.md }]}>
          {title ? <Text variant="heading">{title}</Text> : <View />}
          {action ? <View>{action}</View> : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
