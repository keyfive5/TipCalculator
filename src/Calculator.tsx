import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BillDisplay } from './components/BillDisplay';
import { Keypad } from './components/Keypad';
import { PressableScale } from './components/PressableScale';
import { ResultCard } from './components/ResultCard';
import { SettingsSheet } from './components/SettingsSheet';
import { Stepper } from './components/Stepper';
import { TipSection } from './components/TipSection';
import { demoParams } from './demo';
import { useHaptics } from './haptics';
import { applyKey, computeTip, decimalSeparator, formatMinor, formatPct, rawToMinor } from './money';
import { useSettings } from './settings';
import { fonts, useTheme } from './theme';

export function tipMood(pct: number) {
  if (pct <= 0) return 'No tip';
  if (pct < 10) return 'Light';
  if (pct < 15) return 'Fair';
  if (pct < 18) return 'Good';
  if (pct < 20) return 'Great';
  if (pct < 23) return 'Excellent';
  if (pct < 30) return 'Outstanding';
  return 'Legendary';
}

export function Calculator() {
  const t = useTheme();
  const h = useHaptics();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const tight = height < 700;
  const { settings, update, money } = useSettings();
  const fd = money.fractionDigits;

  const [raw, setRaw] = useState(() => demoParams()?.get('bill') ?? '');
  const rawRef = useRef(raw);
  rawRef.current = raw;
  const [shake, setShake] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(() => demoParams()?.get('sheet') === '1');

  // Keep the typed amount valid if the currency changes precision.
  useEffect(() => {
    setRaw((r) => {
      const [i, d] = r.split('.');
      if (d === undefined) return r;
      return fd === 0 ? i : `${i}.${d.slice(0, fd)}`;
    });
  }, [fd]);

  const onKey = useCallback(
    (k: string) => {
      const prev = rawRef.current;
      const next = applyKey(prev, k, fd);
      if (next === prev) {
        if (k === 'back' || k === 'clear' || (k === '0' && prev === '0')) return;
        h.warn();
        setShake((s) => s + 1);
        return;
      }
      rawRef.current = next;
      setRaw(next);
    },
    [fd, h],
  );

  const billMinor = rawToMinor(raw, fd);
  const result = useMemo(
    () =>
      computeTip({
        billMinor,
        tipPct: settings.tipPct,
        people: settings.people,
        roundUp: settings.roundUp,
        excludeTax: settings.excludeTax,
        taxRate: settings.taxRate,
        fractionDigits: fd,
      }),
    [billMinor, settings.tipPct, settings.people, settings.roundUp, settings.excludeTax, settings.taxRate, fd],
  );

  const onShare = useCallback(async () => {
    const f = (m: number) => formatMinor(m, money);
    const lines = [
      `Bill: ${f(billMinor)}`,
      `Tip (${formatPct(result.effectivePct)}): ${f(result.tipMinor)}`,
      `Total: ${f(result.totalMinor)}`,
    ];
    if (settings.people > 1) {
      lines.push(
        `Split ${settings.people} ways: ${f(result.shareMinor)} each` +
          (result.lowerCount > 0 ? ` (${result.lowerCount} pay ${f(result.shareMinor - 1)})` : ''),
      );
    }
    lines.push('', 'Worked out with Tipwise');
    const message = lines.join('\n');
    try {
      await Share.share({ message });
    } catch {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(message).catch(() => {});
      }
    }
  }, [billMinor, result, settings.people, money]);

  const people = settings.people;
  const gap = tight ? 8 : compact ? 10 : 16;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: t.bg,
          paddingTop: insets.top + (compact ? 2 : 6),
          paddingBottom: Math.max(insets.bottom, 14),
        },
      ]}
    >
      <View style={[styles.column, { gap }]}>
        <View style={[styles.header, tight && { height: 38 }]}>
          <Text style={[styles.wordmark, { color: t.text }]} accessibilityRole="header">
            Tip<Text style={{ fontFamily: fonts.displayItalic, color: t.accentText }}>wise</Text>
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {
              h.tap();
              setSettingsOpen(true);
            }}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.line }]}
            pressedStyle={{ backgroundColor: t.surfacePressed }}
          >
            <Ionicons name="settings-outline" size={20} color={t.text} />
          </PressableScale>
        </View>

        <ResultCard
          result={result}
          billMinor={billMinor}
          people={people}
          roundUp={settings.roundUp}
          excludeTax={settings.excludeTax}
          money={money}
          compact={compact}
          tight={tight}
          onToggleRound={() => update({ roundUp: !settings.roundUp })}
          onShare={onShare}
        />

        <BillDisplay
          raw={raw}
          money={money}
          compact={compact}
          shakeKey={shake}
          onClear={() => {
            h.thud();
            setRaw('');
          }}
        />

        <TipSection
          pct={settings.tipPct}
          presets={settings.presets}
          caption={tipMood(settings.tipPct)}
          tight={tight}
          onChange={(p) => update({ tipPct: p })}
        />

        <View style={[styles.splitRow, tight && { minHeight: 42 }]}>
          <View style={styles.splitLeft}>
            <Text style={[styles.label, { color: t.textDim }]}>SPLIT</Text>
            <View style={styles.people} importantForAccessibility="no-hide-descendants">
              {Array.from({ length: Math.min(people, 6) }, (_, i) => (
                <Ionicons key={i} name="person" size={14} color={t.accentText} style={{ marginRight: -1 }} />
              ))}
              <Text style={[styles.peopleText, { color: t.textDim }]}>
                {people === 1 ? 'Just me' : people > 6 ? `+${people - 6}` : ''}
              </Text>
            </View>
          </View>
          <Stepper
            label="Number of people"
            value={people}
            min={1}
            max={99}
            format={(v) => String(v)}
            onChange={(v) => update({ people: v })}
          />
        </View>

        <Keypad
          onKey={onKey}
          decimalSeparator={decimalSeparator(money.locale)}
          allowDecimal={fd > 0}
          compact={compact}
        />
      </View>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  wordmark: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.5 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6 },
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  splitLeft: { gap: 6 },
  people: { flexDirection: 'row', alignItems: 'center', height: 18 },
  peopleText: { fontFamily: fonts.bodyMedium, fontSize: 13, marginLeft: 6 },
});
