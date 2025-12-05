import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Animated } from 'react-native';
import { theme } from '../theme';

interface InputTextProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
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
  
  // Função auxiliar para verificar se tem valor
  const checkHasValue = (val: string | undefined | null): boolean => {
    return !!(val && typeof val === 'string' && val.trim().length > 0);
  };

  // Animações para o floating label - inicializar baseado no valor inicial
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

  // Sempre usar label flutuante - não mostrar placeholder
  // Se não tiver label, usar placeholder como label (mas não mostrar como placeholder)
  const displayLabel = label || textInputProps.placeholder || '';
  // Verificar se tem valor (não vazio)
  const hasValue = checkHasValue(value);
  // Nunca mostrar placeholder - sempre usar floating label
  const actualPlaceholder = undefined;
  
  // Se não tiver label nem placeholder, não mostrar nada
  const shouldShowLabel = !!displayLabel;

  // Animar label quando focado ou quando há valor
  useEffect(() => {
    // Label sobe apenas se estiver focado OU se tiver valor (não vazio)
    // Se não estiver focado E não tiver valor, volta para baixo
    const currentHasValue = checkHasValue(value);
    const shouldFloat = isFocused || currentHasValue;
    
    // Forçar animação mesmo se o valor não mudou, mas o foco mudou
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

  // Posição e tamanho do label animado
  const labelTop = animatedLabelPosition.interpolate({
    inputRange: [0, 1],
    // Mantém o label dentro da área do campo para não ser coberto por campos acima
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
    // Remover borda/outline nativos (especialmente no web) para evitar
    // o "quadrado de seleção" amarelo distorcido ao redor do campo
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

