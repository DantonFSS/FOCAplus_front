import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { authApi, LoginRequest } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen: React.FC<{ onNavigateToRegister?: () => void; onLoginSuccess?: () => void }> = ({ 
  onNavigateToRegister,
  onLoginSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const loginData: LoginRequest = {
        email: data.email.trim(),
        password: data.password,
      };
      
      const response = await authApi.login(loginData);
      
      await login(response);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        setApiError('Tempo de requisição esgotado. Verifique sua conexão.');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        setApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else if (error.response?.status === 401) {
        setApiError('Email ou senha incorretos.');
      } else if (error.response?.status === 400) {
        setApiError(error.response?.data?.message || 'Dados inválidos.');
      } else {
        setApiError(
          error.response?.data?.message || 
          'Erro ao fazer login. Tente novamente.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/foca1.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                variant="dark"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter no mínimo 6 caracteres',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label="Senha"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                variant="dark"
              />
            )}
          />

          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {apiError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <Button
            title="Entrar"
            onPress={handleSubmit(onSubmit)}
            variant="white"
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
          />

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <Button
            title="Cadastrar-se"
            onPress={onNavigateToRegister || (() => {})}
            variant="white"
            style={styles.signupButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.blueLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.regular,
    fontFamily: theme.typography.fontFamily.regular,
    textDecorationLine: 'underline',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.white,
    opacity: 0.5,
  },
  separatorText: {
    marginHorizontal: theme.spacing.md,
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.regular,
    fontFamily: theme.typography.fontFamily.regular,
  },
  signupButton: {
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
});

