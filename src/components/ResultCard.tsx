import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useHaptics } from '../haptics';
import { formatMinor, formatPct, Money, TipResult } from '../money';
import { fonts, useTheme } from '../theme';
import { useAnimatedNumber } from '../useAnimatedNumber';
import { PressableScale } from './PressableScale';

type Props = {
  result: TipResult;
  billMinor: number;
  people: number;
  roundUp: boolean;
  excludeTax: boolean;
  money: Money;
  onToggleRound: () => void;
  onShare: () => void;
  compact: boolean;
  tight?: boolean;
};

function bigSize(text: string, compact: boolean, tight?: boolean) {
  const n = text.length;
  const base = tight ? 46 : compact ? 52 : 62;
  if (n <= 7) return base;
  if (n <= 9) return base - 8;
  if (n <= 11) return base - 16;
  if (n <= 13) return base - 22;
  return base - 28;
}

export function ResultCard({ result, billMinor, people, roundUp, excludeTax, money, onToggleRound, onShare, compact, tight }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const [w, setW] = useState(0);
  const empty = billMinor === 0;
  const animated = useAnimatedNumber(result.shareMinor);
  const bigText = formatMinor(Math.round(animated), money);
  const split = people > 1;

  const hints: string[] = [];
  if (empty) hints.push('Type the bill amount below');
  else {
    if (excludeTax) hints.push(`Tip on ${formatMinor(result.baseMinor, money)} before tax`);
    if (roundUp && result.adjusted) hints.push(`Rounded up · tip is ${formatPct(result.effectivePct)}`);
    if (result.lowerCount > 0)
      hints.push(`${result.lowerCount} of ${people} pay ${formatMinor(result.shareMinor - 1, money)}`);
    if (split && hints.length < 2) hints.push(`Tip each ${formatMinor(Math.round(result.tipMinor / people), money)}`);
  }

  const a11ySummary = empty
    ? 'No bill entered yet'
    : `${split ? `Each of ${people} people pays` : 'You pay'} ${formatMinor(result.shareMinor, money)}. ` +
      `Tip ${formatMinor(result.tipMinor, money)}, total ${formatMinor(result.totalMinor, money)}.`;

  const teeth = Math.max(1, Math.floor(w / 14));
  const toothW = w / teeth;
  let d = `M0 0 L${w} 0 `;
  for (let i = teeth; i > 0; i--) {
    const x = i * toothW;
    d += `L${x - toothW / 2} 7 L${x - toothW} 0 `;
  }
  d += 'Z';

  return (
    <View style={styles.shadow} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View
        style={[
          styles.card,
          { backgroundColor: t.accent, padding: tight ? 14 : compact ? 16 : 20 },
          t.dark && { shadowColor: t.accent, shadowOpacity: 0.2, shadowRadius: 28, shadowOffset: { width: 0, height: 10 } },
        ]}
      >
        <View style={styles.topRow} accessible accessibilityLabel={a11ySummary}>
          <Text style={[styles.label, { color: t.accentInkDim }]}>
            {split ? `EACH OF ${people} PAYS` : 'YOU PAY'}
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Share the split"
          disabled={empty}
          onPress={() => {
            h.tap();
            onShare();
          }}
          hitSlop={8}
          style={[styles.shareBtn, { opacity: empty ? 0.35 : 1 }]}
        >
          <Ionicons name="share-outline" size={19} color={t.accentInk} />
        </PressableScale>

        <Text
          numberOfLines={1}
          style={[
            styles.big,
            {
              color: t.accentInk,
              opacity: empty ? 0.32 : 1,
              fontSize: bigSize(bigText, compact, tight),
              lineHeight: bigSize(bigText, compact, tight) * 1.12,
            },
          ]}
        >
          {bigText}
        </Text>
        <Text numberOfLines={1} style={[styles.hint, { color: t.accentInkDim }]}>
          {hints.slice(0, 2).join('  ·  ') || ' '}
        </Text>

        <View style={[styles.dots, tight && { marginVertical: 9 }]}>
          {Array.from({ length: 36 }, (_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: t.accentInk }]} />
          ))}
        </View>

        <View style={styles.statsRow}>
          <Stat label="TIP" value={formatMinor(result.tipMinor, money)} />
          <Stat
            label={split ? 'TOTAL' : 'BILL'}
            value={formatMinor(split ? result.totalMinor : billMinor, money)}
          />
          <PressableScale
            accessibilityRole="switch"
            accessibilityLabel="Round up"
            accessibilityHint="Rounds each person's share up to a whole amount"
            accessibilityState={{ checked: roundUp }}
            onPress={() => {
              h.thud();
              onToggleRound();
            }}
            style={[
              styles.roundPill,
              roundUp
                ? { backgroundColor: t.accentInk, borderColor: t.accentInk }
                : { backgroundColor: 'transparent', borderColor: t.accentInkDim },
            ]}
          >
            <Ionicons
              name={roundUp ? 'checkmark-circle' : 'arrow-up-circle-outline'}
              size={15}
              color={roundUp ? t.accent : t.accentInk}
            />
            <Text style={[styles.roundText, { color: roundUp ? t.accent : t.accentInk }]}>Round up</Text>
          </PressableScale>
        </View>
      </View>
      {w > 0 && (
        <Svg width={w} height={8} style={styles.teeth}>
          <Path d={d} fill={t.accent} />
        </Svg>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: t.accentInkDim }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.statValue, { color: t.accentInk }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { paddingBottom: 7 },
  card: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', minHeight: 22, paddingRight: 44 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6 },
  shareBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  big: { fontFamily: fonts.display, letterSpacing: -1.5, marginTop: 2, fontVariant: ['tabular-nums'] },
  hint: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, minHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14, overflow: 'hidden' },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.25 },
  statsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  stat: { flex: 1, minWidth: 0 },
  statLabel: { fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 1.4, marginBottom: 2 },
  statValue: { fontFamily: fonts.display, fontSize: 21, fontVariant: ['tabular-nums'] },
  roundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  roundText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  teeth: { position: 'absolute', bottom: 0, left: 0 },
});
