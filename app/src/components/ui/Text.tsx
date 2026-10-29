import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ColorToken, TypographyToken } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  color?: ColorToken;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const typographyStyle = theme.typography[variant];
  const textColor = theme.colors[color];

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={1.3}
      style={[typographyStyle, { color: textColor }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
