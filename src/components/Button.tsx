import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'white';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const buttonStyle: ViewStyle = {
    backgroundColor: variant === 'white' ? theme.colors.white : variant === 'primary' ? theme.colors.blueLight : theme.colors.white,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.blueLight,
    opacity: disabled || loading ? 0.6 : 1,
  };

  const textStyle: TextStyle = {
    color: variant === 'white' ? theme.colors.blueLight : variant === 'primary' ? theme.colors.white : theme.colors.blueLight,
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'white' || variant === 'secondary' ? theme.colors.blueLight : theme.colors.white} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    letterSpacing: 0,
  },
});

