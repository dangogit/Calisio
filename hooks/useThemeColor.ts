import { useColorScheme } from 'react-native';

import Colors from '@/constants/colors';

/**
 * Hook to get theme-specific colors.
 * 
 * @param props - Object containing light and dark color values, e.g., { light: '#FFF', dark: '#000' }.
 * @param colorName - The name of the color property defined in constants/colors.ts (e.g., 'text', 'background').
 * @returns The color value appropriate for the current color scheme (light/dark).
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Fallback to the color defined in constants/colors.ts
  // Assumes a 'light' theme object exists. Add 'dark' in constants/colors.ts if needed.
  return Colors[theme]?.[colorName] ?? Colors.light[colorName];
} 