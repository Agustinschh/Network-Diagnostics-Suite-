import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setMessage(msg);

      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.motion.base,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: theme.motion.base,
          useNativeDriver: true,
        }).start(() => {
          setMessage(null);
        });
      }, 3000);
    },
    [opacity, theme.motion.base]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <SafeAreaView pointerEvents="none" style={styles.toastWrapper}>
          <Animated.View
            style={[
              styles.toastContainer,
              {
                backgroundColor: theme.colors.textPrimary,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                opacity,
              },
            ]}
          >
            <Text
              variant="body"
              color="bg"
              numberOfLines={2}
              style={{ textAlign: 'center' }}
            >
              {message}
            </Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
