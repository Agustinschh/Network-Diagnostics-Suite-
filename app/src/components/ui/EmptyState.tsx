import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { padding: theme.spacing.xl }, style]}>
      <View style={{ marginBottom: theme.spacing.md }}>{icon}</View>

      <Text
        variant="heading"
        color="textPrimary"
        style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}
      >
        {title}
      </Text>

      <Text
        variant="body"
        color="textSecondary"
        numberOfLines={3}
        style={{ textAlign: 'center', marginBottom: onAction ? theme.spacing.lg : 0 }}
      >
        {description}
      </Text>

      {actionTitle && onAction ? (
        <Button
          variant="secondary"
          title={actionTitle}
          onPress={onAction}
          style={{ minWidth: 160 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
