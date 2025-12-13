import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../components/Button';
import { InputText } from '../components/InputText';
import { theme } from '../theme';
import { disciplinesApi, DisciplineTemplateResponse } from '../api/disciplines';

export const PeriodDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const periodNumber = (route.params as any)?.periodNumber || 1;
  const createdCourse = (route.params as any)?.createdCourse;
  const periodTemplateId = (route.params as any)?.periodTemplateId;
  const [disciplines, setDisciplines] = useState<DisciplineTemplateResponse[]>([]);
  const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<DisciplineTemplateResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: '',
    },
  });

  const loadDisciplines = async () => {
    if (!periodTemplateId) return;

    setIsLoadingDisciplines(true);
    try {
      const loadedDisciplines = await disciplinesApi.getByPeriod(periodTemplateId);
      setDisciplines(loadedDisciplines);
    } catch (error) {
    } finally {
      setIsLoadingDisciplines(false);
    }
  };

  useEffect(() => {
    loadDisciplines();
  }, [periodTemplateId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const updatedDisciplines = (route.params as any)?.updatedDisciplines;
      if (updatedDisciplines) {
        if (updatedDisciplines.length > 0 && typeof updatedDisciplines[0].id === 'number') {
          loadDisciplines();
        } else {
          setDisciplines(updatedDisciplines);
        }
        (route.params as any).updatedDisciplines = undefined;
      } else {
        loadDisciplines();
      }
    });

    return unsubscribe;
  }, [navigation, route, periodTemplateId]);

  const handleAddDisciplines = () => {
    (navigation as any).navigate('AddDisciplines', {
      existingDisciplines: disciplines,
      periodNumber,
      createdCourse,
      periodTemplateId: (route.params as any)?.periodTemplateId,
    });
  };

  const handleViewPeriodInfo = () => {
    (navigation as any).navigate('PeriodInfo', {
      periodNumber,
      periodTemplateId,
      createdCourse,
      startDate: '',
      endDate: '',
      disciplines: disciplines.map((d, index) => ({ id: index + 1, name: d.name })),
    });
  };

  const handleEditDiscipline = (discipline: DisciplineTemplateResponse) => {
    setEditingDiscipline(discipline);
    setValue('name', discipline.name);
    setIsEditing(true);
  };

  const handleDeleteDiscipline = (discipline: DisciplineTemplateResponse) => {
    Alert.alert(
      'Excluir disciplina',
      `Tem certeza que deseja excluir a disciplina "${discipline.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await disciplinesApi.delete(discipline.id);
              Alert.alert('Sucesso', 'Disciplina excluída com sucesso!');
              await loadDisciplines();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a disciplina. Tente novamente.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const onEditSubmit = async (data: { name: string }) => {
    if (!editingDiscipline) return;

    setIsEditing(false);
    try {
      await disciplinesApi.update(editingDiscipline.id, { name: data.name.trim() });
      Alert.alert('Sucesso', 'Disciplina atualizada com sucesso!');
      await loadDisciplines();
      setEditingDiscipline(null);
      reset();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a disciplina. Tente novamente.');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDiscipline(null);
    reset();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Período {periodNumber}</Text>
      </View>

      {isLoadingDisciplines ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.blueLight} />
          <Text style={styles.loadingText}>Carregando disciplinas...</Text>
        </View>
      ) : disciplines.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Nenhuma disciplina cadastrada ainda</Text>
          <Button
            title="+ Adicionar disciplinas"
            onPress={handleAddDisciplines}
            variant="primary"
            style={styles.addButton}
          />
        </View>
      ) : (
        <View style={styles.disciplinesContainer}>
          {disciplines.map((discipline, index) => (
            <TouchableOpacity
              key={discipline.id}
              style={styles.disciplineCard}
              onPress={() => {
                (navigation as any).navigate('DisciplineInfo', {
                  disciplineId: discipline.id,
                  disciplineName: discipline.name,
                  periodTemplateId,
                });
              }}
            >
              <View style={styles.disciplineCardLeft}>
                <View style={styles.disciplineNumberCircle}>
                  <Text style={styles.disciplineNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.disciplineName}>{discipline.name}</Text>
              </View>
              <View style={styles.disciplineActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditDiscipline(discipline);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteDiscipline(discipline);
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title="Ver informações do período"
          onPress={handleViewPeriodInfo}
          variant="secondary"
          style={styles.infoButton}
        />
        {disciplines.length > 0 && (
          <Button
            title="+ Adicionar disciplinas"
            onPress={handleAddDisciplines}
            variant="primary"
            style={styles.addButtonBottom}
          />
        )}
        <TouchableOpacity
          style={styles.nextButtonContainer}
          onPress={() => {
            (navigation as any).navigate('CourseInfo', { 
              createdCourse,
              periodNumber,
              disciplines,
            });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Próximo</Text>
          <Text style={styles.nextButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isEditing}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Disciplina</Text>
            
            <Controller
              control={control}
              name="name"
              rules={{ required: 'Nome da disciplina é obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputText
                  label="Nome da disciplina"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  variant="light"
                  containerStyle={styles.modalInput}
                />
              )}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={handleCancelEdit}
                variant="secondary"
                style={styles.modalCancelButton}
              />
              <Button
                title="Salvar"
                onPress={handleSubmit(onEditSubmit)}
                variant="primary"
                style={styles.modalSaveButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xl,
  },
  addButton: {
    marginTop: theme.spacing.md,
  },
  disciplinesContainer: {
    marginBottom: theme.spacing.lg,
  },
  disciplineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  disciplineCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  disciplineActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  disciplineNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  disciplineNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  disciplineName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    flex: 1,
  },
  actionsContainer: {
    marginTop: theme.spacing.lg,
  },
  infoButton: {
    marginBottom: theme.spacing.md,
  },
  addButtonBottom: {
    marginBottom: theme.spacing.md,
  },
  nextButtonContainer: {
    backgroundColor: theme.colors.greenGood,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.greenGood,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 2,
    borderColor: theme.colors.greenGood,
  },
  nextButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  nextButtonArrow: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 1,
  },
});

