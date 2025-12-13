import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { SelectDropdown } from '../components/SelectDropdown';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { coursesApi, mapLevelToBackend, mapDivisionTypeToBackend } from '../api/courses';
import { userCoursesApi } from '../api/userCourses';
import { periodsApi } from '../api/periods';

interface NewCourseFormData {
  courseName: string;
  level: string;
  divisionType: string;
  divisionQuantity: string;
  institutionName: string;
  startDate: string;
  endDate: string;
}

const LEVEL_OPTIONS = [
  { label: 'Graduação', value: 'graduacao' },
  { label: 'Pós-graduação', value: 'pos-graduacao' },
  { label: 'Mestrado', value: 'mestrado' },
  { label: 'Doutorado', value: 'doutorado' },
  { label: 'Técnico', value: 'tecnico' },
];

const DIVISION_TYPE_OPTIONS = [
  { label: 'Semestres', value: 'semestres' },
  { label: 'Anos', value: 'anos' },
  { label: 'Períodos', value: 'periodos' },
];

const DIVISION_QUANTITY_OPTIONS = Array.from({ length: 15 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1).toString(),
}));

const convertDateToISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
};

export const NewCourseScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewCourseFormData>({
    defaultValues: {
      courseName: '',
      level: '',
      divisionType: '',
      divisionQuantity: '',
      institutionName: '',
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = async (data: NewCourseFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const courseData = {
        name: data.courseName.trim(),
        level: mapLevelToBackend(data.level),
        divisionType: mapDivisionTypeToBackend(data.divisionType),
        divisionsCount: parseInt(data.divisionQuantity, 10),
        institutionName: data.institutionName.trim(),
        startDate: convertDateToISO(data.startDate),
        endDate: convertDateToISO(data.endDate),
      };

      const createdCourse = await coursesApi.create(courseData);
      const userCourses = await userCoursesApi.getAll();
      const ownerUserCourse = userCourses.find(
        (uc) => uc.templateId === createdCourse.id && uc.role === 'OWNER'
      );

      if (!ownerUserCourse) {
        throw new Error('UserCourse do OWNER não encontrado');
      }
      (navigation as any).navigate('Home', {
        screen: 'CourseInfo',
        params: {
          userCourseId: ownerUserCourse.userCourseId,
        },
      });
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        setApiError('Tempo de requisição esgotado. Verifique sua conexão.');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        setApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else if (error.response?.status === 400) {
        setApiError(error.response?.data?.message || 'Dados inválidos. Verifique os campos.');
      } else if (error.response?.status === 401) {
        setApiError('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setApiError(
          error.response?.data?.message || 
          'Erro ao criar curso. Tente novamente.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Novo curso</Text>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="courseName"
          rules={{ required: 'Nome do curso é obrigatório' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Nome do Curso"
              containerStyle={styles.inputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.courseName?.message}
              variant="light"
            />
          )}
        />

        <Controller
          control={control}
          name="level"
          rules={{ required: 'Nível é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <SelectDropdown
              label="Nível"
              placeholder="Selecione o nível"
              options={LEVEL_OPTIONS}
              value={value}
              onChange={onChange}
              error={errors.level?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="divisionType"
          rules={{ required: 'Tipo de divisão é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <SelectDropdown
              label="Tipo de Divisão"
              placeholder="Selecione o tipo"
              options={DIVISION_TYPE_OPTIONS}
              value={value}
              onChange={onChange}
              error={errors.divisionType?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="divisionQuantity"
          rules={{ required: 'Quantidade de divisões é obrigatória' }}
          render={({ field: { onChange, value } }) => (
            <SelectDropdown
              label="Quantidade de Divisões"
              placeholder="Selecione a quantidade"
              options={DIVISION_QUANTITY_OPTIONS}
              value={value}
              onChange={onChange}
              error={errors.divisionQuantity?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="institutionName"
          rules={{ required: 'Nome da instituição é obrigatório' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Nome da Instituição"
              containerStyle={styles.inputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.institutionName?.message}
              variant="light"
            />
          )}
        />

        <Controller
          control={control}
          name="startDate"
          rules={{ required: 'Data de início é obrigatória' }}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Data de Início"
              placeholder="dd/mm/aaaa"
              value={value}
              onChange={onChange}
              error={errors.startDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          rules={{ required: 'Previsão de fim é obrigatória' }}
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Previsão de Fim"
              placeholder="dd/mm/aaaa"
              value={value}
              onChange={onChange}
              error={errors.endDate?.message}
            />
          )}
        />

        {apiError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        )}

        <Button
          title="Avançar"
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          style={styles.advanceButton}
          loading={isLoading}
          disabled={isLoading}
        />

        <Button
          title="Cancelar"
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={styles.cancelButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.black,
    letterSpacing: 0.2,
  },
  formContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  advanceButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    marginBottom: theme.spacing.lg,
  },
  errorContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.redBad,
    textAlign: 'center',
  },
});

