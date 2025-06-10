import React from 'react';
import { Pressable, PressableProps, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, typography, shadows } from '@/constants/designTokens';

export type ThemedButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ThemedButtonProps) {
  const getBackgroundColorKey = () => {
    switch (variant) {
      case 'primary':
        return 'buttonPrimary';
      case 'secondary':
        return 'buttonSecondary';
      case 'danger':
        return 'buttonDanger';
      case 'ghost':
        return 'transparent';
      default:
        return 'buttonPrimary';
    }
  };

  const getTextColorKey = () => {
    switch (variant) {
      case 'ghost':
        return 'text';
      default:
        return 'text';
    }
  };

  const backgroundColor = useThemeColor({}, getBackgroundColorKey());
  const textColor = useThemeColor({}, getTextColorKey());
  const borderColor = useThemeColor({}, 'border');

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          minHeight: 56,
        };
      default:
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          minHeight: 48,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return typography.fontSize.sm;
      case 'large':
        return typography.fontSize.lg;
      default:
        return typography.fontSize.md;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.button,
        getSizeStyles(),
        {
          backgroundColor: variant === 'ghost' ? 'transparent' : backgroundColor,
          borderColor: variant === 'ghost' ? borderColor : 'transparent',
          borderWidth: variant === 'ghost' ? 1 : 0,
          opacity: isDisabled ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        shadows.small,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {({ pressed }) => (
        <ThemedText
          style={[
            styles.buttonText,
            {
              color: textColor,
              fontSize: getFontSize(),
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {loading && <ActivityIndicator size="small" color={textColor} style={styles.loader} />}
          {!loading && icon && iconPosition === 'left' && (
            <React.Fragment>{icon} </React.Fragment>
          )}
          {title}
          {!loading && icon && iconPosition === 'right' && (
            <React.Fragment> {icon}</React.Fragment>
          )}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    marginRight: spacing.sm,
  },
});