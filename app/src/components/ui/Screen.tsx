import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  title,
  subtitle,
  rightAction,
  children,
  scrollable = false,
  style,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();

  const Header = () => {
    if (!title && !rightAction) return null;

    return (
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <View style={styles.titleContainer}>
          {title ? (
            <Text variant="title" color="textPrimary">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              variant="caption"
              color="textSecondary"
              style={{ marginTop: 2 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.actionContainer}>{rightAction}</View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.bg },
        style,
      ]}
    >
      <Header />

      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding: theme.spacing.lg },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            { padding: theme.spacing.lg },
            contentStyle,
          ]}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  actionContainer: {
    marginLeft: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
