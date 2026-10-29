import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';
import { ChevronRight } from 'lucide-react-native';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  monoSubtitle?: boolean;
  monoTitle?: boolean;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ListRow({
  title,
  subtitle,
  icon,
  rightContent,
  onPress,
  monoSubtitle = false,
  monoTitle = false,
  showDivider = true,
  style,
}: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.container,
        {
          minHeight: theme.layout.rowMinHeight,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surface : 'transparent',
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: theme.colors.border,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: theme.spacing.md }}>{icon}</View> : null}

      <View style={styles.textContainer}>
        <Text
          variant={monoTitle ? 'mono' : 'bodyStrong'}
          color="textPrimary"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant={monoSubtitle ? 'monoSmall' : 'caption'}
            color="textSecondary"
            numberOfLines={1}
            style={{ marginTop: 2 }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightContent ? (
        <View style={{ marginLeft: theme.spacing.sm }}>{rightContent}</View>
      ) : null}

      {onPress ? (
        <ChevronRight
          size={18}
          color={theme.colors.textTertiary}
          style={{ marginLeft: theme.spacing.sm }}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
