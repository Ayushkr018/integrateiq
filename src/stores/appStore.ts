import { create } from 'zustand';

const STORAGE_KEY = 'integrateiq-ui-state';

export type ThemeMode = 'dark' | 'light';
export type AccentTone = 'violet' | 'cyan' | 'green' | 'amber' | 'red';
export type DensityMode = 'comfortable' | 'compact';

interface NotificationPreferences {
  simComplete: boolean;
  configChange: boolean;
  securityAlert: boolean;
  auditEvents: boolean;
  weeklyDigest: boolean;
  slackWebhook: boolean;
}

interface ParsedService {
  provider: string;
  category: string;
  confidence: number;
  mandatory: boolean;
  mentioned_fields: string[];
  purpose: string;
}

interface ParsedResult {
  summary: string;
  detected_services: ParsedService[];
  global_fields: string[];
  compliance_notes: string[];
  integration_count: number;
}

interface MatchedAdapter {
  adapter_id: string;
  adapter_name: string;
  provider: string;
  category: string;
  confidence: number;
  reason: string;
  versions: { id: string; version: string; deprecated: boolean }[];
  selected_version_id?: string;
  included: boolean;
}

interface AppState {
  theme: ThemeMode;
  accent: AccentTone;
  density: DensityMode;
  motionEnabled: boolean;
  tenantName: string;
  tenantSlug: string;
  notificationPrefs: NotificationPreferences;
  sidebarCollapsed: boolean;
  parsedResult: ParsedResult | null;
  matchedAdapters: MatchedAdapter[] | null;
  currentConfigId: string | null;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentTone) => void;
  setDensity: (density: DensityMode) => void;
  setMotionEnabled: (enabled: boolean) => void;
  updateTenantInfo: (tenant: { tenantName: string; tenantSlug: string }) => void;
  setNotificationPref: (key: keyof NotificationPreferences, value: boolean) => void;
  toggleSidebar: () => void;
  setParsedResult: (r: ParsedResult | null) => void;
  setMatchedAdapters: (a: MatchedAdapter[] | null) => void;
  setCurrentConfigId: (id: string | null) => void;
}

type PersistedUiState = Pick<AppState, 'theme' | 'accent' | 'density' | 'motionEnabled' | 'tenantName' | 'tenantSlug' | 'notificationPrefs'>;

const defaultUiState: PersistedUiState = {
  theme: 'dark' as ThemeMode,
  accent: 'violet' as AccentTone,
  density: 'comfortable' as DensityMode,
  motionEnabled: true,
  tenantName: 'Test Bank Ltd',
  tenantSlug: 'test-bank-ltd',
  notificationPrefs: {
    simComplete: true,
    configChange: true,
    securityAlert: true,
    auditEvents: false,
    weeklyDigest: true,
    slackWebhook: false,
  },
};

const readPersistedState = (): PersistedUiState => {
  if (typeof window === 'undefined') return defaultUiState;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultUiState;
    return { ...defaultUiState, ...JSON.parse(stored) };
  } catch {
    return defaultUiState;
  }
};

const persistUiState = (state: Pick<AppState, 'theme' | 'accent' | 'density' | 'motionEnabled' | 'tenantName' | 'tenantSlug' | 'notificationPrefs'>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const applyUiState = (state: Pick<AppState, 'theme' | 'accent' | 'density' | 'motionEnabled'>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(state.theme);
  root.classList.toggle('reduce-motion', !state.motionEnabled);
  root.setAttribute('data-accent', state.accent);
  root.setAttribute('data-density', state.density);
};

const persistedUiState = readPersistedState();

if (typeof document !== 'undefined') {
  applyUiState(persistedUiState);
}

export const useAppStore = create<AppState>((set) => ({
  ...persistedUiState,
  sidebarCollapsed: false,
  parsedResult: null,
  matchedAdapters: null,
  currentConfigId: null,
  setTheme: (theme) => set((state) => {
    const nextState: PersistedUiState = {
      theme,
      accent: state.accent,
      density: state.density,
      motionEnabled: state.motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    applyUiState(nextState);
    persistUiState(nextState);
    return { theme };
  }),
  toggleTheme: () => set((state) => {
    const theme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
    const nextState: PersistedUiState = {
      theme,
      accent: state.accent,
      density: state.density,
      motionEnabled: state.motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    applyUiState(nextState);
    persistUiState(nextState);
    return { theme };
  }),
  setAccent: (accent) => set((state) => {
    const nextState: PersistedUiState = {
      theme: state.theme,
      accent,
      density: state.density,
      motionEnabled: state.motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    applyUiState(nextState);
    persistUiState(nextState);
    return { accent };
  }),
  setDensity: (density) => set((state) => {
    const nextState: PersistedUiState = {
      theme: state.theme,
      accent: state.accent,
      density,
      motionEnabled: state.motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    applyUiState(nextState);
    persistUiState(nextState);
    return { density };
  }),
  setMotionEnabled: (motionEnabled) => set((state) => {
    const nextState: PersistedUiState = {
      theme: state.theme,
      accent: state.accent,
      density: state.density,
      motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    applyUiState(nextState);
    persistUiState(nextState);
    return { motionEnabled };
  }),
  updateTenantInfo: ({ tenantName, tenantSlug }) => set((state) => {
    const nextState: PersistedUiState = {
      theme: state.theme,
      accent: state.accent,
      density: state.density,
      motionEnabled: state.motionEnabled,
      tenantName,
      tenantSlug,
      notificationPrefs: state.notificationPrefs,
    };
    persistUiState(nextState);
    return { tenantName, tenantSlug };
  }),
  setNotificationPref: (key, value) => set((state) => {
    const notificationPrefs = { ...state.notificationPrefs, [key]: value };
    const nextState: PersistedUiState = {
      theme: state.theme,
      accent: state.accent,
      density: state.density,
      motionEnabled: state.motionEnabled,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      notificationPrefs,
    };
    persistUiState(nextState);
    return { notificationPrefs };
  }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setParsedResult: (parsedResult) => set({ parsedResult }),
  setMatchedAdapters: (matchedAdapters) => set({ matchedAdapters }),
  setCurrentConfigId: (currentConfigId) => set({ currentConfigId }),
}));
