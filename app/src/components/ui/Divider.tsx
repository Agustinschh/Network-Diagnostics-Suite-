import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface DividerProps {
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ vertical = false, style }: DividerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
