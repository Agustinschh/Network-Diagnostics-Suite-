import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { Theme, themes } from './tokens';
import { useSettingsStore } from '../store/settingsStore';

const ThemeContext = createContext<Theme>(themes.light);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);

  const resolvedScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const currentTheme = themes[resolvedScheme];

  return (
    <ThemeContext.Provider value={currentTheme}>
      <StatusBar
        barStyle={resolvedScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return theme;
}
