import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { disciplinesApi, DisciplineTemplateResponse } from '../api/disciplines';
import { periodsApi } from '../api/periods';

interface DisciplineFormData {
  disciplineCount: string;
  disciplines: { name: string }[];
}

export const AddDisciplinesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingDisciplines = (route.params as any)?.existingDisciplines || [];
  const periodNumber = (route.params as any)?.periodNumber;
  const createdCourse = (route.params as any)?.createdCourse;
  const periodTemplateIdFromParams = (route.params as any)?.periodTemplateId as string | undefined | null;
  const [periodTemplateId, setPeriodTemplateId] = useState<string | null>(periodTemplateIdFromParams ?? null);

  // Atualizar periodTemplateId quando os params mudarem
  useEffect(() => {
    if (periodTemplateIdFromParams) {
      setPeriodTemplateId(periodTemplateIdFromParams);
    }
  }, [periodTemplateIdFromParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(false);
  const [loadedDisciplines, setLoadedDisciplines] = useState<DisciplineTemplateResponse[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DisciplineFormData>({
    defaultValues: {
      disciplineCount: '2',
      disciplines: [{ name: '' }, { name: '' }],
    },
  });

  const disciplineCount = watch('disciplineCount');
  const disciplineFields = watch('disciplines');

  // Não tentar resolver periodTemplateId automaticamente (pode dar 403)
  // O periodTemplateId deve vir sempre dos params de navegação

  // Carregar disciplinas existentes do backend
  useEffect(() => {
    const loadDisciplines = async () => {
      if (!periodTemplateId) return;

      setIsLoadingDisciplines(true);
      try {
        const disciplines = await disciplinesApi.getByPeriod(periodTemplateId);
        setLoadedDisciplines(disciplines);

        // Converter para o formato esperado pela tela anterior
        const formattedDisciplines = disciplines.map((d, index) => ({
          id: index + 1,
          name: d.name,
        }));

        // Atualizar existingDisciplines se necessário
        if (formattedDisciplines.length > 0 && existingDisciplines.length === 0) {
          (route.params as any).existingDisciplines = formattedDisciplines;
        }
      } catch (error) {
        console.error('❌ Erro ao carregar disciplinas:', error);
      } finally {
        setIsLoadingDisciplines(false);
      }
    };

    loadDisciplines();
  }, [periodTemplateId, existingDisciplines.length, route.params]);

  const updateDisciplineCount = (count: string) => {
    const num = parseInt(count) || 0;
    const newDisciplines = Array.from({ length: num }, (_, i) => ({
      name: disciplineFields[i]?.name || '',
    }));
    setValue('disciplines', newDisciplines);
  };

  const onSubmit = async (data: DisciplineFormData) => {
    // Usar periodTemplateId dos params (mais confiável) ou do estado
    const effectivePeriodTemplateId = periodTemplateIdFromParams || periodTemplateId;
    
    if (!effectivePeriodTemplateId) {
      Alert.alert(
        'Erro', 
        'Período não encontrado. Por favor, volte para a tela do período e tente novamente.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Filtrar apenas disciplinas com nome preenchido e normalizar
      const disciplineNames = data.disciplines
        .map((d) => d.name.trim())
        .filter((name) => name.length > 0)
        .map((name) => name.toLowerCase());

      if (disciplineNames.length === 0) {
        Alert.alert('Atenção', 'Por favor, preencha pelo menos uma disciplina.');
        setIsLoading(false);
        return;
      }

      // Verificar duplicatas com disciplinas já existentes
      const existingNames = loadedDisciplines.map((d) => d.name.toLowerCase());
      const duplicates = disciplineNames.filter((name) => existingNames.includes(name));
      
      if (duplicates.length > 0) {
        Alert.alert(
          'Disciplinas já existentes',
          `As seguintes disciplinas já estão cadastradas:\n${duplicates.map((d) => `• ${d}`).join('\n')}\n\nPor favor, remova as duplicatas ou use nomes diferentes.`
        );
        setIsLoading(false);
        return;
      }

      // Verificar duplicatas dentro da própria lista de novas disciplinas
      const uniqueNames = Array.from(new Set(disciplineNames));
      if (uniqueNames.length !== disciplineNames.length) {
        Alert.alert(
          'Disciplinas duplicadas',
          'Você inseriu disciplinas com o mesmo nome. Por favor, remova as duplicatas.'
        );
        setIsLoading(false);
        return;
      }

      // Converter de volta para o formato original (com primeira letra maiúscula)
      const formattedNames = disciplineNames.map((name) => 
        name.charAt(0).toUpperCase() + name.slice(1)
      );

      // Criar disciplinas no backend usando batch create
      const createdDisciplines = await disciplinesApi.batchCreate({
        periodTemplateId: effectivePeriodTemplateId,
        names: formattedNames,
      });

      Alert.alert('Sucesso', `${createdDisciplines.length} disciplina(s) criada(s) com sucesso!`);

      // Recarregar todas as disciplinas do backend para garantir consistência
      const allDisciplinesFromBackend = await disciplinesApi.getByPeriod(effectivePeriodTemplateId);

      // Voltar para a tela PeriodInfo passando as disciplinas atualizadas
      (navigation as any).navigate('PeriodInfo', {
        periodNumber,
        createdCourse,
        periodTemplateId: effectivePeriodTemplateId,
        updatedDisciplines: allDisciplinesFromBackend,
      });
    } catch (error: any) {
      console.error('❌ Erro ao salvar disciplinas:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Erro ao salvar disciplinas. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue('disciplineCount', '2');
    setValue('disciplines', [{ name: '' }, { name: '' }]);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Disciplinas</Text>
      </View>

      {/* Mostrar disciplinas existentes */}
      {isLoadingDisciplines ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.blueLight} />
          <Text style={styles.loadingText}>Carregando disciplinas existentes...</Text>
        </View>
      ) : loadedDisciplines.length > 0 && (
        <View style={styles.existingDisciplinesContainer}>
          <Text style={styles.existingTitle}>Disciplinas já cadastradas ({loadedDisciplines.length})</Text>
          <View style={styles.existingList}>
            {loadedDisciplines.map((discipline, index) => (
              <View key={discipline.id} style={styles.existingItem}>
                <Text style={styles.existingItemText}>{index + 1}. {discipline.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Quantas disciplinas deseja criar?</Text>
        
        <Controller
          control={control}
          name="disciplineCount"
          rules={{ required: 'Quantidade é obrigatória' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.countContainer}>
              <TouchableOpacity
                style={styles.countButton}
                onPress={() => {
                  const newVal = Math.max(1, parseInt(value || '1') - 1).toString();
                  onChange(newVal);
                  updateDisciplineCount(newVal);
                }}
              >
                <Text style={styles.countButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.countDisplay}>
                <Text style={styles.countText}>{value || '2'}</Text>
              </View>
              <TouchableOpacity
                style={styles.countButton}
                onPress={() => {
                  const newVal = (parseInt(value || '1') + 1).toString();
                  onChange(newVal);
                  updateDisciplineCount(newVal);
                }}
              >
                <Text style={styles.countButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {disciplineFields.map((_, index) => (
          <Controller
            key={index}
            control={control}
            name={`disciplines.${index}.name`}
            rules={{ required: false }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputText
                label={index === 0 ? 'Nome da disciplina' : `Nome da disciplina ${index + 1}`}
                containerStyle={styles.inputContainer}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.disciplines?.[index]?.name?.message}
                variant="light"
              />
            )}
          />
        ))}

        <View style={styles.formButtons}>
          <Button
            title="Cancelar"
            onPress={handleCancel}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button
            title={isLoading ? "Salvando..." : "Salvar"}
            onPress={handleSubmit(onSubmit, (errors) => {
              console.log('❌ Erros de validação:', errors);
              Alert.alert('Erro de validação', 'Por favor, verifique os campos preenchidos.');
            })}
            variant="primary"
            style={styles.saveButton}
            disabled={isLoading}
          />
        </View>
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backArrow: {
    fontSize: 24,
    color: theme.colors.black,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.black,
  },
  formContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.blueLight,
    fontWeight: '700',
  },
  countDisplay: {
    width: 60,
    height: 40,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  countText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.black,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
  },
  existingDisciplinesContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  existingTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  existingList: {
    marginTop: theme.spacing.xs,
  },
  existingItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  existingItemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
  },
});

