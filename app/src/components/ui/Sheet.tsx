import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.bg,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: theme.spacing.xl,
            },
          ]}
        >
          {/* Asa de arrastre */}
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.borderStrong },
            ]}
          />

          {title ? (
            <Text
              variant="heading"
              style={{ marginBottom: theme.spacing.lg, textAlign: 'center' }}
            >
              {title}
            </Text>
          ) : null}

          <ScrollView bounces={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    maxHeight: '80%',
    width: '100%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
