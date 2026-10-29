import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  themePreference: ThemePreference;
  defaultSnmpCommunity: string;
  syncBaseUrl: string;
  lastTechnicianName: string;
  setThemePreference: (pref: ThemePreference) => void;
  setDefaultSnmpCommunity: (community: string) => void;
  setSyncBaseUrl: (url: string) => void;
  setLastTechnicianName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  defaultSnmpCommunity: 'public',
  syncBaseUrl: 'http://10.0.2.2:3000',
  lastTechnicianName: '',
  setThemePreference: (themePreference) => set({ themePreference }),
  setDefaultSnmpCommunity: (defaultSnmpCommunity) => set({ defaultSnmpCommunity }),
  setSyncBaseUrl: (syncBaseUrl) => set({ syncBaseUrl }),
  setLastTechnicianName: (lastTechnicianName) => set({ lastTechnicianName }),
}));
