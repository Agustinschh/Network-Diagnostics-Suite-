import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';
import { Cloud, CloudUpload, CloudOff } from 'lucide-react-native';

export interface SyncIndicatorProps {
  pendingCount?: number;
  failedCount?: number;
  isOnline?: boolean;
  onPress?: () => void;
}

export function SyncIndicator({
  pendingCount = 0,
  failedCount = 0,
  isOnline = true,
  onPress,
}: SyncIndicatorProps) {
  const theme = useTheme();

  const getIndicator = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff size={20} color={theme.colors.textTertiary} />,
        textColor: 'textTertiary' as const,
        showCount: pendingCount > 0,
        count: pendingCount,
      };
    }

    if (failedCount > 0) {
      return {
        icon: <CloudUpload size={20} color={theme.colors.danger} />,
        textColor: 'danger' as const,
        showCount: true,
        count: failedCount,
      };
    }

    if (pendingCount > 0) {
      return {
        icon: <CloudUpload size={20} color={theme.colors.warning} />,
        textColor: 'warning' as const,
        showCount: true,
        count: pendingCount,
      };
    }

    return {
      icon: <Cloud size={20} color={theme.colors.textTertiary} />,
      textColor: 'textTertiary' as const,
      showCount: false,
      count: 0,
    };
  };

  const indicator = getIndicator();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={styles.container}
      disabled={!onPress}
    >
      {indicator.icon}
      {indicator.showCount ? (
        <Text
          variant="label"
          color={indicator.textColor}
          style={{ marginLeft: 4 }}
        >
          {indicator.count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
});
