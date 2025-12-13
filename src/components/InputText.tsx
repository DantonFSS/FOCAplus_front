import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Animated, StyleProp } from 'react-native';
import { theme } from '../theme';

interface InputTextProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'dark' | 'light';
}

export const InputText: React.FC<InputTextProps> = ({
  label,
  error,
  containerStyle,
  secureTextEntry,
  variant = 'dark',
  value,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const checkHasValue = (val: string | undefined | null): boolean => {
    return !!(val && typeof val === 'string' && val.trim().length > 0);
  };

  const initialHasValue = checkHasValue(value);
  const animatedLabelPosition = useRef(new Animated.Value(initialHasValue ? 1 : 0)).current;
  const animatedLabelSize = useRef(new Animated.Value(initialHasValue ? 1 : 0)).current;

  const isLight = variant === 'light';
  const borderColor = error
    ? theme.colors.redBad
    : isFocused
    ? (isLight ? theme.colors.blueLight : 'rgba(255, 255, 255, 0.8)')
    : isLight
    ? theme.colors.grayLight
    : 'rgba(255, 255, 255, 0.6)';
  
  const textColor = isLight ? theme.colors.black : theme.colors.white;
  const placeholderColor = isLight ? theme.colors.gray : 'rgba(255, 255, 255, 0.8)';
  const eyeIconColor = isLight ? theme.colors.grayDark : theme.colors.white;
  const errorTextColor = isLight ? theme.colors.redBad : theme.colors.white;

  const displayLabel = label || textInputProps.placeholder || '';
  const hasValue = checkHasValue(value);
  const actualPlaceholder = undefined;
  
  const shouldShowLabel = !!displayLabel;

  useEffect(() => {
    const currentHasValue = checkHasValue(value);
    const shouldFloat = isFocused || currentHasValue;
    Animated.parallel([
      Animated.timing(animatedLabelPosition, {
        toValue: shouldFloat ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLabelSize, {
        toValue: shouldFloat ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, value]);

  const labelTop = animatedLabelPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 4],
  });

  const labelFontSize = animatedLabelSize.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11], // Reduz o tamanho quando sobe
  });

  const labelOpacity = animatedLabelSize.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1], // Aumenta opacidade quando sobe
  });

  return (
    <View style={[styles.container, containerStyle, { flex: 1, minWidth: 0 }]}>
      <View style={[styles.inputWrapper, { flex: 1, overflow: 'hidden' }]}>
        {shouldShowLabel && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              !isLight && styles.floatingLabelDark,
              {
                top: labelTop,
                fontSize: labelFontSize,
                opacity: labelOpacity,
                color: !isLight ? theme.colors.white : theme.colors.grayDark,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayLabel}
          </Animated.Text>
        )}
        <View style={[styles.inputContainer, { borderBottomColor: borderColor }]}>
          <TextInput
            {...textInputProps}
            style={[styles.input, { color: textColor }, textInputProps.multiline && styles.inputMultiline]}
            placeholderTextColor={placeholderColor}
            secureTextEntry={secureTextEntry && !showPassword}
            value={value || ''}
            placeholder={actualPlaceholder}
            onFocus={(e) => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
          />
          {secureTextEntry && (
            <Text
              style={[styles.eyeIcon, { color: eyeIconColor }]}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          )}
        </View>
      </View>
      {error && <Text style={[styles.errorText, { color: errorTextColor }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontWeight: '600',
    zIndex: 1,
    backgroundColor: 'transparent',
    maxWidth: '100%',
  },
  floatingLabelDark: {
    color: theme.colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingTop: 20,
    borderBottomColor: theme.colors.grayLight,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    fontWeight: '500',
    borderWidth: 0,
    outlineWidth: 0 as any,
    outlineStyle: 'none' as any,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 8,
  },
  eyeIcon: {
    fontSize: 20,
    padding: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    opacity: 0.9,
  },
});

