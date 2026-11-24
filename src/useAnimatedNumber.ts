import { useEffect, useRef, useState } from 'react';

/** Smoothly counts from the previous value to `target` (ease-out cubic). */
export function useAnimatedNumber(target: number, duration = 280) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const valueRef = useRef(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    const from = valueRef.current;
    if (from === target) return;
    fromRef.current = from;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = t >= 1 ? target : from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
