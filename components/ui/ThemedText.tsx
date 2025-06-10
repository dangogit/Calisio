import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { typography } from '@/constants/designTokens';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'heading1' | 'heading2' | 'heading3';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  color = 'primary',
  ...rest
}: ThemedTextProps) {
  const getColorKey = () => {
    switch (color) {
      case 'primary':
        return 'text';
      case 'secondary':
        return 'textSecondary';
      case 'tertiary':
        return 'textTertiary';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'text';
    }
  };

  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, getColorKey());

  return (
    <Text
      style={[
        { color: textColor },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'heading1' ? styles.heading1 : undefined,
        type === 'heading2' ? styles.heading2 : undefined,
        type === 'heading3' ? styles.heading3 : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.normal,
  },
  defaultSemiBold: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  heading1: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
  },
  heading2: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
  },
  heading3: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },
  link: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.medium,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.normal,
  },
});