import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native';
import { demoParams } from '../demo';
import { useHaptics } from '../haptics';
import { formatPct } from '../money';
import { fonts, useTheme } from '../theme';
import { PressableScale } from './PressableScale';
import { TipRuler } from './TipRuler';

type Props = {
  pct: number;
  presets: number[];
  onChange: (pct: number) => void;
  caption?: string;
  tight?: boolean;
};

export function TipSection({ pct, presets, onChange, caption, tight }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const [ruler, setRuler] = useState(() => demoParams()?.get('ruler') === '1');
  const isPreset = presets.includes(pct);

  const toggleRuler = (open: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
    h.thud();
    setRuler(open);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.label, { color: t.textDim }]}>TIP</Text>
        <Text style={[styles.caption, { color: t.textFaint }]} numberOfLines={1}>
          {caption}
        </Text>
        <Text style={[styles.value, { color: t.text }]}>{formatPct(pct)}</Text>
      </View>

      <View style={[styles.body, tight && { height: 46 }]}>
        {ruler ? (
          <View style={styles.rulerRow}>
            <TipRuler value={pct} onChange={onChange} />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Done adjusting tip"
              onPress={() => toggleRuler(false)}
              style={[styles.doneBtn, { backgroundColor: t.accent }]}
            >
              <Ionicons name="checkmark" size={22} color={t.accentInk} />
            </PressableScale>
          </View>
        ) : (
          <View style={styles.chips}>
            {presets.map((p, idx) => {
              const on = p === pct;
              return (
                <PressableScale
                  key={idx}
                  accessibilityRole="button"
                  accessibilityLabel={`${p} percent tip`}
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    h.tick();
                    onChange(p);
                  }}
                  style={[
                    styles.chip,
                    on
                      ? { backgroundColor: t.accent, borderColor: t.accent }
                      : { backgroundColor: t.surface, borderColor: t.line },
                  ]}
                  pressedStyle={!on && { backgroundColor: t.surfacePressed }}
                >
                  <Text style={[styles.chipText, { color: on ? t.accentInk : t.text }]}>
                    {p}
                    <Text style={styles.chipPct}>%</Text>
                  </Text>
                </PressableScale>
              );
            })}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={isPreset ? 'Custom tip' : `Custom tip, ${pct} percent`}
              accessibilityState={{ selected: !isPreset }}
              onPress={() => toggleRuler(true)}
              style={[
                styles.chip,
                !isPreset
                  ? { backgroundColor: t.accent, borderColor: t.accent }
                  : { backgroundColor: t.surface, borderColor: t.line },
              ]}
              pressedStyle={isPreset && { backgroundColor: t.surfacePressed }}
            >
              {isPreset ? (
                <Ionicons name="options-outline" size={20} color={t.text} />
              ) : (
                <Text style={[styles.chipText, { color: t.accentInk }]}>
                  {Math.round(pct)}
                  <Text style={styles.chipPct}>%</Text>
                </Text>
              )}
            </PressableScale>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8, gap: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6 },
  caption: { flex: 1, fontFamily: fonts.body, fontSize: 12 },
  value: { fontFamily: fonts.display, fontSize: 20 },
  body: { height: 52 },
  chips: { flexDirection: 'row', gap: 6, flex: 1 },
  chip: {
    flex: 1,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 16 },
  chipPct: { fontSize: 12 },
  rulerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  doneBtn: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
