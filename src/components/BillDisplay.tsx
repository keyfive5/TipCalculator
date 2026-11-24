import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { formatMinor, formatRawInput, Money } from '../money';
import { fonts, useTheme } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  raw: string;
  money: Money;
  onClear: () => void;
  compact: boolean;
  shakeKey: number;
};

export function BillDisplay({ raw, money, onClear, compact, shakeKey }: Props) {
  const t = useTheme();
  const blink = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const empty = raw === '';
  const text = empty ? formatMinor(0, money) : formatRawInput(raw, money);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 520, delay: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  useEffect(() => {
    if (!shakeKey) return;
    shake.setValue(0);
    Animated.sequence(
      [6, -6, 4, -4, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true })),
    ).start();
  }, [shakeKey, shake]);

  const size = compact ? 34 : 40;
  const fs = text.length > 12 ? size - 8 : size;

  return (
    <View style={styles.row} accessible accessibilityLabel={`Bill amount ${empty ? 'empty' : text}`}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: t.textDim }]}>BILL</Text>
        {!empty && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Clear bill"
            onPress={onClear}
            hitSlop={10}
            style={[styles.clear, { backgroundColor: t.surfaceHi }]}
          >
            <Text style={[styles.clearText, { color: t.textDim }]}>Clear</Text>
          </PressableScale>
        )}
      </View>
      <Animated.View style={[styles.amountWrap, { transform: [{ translateX: shake }] }]}>
        <Text
          numberOfLines={1}
          style={[styles.amount, { color: empty ? t.textFaint : t.text, fontSize: fs, lineHeight: fs * 1.15 }]}
        >
          {text}
        </Text>
        <Animated.View style={[styles.caret, { backgroundColor: t.accent, height: fs * 0.85, opacity: blink }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  left: { gap: 6, alignItems: 'flex-start' },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6 },
  clear: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  clearText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  amountWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  amount: { fontFamily: fonts.display, letterSpacing: -1, fontVariant: ['tabular-nums'], flexShrink: 1 },
  caret: { width: 2.5, borderRadius: 2, marginLeft: 3 },
});
