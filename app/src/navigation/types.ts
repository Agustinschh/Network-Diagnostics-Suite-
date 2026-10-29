import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  NetworkTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  ManualHost: undefined;
  Device: { deviceId: string };
  Snmp: { deviceId: string };
  Ssh: { deviceId: string };
  Credentials: { deviceId: string };
  InstallationForm: { deviceId: string; installationId?: string };
  Camera: { installationId: string };
  CodeScanner: { deviceId: string };
  ReportPreview: { installationId: string };
  HistoryDetail: { kind: 'installation' | 'diagnostic'; id: string };
};
