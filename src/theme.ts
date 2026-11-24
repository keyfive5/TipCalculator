import { createContext, useContext } from 'react';

export type Theme = {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceHi: string;
  surfacePressed: string;
  line: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  accentInk: string;
  accentInkDim: string;
  accentSoft: string;
  accentText: string;
  danger: string;
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#0E0D0B',
  surface: '#191714',
  surfaceHi: '#23201C',
  surfacePressed: '#2E2A24',
  line: 'rgba(255,236,204,0.09)',
  text: '#F6F0E6',
  textDim: '#A89F91',
  textFaint: '#6F685D',
  accent: '#F4B740',
  accentInk: '#1B1406',
  accentInkDim: 'rgba(27,20,6,0.62)',
  accentSoft: 'rgba(244,183,64,0.14)',
  accentText: '#F4B740',
  danger: '#FF8A7A',
};

export const lightTheme: Theme = {
  dark: false,
  bg: '#F4EEE3',
  surface: '#FFFCF6',
  surfaceHi: '#EAE2D3',
  surfacePressed: '#E0D6C4',
  line: 'rgba(60,40,10,0.10)',
  text: '#1D1A15',
  textDim: '#6C6458',
  textFaint: '#A2998B',
  accent: '#F0AE35',
  accentInk: '#1D1406',
  accentInkDim: 'rgba(29,20,6,0.62)',
  accentSoft: 'rgba(214,146,24,0.14)',
  accentText: '#A06A08',
  danger: '#C2412D',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const ThemeContext = createContext<Theme>(darkTheme);
export const useTheme = () => useContext(ThemeContext);
