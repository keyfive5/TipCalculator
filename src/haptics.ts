import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSettings } from './settings';

const enabledPlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export function useHaptics() {
  const { settings } = useSettings();
  const on = settings.haptics && enabledPlatform;
  return useMemo(
    () => ({
      tap: () => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
      tick: () => on && Haptics.selectionAsync().catch(() => {}),
      thud: () => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
      heavy: () => on && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
      success: () =>
        on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
      warn: () =>
        on && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
    }),
    [on],
  );
}
