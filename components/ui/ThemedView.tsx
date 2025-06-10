import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'card' | 'input';
};

export function ThemedView({ style, lightColor, darkColor, type = 'default', ...otherProps }: ThemedViewProps) {
  const getColorKey = () => {
    switch (type) {
      case 'card':
        return 'cardBackground';
      case 'input':
        return 'inputBackground';
      default:
        return 'background';
    }
  };

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, getColorKey());

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}