import { ReactNode, useRef, useState } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: ReactNode;
};

/** A Pressable that springs down slightly while held. */
export function PressableScale({ style, pressedStyle, scaleTo = 0.95, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 50, bounciness: v === 1 ? 6 : 0 }).start();

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        to(1);
        onPressOut?.(e);
      }}
      style={[style, pressed && pressedStyle, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
