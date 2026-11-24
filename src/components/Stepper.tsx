import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHaptics } from '../haptics';
import { fonts, useTheme } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  label: string;
  size?: 'md' | 'sm';
};

/** −  value  +  with press-and-hold acceleration. */
export function Stepper({ value, min, max, step = 1, onChange, format, label, size = 'md' }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const bump = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, Math.round((valueRef.current + dir * step) * 1000) / 1000));
    if (next === valueRef.current) {
      h.warn();
      stop();
      return false;
    }
    valueRef.current = next;
    h.tick();
    onChange(next);
    return true;
  };

  const startRepeat = (dir: 1 | -1) => {
    let delay = 200;
    const loop = () => {
      timer.current = setTimeout(() => {
        if (bump(dir)) {
          delay = Math.max(55, delay * 0.78);
          loop();
        }
      }, delay);
    };
    loop();
  };

  const btn = size === 'md' ? 40 : 34;

  // A render function (not a nested component) so the buttons keep their identity
  // across re-renders — otherwise press-and-hold loses its onPressOut.
  const renderButton = (dir: 1 | -1) => {
    const disabled = dir === 1 ? value >= max : value <= min;
    return (
      <PressableScale
        key={dir}
        accessibilityRole="button"
        accessibilityLabel={`${dir === 1 ? 'Increase' : 'Decrease'} ${label}`}
        accessibilityState={{ disabled }}
        hitSlop={6}
        onPress={() => bump(dir)}
        onLongPress={() => {
          if (bump(dir)) startRepeat(dir);
        }}
        delayLongPress={350}
        onPressOut={stop}
        scaleTo={0.88}
        style={[
          styles.btn,
          {
            width: btn,
            height: btn,
            borderRadius: btn / 2,
            backgroundColor: t.surfaceHi,
            opacity: disabled ? 0.35 : 1,
          },
        ]}
      >
        <Ionicons name={dir === 1 ? 'add' : 'remove'} size={size === 'md' ? 22 : 19} color={t.text} />
      </PressableScale>
    );
  };

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format ? format(value) : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => bump(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {renderButton(-1)}
      <Text
        style={[
          styles.value,
          { color: t.text, fontSize: size === 'md' ? 22 : 18, minWidth: size === 'md' ? 38 : 64 },
        ]}
      >
        {format ? format(value) : value}
      </Text>
      {renderButton(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.display, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
