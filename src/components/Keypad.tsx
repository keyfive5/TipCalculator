import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHaptics } from '../haptics';
import { fonts, useTheme } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  onKey: (key: string) => void;
  decimalSeparator: string;
  allowDecimal: boolean;
  compact: boolean;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export const Keypad = memo(function Keypad({ onKey, decimalSeparator, allowDecimal, compact }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const gap = compact ? 8 : 10;

  return (
    <View style={[styles.wrap, { gap }]}>
      {ROWS.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((k) => {
            const disabled = k === '.' && !allowDecimal;
            const label =
              k === 'back' ? 'Delete. Hold to clear' : k === '.' ? 'Decimal point' : k;
            return (
              <PressableScale
                key={k}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                onPress={() => {
                  h.tap();
                  onKey(k);
                }}
                onLongPress={
                  k === 'back'
                    ? () => {
                        h.heavy();
                        onKey('clear');
                      }
                    : undefined
                }
                delayLongPress={450}
                style={[
                  styles.key,
                  {
                    backgroundColor: k === 'back' || k === '.' ? 'transparent' : t.surface,
                    borderColor: t.line,
                    borderWidth: k === 'back' || k === '.' ? 0 : StyleSheet.hairlineWidth,
                    opacity: disabled ? 0.25 : 1,
                  },
                ]}
                pressedStyle={{ backgroundColor: t.surfacePressed }}
                scaleTo={0.93}
              >
                {k === 'back' ? (
                  <Ionicons name="backspace-outline" size={compact ? 24 : 27} color={t.text} />
                ) : (
                  <Text
                    style={[
                      styles.keyText,
                      { color: t.text, fontSize: compact ? 25 : 28 },
                      k === '.' && { fontSize: compact ? 30 : 34, marginTop: -8 },
                    ]}
                  >
                    {k === '.' ? decimalSeparator : k}
                  </Text>
                )}
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 168, maxHeight: 300 },
  row: { flex: 1, flexDirection: 'row' },
  key: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontFamily: fonts.bodyMedium, includeFontPadding: false },
});
