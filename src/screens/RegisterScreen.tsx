import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { authApi, RegisterRequest } from '../api/auth';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export const RegisterScreen: React.FC<{ onNavigateToLogin?: () => void }> = ({ onNavigateToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const registerData: RegisterRequest = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        username: data.username.trim() || data.email.trim().split('@')[0],
      };
      
      const response = await authApi.register(registerData);
      
      if (onNavigateToLogin) {
        onNavigateToLogin();
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        setApiError('Tempo de requisição esgotado. Verifique sua conexão.');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        setApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else if (error.response?.status === 400) {
        setApiError(error.response?.data?.message || 'Dados inválidos. Verifique os campos.');
      } else if (error.response?.status === 409) {
        setApiError('Email ou username já está em uso.');
      } else {
        setApiError(
          error.response?.data?.message || 
          'Erro ao criar conta. Tente novamente.'
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

        <Text style={styles.title}>Cadastro</Text>

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="name"
            rules={{
              required: 'Nome é obrigatório',
              minLength: {
                value: 3,
                message: 'Nome deve ter no mínimo 3 caracteres',
              },
              maxLength: {
                value: 200,
                message: 'Nome deve ter no máximo 200 caracteres',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label="Seu nome"
                autoCapitalize="words"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                variant="light"
              />
            )}
          />

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
                label="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                variant="light"
              />
            )}
          />

          <Controller
            control={control}
            name="username"
            rules={{
              required: 'Username é obrigatório',
              minLength: {
                value: 3,
                message: 'Username deve ter no mínimo 3 caracteres',
              },
              maxLength: {
                value: 30,
                message: 'Username deve ter no máximo 30 caracteres',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label="Username"
                autoCapitalize="none"
                autoComplete="username"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
                variant="light"
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
                variant="light"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Confirmação de senha é obrigatória',
              validate: (value) =>
                value === password || 'As senhas não coincidem',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label="Confirme a senha"
                secureTextEntry
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                variant="light"
              />
            )}
          />

          {apiError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <Button
            title="Cadastrar"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            style={styles.registerButton}
            loading={isLoading}
            disabled={isLoading}
          />

          <TouchableOpacity 
            style={styles.loginLinkContainer}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.loginLinkText}>
              Já tem conta? <Text style={styles.loginLinkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.blueLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: theme.spacing.sm,
  },
  errorContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.redBad,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  loginLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grayDark,
  },
  loginLinkBold: {
    color: theme.colors.blueLight,
    fontWeight: '600',
  },
});

