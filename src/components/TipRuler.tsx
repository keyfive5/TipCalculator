import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useHaptics } from '../haptics';
import { fonts, useTheme } from '../theme';

const STEP = 12; // points per percent
const MAX = 50;
const LABEL_W = 32;

type Props = { value: number; onChange: (v: number) => void };

/** A swipeable ruler: every tick is 1%, with a haptic click per step. */
export function TipRuler({ value, onChange }: Props) {
  const t = useTheme();
  const h = useHaptics();
  const ref = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const last = useRef(Math.round(value));

  useEffect(() => {
    if (width > 0) ref.current?.scrollTo({ x: Math.round(value) * STEP, animated: false });
    // only on first layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = Math.max(0, Math.min(MAX, Math.round(e.nativeEvent.contentOffset.x / STEP)));
    if (v !== last.current) {
      last.current = v;
      h.tick();
      onChange(v);
    }
  };

  const nudge = (d: number) => {
    const v = Math.max(0, Math.min(MAX, Math.round(value) + d));
    last.current = v;
    onChange(v);
    ref.current?.scrollTo({ x: v * STEP, animated: true });
  };

  const pad = Math.max(0, width / 2 - STEP / 2);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Tip percentage"
      accessibilityValue={{ text: `${Math.round(value)} percent` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {width > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={Platform.OS === 'web' ? undefined : STEP}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: pad }}
        >
          <View style={styles.track}>
            {Array.from({ length: MAX + 1 }, (_, i) => {
              const major = i % 5 === 0;
              const w = major ? 2 : 1.5;
              const cx = i * STEP + STEP / 2;
              return (
                <View key={i}>
                  <View
                    style={{
                      position: 'absolute',
                      left: cx - w / 2,
                      top: major ? 6 : 15,
                      width: w,
                      height: major ? 18 : 9,
                      borderRadius: 1,
                      backgroundColor: major ? t.textDim : t.textFaint,
                    }}
                  />
                  {major && (
                    <Text style={[styles.label, { left: cx - LABEL_W / 2, color: t.textDim }]}>{i}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      {width > 0 && (
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height="100%">
          <Defs>
            <LinearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={t.bg} stopOpacity="1" />
              <Stop offset="1" stopColor={t.bg} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="fadeR" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={t.bg} stopOpacity="0" />
              <Stop offset="1" stopColor={t.bg} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={48} height="100%" fill="url(#fadeL)" />
          <Rect x={width - 48} y="0" width={48} height="100%" fill="url(#fadeR)" />
        </Svg>
      )}
      <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 1.5, backgroundColor: t.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 52, flex: 1, overflow: 'hidden' },
  track: { width: (MAX + 1) * STEP, height: 52 },
  label: {
    position: 'absolute',
    top: 28,
    width: LABEL_W,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  needle: { position: 'absolute', top: 2, width: 3, height: 26, borderRadius: 2 },
});
