import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';
import { Eye, EyeOff } from 'lucide-react-native';

export interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  mono?: boolean;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  mono = false,
  secure = false,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secure);

  const hasError = Boolean(error);

  const getBorderColor = () => {
    if (hasError) return theme.colors.danger;
    if (isFocused) return theme.colors.accent;
    return theme.colors.border;
  };

  return (
    <View style={[{ marginBottom: theme.spacing.md }, containerStyle]}>
      {label ? (
        <Text variant="label" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 1.5 : 1,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secure && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            mono ? theme.typography.mono : theme.typography.body,
            { color: theme.colors.textPrimary },
            style,
          ]}
          {...rest}
        />

        {secure ? (
          <Pressable
            hitSlop={12}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} />
            )}
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <Text
          variant="caption"
          color="danger"
          style={{ marginTop: theme.spacing.xs }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingVertical: 0,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
