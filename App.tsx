import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Calculator } from './src/Calculator';
import { SettingsProvider, useSettings } from './src/settings';
import { darkTheme, lightTheme, ThemeContext } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 350, fade: true });

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Root fontsReady={fontsLoaded || !!fontError} />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { settings, loaded } = useSettings();
  const scheme = useColorScheme();
  const dark = settings.appearance === 'system' ? scheme !== 'light' : settings.appearance === 'dark';
  const theme = dark ? darkTheme : lightTheme;
  const ready = fontsReady && loaded;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Calculator />
    </ThemeContext.Provider>
  );
}
