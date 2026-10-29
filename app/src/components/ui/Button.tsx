import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const base: ViewStyle = {
      height: theme.layout.buttonHeight,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: fullWidth ? 'stretch' : 'auto',
      opacity: disabled ? 0.4 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.accent,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.danger,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
        };
    }
  };

  const getTextColorToken = () => {
    switch (variant) {
      case 'primary':
        return 'onAccent' as const;
      case 'secondary':
        return 'textPrimary' as const;
      case 'danger':
        return 'danger' as const;
      case 'ghost':
        return 'accent' as const;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.onAccent : theme.colors.accent}
        />
      ) : (
        <>
          {icon ? <View style={{ marginRight: theme.spacing.sm }}>{icon}</View> : null}
          <Text variant="bodyStrong" color={getTextColorToken()}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
