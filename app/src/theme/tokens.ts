import { Platform } from 'react-native';

const palette = {
  light: {
    bg: '#FFFFFF',
    surface: '#F6F7F9',
    surfaceAlt: '#EEF0F3',
    border: '#E3E6EA',
    borderStrong: '#C9CED6',
    textPrimary: '#0E1116',
    textSecondary: '#4A5361',
    textTertiary: '#8A93A1',
    accent: '#2F5BEA',
    accentPressed: '#2449C4',
    accentSubtle: '#EBF0FE',
    onAccent: '#FFFFFF',
    success: '#15803D',
    successSubtle: '#E8F6EE',
    danger: '#C62828',
    dangerSubtle: '#FDECEC',
    warning: '#B45309',
    warningSubtle: '#FEF4E6',
    terminalBg: '#F6F7F9',
    terminalText: '#1F2733',
    overlay: 'rgba(14,17,22,0.45)',
  },
  dark: {
    bg: '#0B0D10',
    surface: '#14171C',
    surfaceAlt: '#1C2027',
    border: '#262B33',
    borderStrong: '#3A414C',
    textPrimary: '#F3F4F6',
    textSecondary: '#A3ABB8',
    textTertiary: '#6B7380',
    accent: '#6E8BFF',
    accentPressed: '#5873E0',
    accentSubtle: '#1A2240',
    onAccent: '#0B0D10',
    success: '#4ADE80',
    successSubtle: '#10291A',
    danger: '#F87171',
    dangerSubtle: '#2E1414',
    warning: '#FBBF24',
    warningSubtle: '#2E2210',
    terminalBg: '#08090B',
    terminalText: '#D7DCE3',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ColorToken = keyof typeof palette.light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
} as const;

const F = {
  regular: Platform.select({ android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ android: 'sans-serif-medium', default: 'System' }),
  semibold: Platform.select({ android: 'sans-serif-medium', default: 'System' }),
  mono: Platform.select({ android: 'monospace', default: 'Courier' }),
};

export const typography = {
  display: { fontFamily: F.semibold, fontSize: 28, lineHeight: 34, fontWeight: '600' as const },
  title: { fontFamily: F.semibold, fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  heading: { fontFamily: F.semibold, fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontFamily: F.medium, fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  label: { fontFamily: F.medium, fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  overline: {
    fontFamily: F.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  mono: { fontFamily: F.mono, fontSize: 14, lineHeight: 20 },
  monoSmall: { fontFamily: F.mono, fontSize: 12, lineHeight: 18 },
} as const;

export type TypographyToken = keyof typeof typography;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const layout = {
  touchTarget: 48,
  rowMinHeight: 64,
  tabBarHeight: 64,
  buttonHeight: 48,
} as const;

export const themes = {
  light: { scheme: 'light' as const, colors: palette.light, spacing, radius, typography, motion, layout },
  dark: { scheme: 'dark' as const, colors: palette.dark, spacing, radius, typography, motion, layout },
};

export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];
