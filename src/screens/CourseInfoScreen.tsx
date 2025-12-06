import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { CourseResponse, coursesApi } from '../api/courses';
import { periodsApi, PeriodTemplateResponse } from '../api/periods';

interface CourseInfoFormData {
  address: string;
  contact: string;
  online: boolean;
  startDate: string;
  endDate: string;
}

// Converter data ISO para formato brasileiro
const convertISOToDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Converter data brasileira (dd/mm/aaaa) para ISO
const convertDateToISO = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr === 'dd/mm/aaaa') return undefined;
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) return undefined;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString().split('T')[0];
};

export const CourseInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as any;
  const createdCourse = routeParams?.createdCourse as CourseResponse | undefined;
  const courseId = routeParams?.courseId as string | undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<CourseResponse | undefined>(createdCourse);
  const [periodTemplates, setPeriodTemplates] = useState<PeriodTemplateResponse[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  // Buscar curso do banco se receber apenas o ID
  useEffect(() => {
    const fetchCourse = async () => {
      // Se já temos o curso completo, não precisa buscar
      if (createdCourse) {
        setCurrentCourse(createdCourse);
        return;
      }

      // Se temos apenas o ID, buscar do banco
      if (courseId && !createdCourse) {
        setIsLoadingCourse(true);
        try {
          const course = await coursesApi.getById(courseId);
          setCurrentCourse(course);
        } catch (error: any) {
          console.error('❌ Erro ao buscar curso:', error);
          Alert.alert(
            'Erro',
            'Não foi possível carregar as informações do curso. Tente novamente.'
          );
        } finally {
          setIsLoadingCourse(false);
        }
      }
    };

    fetchCourse();
  }, [courseId, createdCourse]);

  // Função para carregar períodos
  const loadPeriods = React.useCallback(async () => {
    if (!currentCourse?.id) {
      setPeriodTemplates([]);
      return;
    }

    setIsLoadingPeriods(true);
    try {
      const templates = await periodsApi.getTemplatesByCourse(currentCourse.id);
      // Remover duplicatas por ID e por periodNumber
      const uniqueTemplates = templates
        .filter((template, index, self) => 
          index === self.findIndex(t => t.id === template.id)
        )
        .filter((template, index, self) => 
          index === self.findIndex(t => t.periodNumber === template.periodNumber)
        )
        .sort((a, b) => a.periodNumber - b.periodNumber);
      setPeriodTemplates(uniqueTemplates);
      console.log('✅ Períodos carregados:', uniqueTemplates.length, uniqueTemplates.map(t => `P${t.periodNumber}`));
    } catch (error) {
      console.error('❌ Erro ao carregar períodos:', error);
      setPeriodTemplates([]);
    } finally {
      setIsLoadingPeriods(false);
    }
  }, [currentCourse?.id]);

  // Carregar períodos quando o curso mudar
  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  // Recarregar períodos quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadPeriods();
    }, [loadPeriods])
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseInfoFormData>({
    defaultValues: {
      address: currentCourse?.address || '',
      contact: currentCourse?.phones?.[0] || currentCourse?.emails?.[0] || '',
      online: currentCourse?.online || false,
      startDate: currentCourse?.startDate ? convertISOToDate(currentCourse.startDate) : '',
      endDate: currentCourse?.endDate ? convertISOToDate(currentCourse.endDate) : '',
    },
  });

  // Atualizar valores do formulário quando o curso for carregado
  useEffect(() => {
    if (currentCourse) {
      reset({
        address: currentCourse.address || '',
        contact: currentCourse.phones?.[0] || currentCourse.emails?.[0] || '',
        online: currentCourse.online || false,
        startDate: currentCourse.startDate ? convertISOToDate(currentCourse.startDate) : '',
        endDate: currentCourse.endDate ? convertISOToDate(currentCourse.endDate) : '',
      });
    }
  }, [currentCourse, reset]);

  const getLevelLabel = (level?: string): string => {
    const mapping: { [key: string]: string } = {
      'UNDERGRADUATE': 'Superior',
      'HIGH_SCHOOL': 'Ensino Médio',
      'MASTER': 'Mestrado',
      'DOCTORATE': 'Doutorado',
      'FREE_COURSE': 'Curso Livre',
      'PROFESSIONAL': 'Profissional',
      'TECHNICAL': 'Técnico',
    };
    return mapping[level || ''] || 'Superior';
  };

  const onSubmit = async (data: CourseInfoFormData) => {
    if (!currentCourse?.id) {
      Alert.alert('Erro', 'ID do curso não encontrado');
      return;
    }

    setIsLoading(true);
    try {
      // Converter datas para ISO
      const startDateISO = convertDateToISO(data.startDate);
      const endDateISO = convertDateToISO(data.endDate);

      // Preparar dados para atualização
      const updateData = {
        address: data.address || undefined,
        online: data.online,
        startDate: startDateISO,
        endDate: endDateISO,
        // Se houver contato, pode ser telefone ou email
        // Por enquanto, vamos tratar como telefone se começar com número
        phones: data.contact && /^\d/.test(data.contact) ? [data.contact] : undefined,
        emails: data.contact && data.contact.includes('@') ? [data.contact] : undefined,
      };

      const updatedCourse = await coursesApi.updateInfo(currentCourse.id, updateData);
      setCurrentCourse(updatedCourse);
      setIsEditing(false);
      
      Alert.alert('Sucesso', 'Informações do curso atualizadas com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      Alert.alert(
        'Erro',
        error?.response?.data?.message || 'Erro ao atualizar informações do curso. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  // Criar períodos baseados no divisionsCount do curso
  // Se houver períodos no backend, usar os IDs reais, senão criar períodos temporários
  const divisionsCount = currentCourse?.divisionsCount || 0;
  
  // Garantir que não haja duplicatas - usar apenas periodNumber único
  const periodsMap = new Map<number, { number: number; id: string | null }>();
  
  // Primeiro, adicionar períodos do backend (se existirem)
  periodTemplates.forEach(template => {
    if (template.periodNumber <= divisionsCount) {
      periodsMap.set(template.periodNumber, {
        number: template.periodNumber,
        id: template.id,
      });
    }
  });
  
  // Depois, preencher os períodos faltantes baseados no divisionsCount
  for (let i = 1; i <= divisionsCount; i++) {
    if (!periodsMap.has(i)) {
      periodsMap.set(i, {
        number: i,
        id: null,
      });
    }
  }
  
  // Converter para array e ordenar por número
  const periods = Array.from(periodsMap.values()).sort((a, b) => a.number - b.number);

  if (isLoadingCourse) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Carregando informações do curso...</Text>
      </View>
    );
  }

  if (!currentCourse) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Curso não encontrado</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          variant="primary"
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Curso Info Editando' : 'Curso Info'}
        </Text>
      </View>

      {/* Course Overview */}
      <View style={styles.courseOverview}>
        <View style={styles.courseIcon}>
          <Text style={styles.courseIconText}>{'</>'}</Text>
        </View>
        <Text style={styles.courseName}>
          {currentCourse?.name || 'Nome do Curso'}
        </Text>
        <Text style={styles.institutionName}>
          {currentCourse?.institutionName || 'Instituição'}
        </Text>
        <Text style={styles.courseLevel}>
          {getLevelLabel(currentCourse?.level)}
        </Text>
      </View>

      {/* Information Card */}
      <View style={styles.infoCard}>
        {isEditing ? (
          <>
            <Text style={styles.editTitle}>Editar informações do curso</Text>
            
            <View style={styles.row}>
              <View style={styles.column}>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputText
                      label="Endereço"
                      containerStyle={[styles.inputContainer, { flex: 1 }]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="light"
                    />
                  )}
                />
              </View>
              <View style={styles.columnLast}>
                <Controller
                  control={control}
                  name="contact"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputText
                      label="Contato"
                      containerStyle={[styles.inputContainer, { flex: 1 }]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="light"
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>EAD/Online</Text>
              <Controller
                control={control}
                name="online"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: theme.colors.grayLight, true: theme.colors.blueLight }}
                    thumbColor={theme.colors.white}
                  />
                )}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.column}>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      label="Previsão de início"
                      placeholder="dd/mm/aaaa"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </View>
              <View style={styles.columnLast}>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      label="Previsão de término"
                      placeholder="dd/mm/aaaa"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.editButtons}>
              <Button
                title="Cancelar"
                onPress={handleCancel}
                variant="secondary"
                style={styles.cancelButton}
              />
              <Button
                title={isLoading ? "Salvando..." : "Salvar"}
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                style={styles.saveButton}
                disabled={isLoading}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Endereço</Text>
              <Text style={styles.infoValue}>
                {currentCourse?.address || 'Adicione um endereço...'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contato</Text>
              <Text style={styles.infoValue}>
                {currentCourse?.phones?.[0] || currentCourse?.emails?.[0] || 'Adicione um contato...'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EAD/Online</Text>
              <Switch
                value={currentCourse?.online || false}
                disabled
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.blueLight }}
                thumbColor={theme.colors.white}
              />
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previsão de início</Text>
              <Text style={styles.infoValue}>
                {currentCourse?.startDate ? convertISOToDate(currentCourse.startDate) : 'dd/mm/aaaa'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previsão de término</Text>
              <Text style={styles.infoValue}>
                {currentCourse?.endDate ? convertISOToDate(currentCourse.endDate) : 'dd/mm/aaaa'}
              </Text>
            </View>

            <Button
              title="Editar informações"
              onPress={() => setIsEditing(true)}
              variant="primary"
              style={styles.editButton}
            />
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonTouchable]}
              onPress={() => {
                Alert.alert(
                  'Excluir curso',
                  `Tem certeza que deseja excluir o curso "${currentCourse?.name}"? Esta ação não pode ser desfeita e todos os períodos e disciplinas associados serão excluídos.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: async () => {
                        if (!currentCourse?.id) return;
                        try {
                          await coursesApi.delete(currentCourse.id);
                          Alert.alert('Sucesso', 'Curso excluído com sucesso!');
                          // Navegar de volta para Home
                          (navigation as any).navigate('Home');
                        } catch (error) {
                          console.error('❌ Erro ao excluir curso:', error);
                          Alert.alert('Erro', 'Não foi possível excluir o curso. Tente novamente.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.deleteButtonText}>Excluir curso</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Periods Section */}
      <View style={styles.periodsSection}>
        <Text style={styles.periodsTitle}>Períodos</Text>
        <View style={styles.periodsGrid}>
          {isLoadingPeriods ? (
            <View style={styles.periodsLoadingContainer}>
              <Text style={styles.periodsLoadingText}>Carregando períodos...</Text>
            </View>
          ) : periods.length > 0 ? (
            periods.map((period, index) => {
              const periodTemplate = periodTemplates.find(t => t.id === period.id);
              return (
                <TouchableOpacity
                  key={`period-${period.number}-${index}`}
                  style={styles.periodButton}
                  onPress={() => {
                    // Navegar para informações do período (tela de edição)
                    (navigation as any).navigate('PeriodInfo', {
                      periodNumber: period.number,
                      periodTemplateId: period.id,
                      createdCourse: currentCourse,
                      startDate: periodTemplate?.startDate ? convertISOToDate(periodTemplate.startDate) : '',
                      endDate: periodTemplate?.endDate ? convertISOToDate(periodTemplate.endDate) : '',
                      disciplines: [],
                    });
                  }}
                >
                  <Text style={styles.periodButtonText}>Período {period.number}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.periodsEmptyContainer}>
              <Text style={styles.periodsEmptyText}>Nenhum período encontrado</Text>
            </View>
          )}
        </View>
      </View>

      {/* Finalize Button */}
      <Button
        title="Finalizar"
        onPress={() => {
          // Navegar para Home após finalizar
          (navigation as any).navigate('Home');
        }}
        variant="primary"
        style={styles.finalizeButton}
        disabled={isLoadingCourse}
      />
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
  courseOverview: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  courseIconText: {
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.white,
    fontWeight: '700',
  },
  courseName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  institutionName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  courseLevel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  editTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    flex: 1,
    textAlign: 'right',
    marginLeft: theme.spacing.md,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    width: '100%',
  },
  column: {
    flex: 1,
    minWidth: 0, // Permite que o flex shrink funcione corretamente
    maxWidth: '50%',
    overflow: 'hidden',
  },
  columnLast: {
    flex: 1,
    minWidth: 0, // Permite que o flex shrink funcione corretamente
    maxWidth: '50%',
    overflow: 'hidden',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 0,
  },
  editButtons: {
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
  editButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  deleteButton: {
    marginTop: theme.spacing.sm,
  },
  deleteButtonTouchable: {
    backgroundColor: theme.colors.redBad,
    borderColor: theme.colors.redBad,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    shadowColor: theme.colors.redBad,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
  periodsSection: {
    marginBottom: theme.spacing.xl,
  },
  periodsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  periodButton: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: '48%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: '600',
  },
  finalizeButton: {
    marginTop: theme.spacing.lg,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  periodsLoadingContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  periodsLoadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  periodsEmptyContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  periodsEmptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
});

