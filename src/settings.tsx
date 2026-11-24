import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { demoSettings } from './demo';
import { currencyFractionDigits, Money } from './money';

export type Appearance = 'system' | 'light' | 'dark';

export type Settings = {
  currency: 'auto' | string;
  haptics: boolean;
  appearance: Appearance;
  excludeTax: boolean;
  taxRate: number;
  tipPct: number;
  people: number;
  roundUp: boolean;
  presets: number[];
};

export const DEFAULT_SETTINGS: Settings = {
  currency: 'auto',
  haptics: true,
  appearance: 'system',
  excludeTax: false,
  taxRate: 8.875,
  tipPct: 20,
  people: 1,
  roundUp: false,
  presets: [15, 18, 20, 22, 25],
};

const STORAGE_KEY = 'tipwise.settings.v1';

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  money: Money;
  deviceCurrency: string;
  loaded: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

function deviceLocale() {
  try {
    const l = getLocales()[0];
    return {
      tag: l?.languageTag || 'en-US',
      currency: l?.currencyCode || 'USD',
    };
  } catch {
    return { tag: 'en-US', currency: 'USD' };
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const demo = useMemo(demoSettings, []);
  const [settings, setSettings] = useState<Settings>(() =>
    demo ? sanitize({ ...DEFAULT_SETTINGS, ...(demo as Partial<Settings>) }) : DEFAULT_SETTINGS,
  );
  const [loaded, setLoaded] = useState(!!demo);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const device = useMemo(deviceLocale, []);

  useEffect(() => {
    if (demo) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings((s) => sanitize({ ...s, ...parsed }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [demo]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = sanitize({ ...prev, ...patch });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (demo) return next;
      saveTimer.current = setTimeout(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      }, 250);
      return next;
    });
  }, [demo]);

  const money = useMemo<Money>(() => {
    const code = settings.currency === 'auto' ? device.currency : settings.currency;
    return { locale: device.tag, currency: code, fractionDigits: currencyFractionDigits(code) };
  }, [settings.currency, device]);

  const value = useMemo(
    () => ({ settings, update, money, deviceCurrency: device.currency, loaded }),
    [settings, update, money, device.currency, loaded],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

function sanitize(s: Settings): Settings {
  const clamp = (v: unknown, lo: number, hi: number, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
  return {
    ...s,
    tipPct: clamp(s.tipPct, 0, 100, DEFAULT_SETTINGS.tipPct),
    people: Math.round(clamp(s.people, 1, 99, 1)),
    taxRate: clamp(s.taxRate, 0, 40, DEFAULT_SETTINGS.taxRate),
    presets:
      Array.isArray(s.presets) && s.presets.length === 5 && s.presets.every((p) => typeof p === 'number')
        ? s.presets
        : DEFAULT_SETTINGS.presets,
  };
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside SettingsProvider');
  return ctx;
}
