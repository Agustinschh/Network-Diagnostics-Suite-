import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Copy, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui/Text';
import { SshCommandResult } from '../services/ssh/SshService';

interface TerminalViewProps {
  results: SshCommandResult[];
  activeCommand?: string;
  isRunning?: boolean;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  results,
  activeCommand,
  isRunning = false,
}) => {
  const { colors, typography, spacing, radius } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = results
      .map((r) => {
        let block = `$ ${r.command}\n${r.output}`;
        if (r.error) {
          block += `\n[ERROR: ${r.error}]`;
        }
        return block;
      })
      .join('\n\n');

    Clipboard.setString(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.terminalBg, borderRadius: radius.md, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.dotGroup}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
        </View>
        <Text variant="caption" color="textSecondary" style={styles.headerTitle}>
          Terminal SSH
        </Text>
        {results.length > 0 && (
          <TouchableOpacity
            onPress={handleCopy}
            style={[styles.copyButton, { backgroundColor: colors.surface, borderRadius: radius.sm }]}
            activeOpacity={0.7}
          >
            {copied ? (
              <Check size={14} color={colors.success} />
            ) : (
              <Copy size={14} color={colors.textSecondary} />
            )}
            <Text variant="caption" color={copied ? 'success' : 'textSecondary'} style={{ marginLeft: 4 }}>
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { padding: spacing.md }]}
        nestedScrollEnabled
      >
        {results.length === 0 && !isRunning && !activeCommand && (
          <Text variant="caption" color="textTertiary" style={{ fontFamily: typography.mono.fontFamily }}>
            Sin comandos ejecutados. Selecciona un perfil y presiona "Ejecutar perfil".
          </Text>
        )}

        {results.map((r, idx) => (
          <View key={idx} style={styles.commandBlock}>
            <View style={styles.promptLine}>
              <Text
                variant="caption"
                color="accent"
                style={{ fontFamily: typography.mono.fontFamily, fontWeight: '700' }}
              >
                ${' '}
              </Text>
              <Text
                variant="caption"
                color="textPrimary"
                style={{ fontFamily: typography.mono.fontFamily, fontWeight: '600' }}
              >
                {r.command}
              </Text>
              <Text
                variant="caption"
                color="textTertiary"
                style={{ marginLeft: 8, fontFamily: typography.mono.fontFamily }}
              >
                ({r.durationMs}ms)
              </Text>
            </View>

            {r.output ? (
              <Text
                variant="caption"
                style={{
                  color: colors.terminalText,
                  fontFamily: typography.mono.fontFamily,
                  marginTop: spacing.xs,
                  lineHeight: 18,
                }}
              >
                {r.output}
              </Text>
            ) : null}

            {r.error && (
              <Text
                variant="caption"
                color="danger"
                style={{
                  fontFamily: typography.mono.fontFamily,
                  marginTop: spacing.xs,
                }}
              >
                [Error]: {r.error}
              </Text>
            )}
          </View>
        ))}

        {isRunning && activeCommand && (
          <View style={styles.commandBlock}>
            <View style={styles.promptLine}>
              <Text
                variant="caption"
                color="accent"
                style={{ fontFamily: typography.mono.fontFamily, fontWeight: '700' }}
              >
                ${' '}
              </Text>
              <Text
                variant="caption"
                color="textPrimary"
                style={{ fontFamily: typography.mono.fontFamily, fontWeight: '600' }}
              >
                {activeCommand}
              </Text>
              <Text
                variant="caption"
                color="warning"
                style={{ marginLeft: 8, fontFamily: typography.mono.fontFamily }}
              >
                (ejecutando...)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 220,
    maxHeight: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  commandBlock: {
    marginBottom: 12,
  },
  promptLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
