import { useColorScheme as useRNColorScheme } from 'react-native';
import { useMemo } from 'react';
import { getTheme } from '../theme';
import { ColorScheme, Theme } from '../types';

export function useAppTheme(): { scheme: ColorScheme; theme: Theme } {
  const systemScheme = useRNColorScheme();
  const scheme: ColorScheme = systemScheme === 'light' ? 'light' : 'dark';

  const theme = useMemo(() => getTheme(scheme), [scheme]);

  return { scheme, theme };
}
