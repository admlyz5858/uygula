import { Theme } from '../types';

export const darkTheme: Theme = {
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceElevated: '#1C1C26',
  text: '#E8E8ED',
  textSecondary: '#8E8E9A',
  textTertiary: '#5A5A66',
  accent: '#6C63FF',
  accentLight: '#8B83FF',
  border: '#2A2A36',
  danger: '#FF6B6B',
  success: '#4ECDC4',
  completedText: '#4A4A56',
  completedBg: '#16161E',
  inputBg: '#1C1C26',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const lightTheme: Theme = {
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B6B80',
  textTertiary: '#9999AA',
  accent: '#6C63FF',
  accentLight: '#8B83FF',
  border: '#E4E4EE',
  danger: '#FF4757',
  success: '#2ED573',
  completedText: '#B0B0C0',
  completedBg: '#F0F0F5',
  inputBg: '#F0F0F8',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const getTheme = (scheme: 'light' | 'dark'): Theme => {
  return scheme === 'dark' ? darkTheme : lightTheme;
};
