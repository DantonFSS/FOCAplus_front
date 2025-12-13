import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { InputText } from '../components/InputText';
import { SelectDropdown } from '../components/SelectDropdown';
import { theme } from '../theme';
import { BlurView } from 'expo-blur';
import { disciplineInstancesApi, DisciplineInstanceResponse, disciplinesApi } from '../api/disciplines';
import { disciplineSchedulesApi, DisciplineScheduleResponse } from '../api/disciplineSchedules';
import { disciplineTeachersApi, DisciplineTeacherResponse } from '../api/disciplineTeachers';
import { assessmentsApi, AssessmentResponse } from '../api/assessments';
import { scoresApi } from '../api/scores';
import { Alert } from 'react-native';

interface Schedule {
  id: string;
  day: string;
  time: string;
}

export const DisciplineInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { disciplineId } = route.params as { disciplineId: string };
  const [discipline, setDiscipline] = useState<DisciplineInstanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [evaluationCount, setEvaluationCount] = useState(2);
  const [schedules, setSchedules] = useState<DisciplineScheduleResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [teachers, setTeachers] = useState<DisciplineTeacherResponse[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [teacherInput, setTeacherInput] = useState('');
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleWeekday, setNewScheduleWeekday] = useState<number>(1);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const formatTimeInput = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  const formatSchedule = (schedule: DisciplineScheduleResponse): string => {
    const day = weekdayNames[schedule.weekday] || `Dia ${schedule.weekday}`;
    const startTime = schedule.startTime.substring(0, 5);
    const endTime = schedule.endTime.substring(0, 5);
    return `${day} - ${startTime} às ${endTime}`;
  };

  useEffect(() => {
    const loadDiscipline = async () => {
      if (!disciplineId) return;

      setIsLoading(true);
      try {
        const disciplineData = await disciplineInstancesApi.getById(disciplineId);
        setDiscipline(disciplineData);
        if (disciplineData.assessmentsCount) {
          setEvaluationCount(disciplineData.assessmentsCount);
        }
        
        await loadScore(disciplineData.id);
        await loadSchedules(disciplineData.id);
        await loadTeachers(disciplineData.id);
        await loadAssessments(disciplineData.id);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a disciplina.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDiscipline();
  }, [disciplineId]);

  useFocusEffect(
    React.useCallback(() => {
      if (disciplineId) {
        loadScore(disciplineId);
      }
    }, [disciplineId])
  );

  const loadScore = async (instanceId: string) => {
    setIsLoadingScore(true);
    try {
      const scores = await scoresApi.getByDiscipline(instanceId);
      const total = scores.reduce((sum, record) => sum + record.points, 0);
      setTotalScore(total);
    } catch (error) {
    } finally {
      setIsLoadingScore(false);
    }
  };

  const loadSchedules = async (instanceId: string) => {
    setIsLoadingSchedules(true);
    try {
      const loadedSchedules = await disciplineSchedulesApi.getByDiscipline(instanceId);
      setSchedules(loadedSchedules);
    } catch (error) {
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const loadAssessments = async (instanceId: string) => {
    setIsLoadingAssessments(true);
    try {
      const loaded = await assessmentsApi.getByDiscipline(instanceId);
      setAssessments(loaded);
    } catch (error) {
    } finally {
      setIsLoadingAssessments(false);
    }
  };
  const handleRemoveSchedule = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setShowDeleteScheduleModal(true);
  };

  const handleConfirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setIsDeletingSchedule(true);
    try {
      await disciplineSchedulesApi.delete(scheduleToDelete);
      setSchedules(schedules.filter(s => s.id !== scheduleToDelete));
      setShowDeleteScheduleModal(false);
      setScheduleToDelete(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o horário.');
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    if (!discipline.userCourseId) {
      Alert.alert('Aviso', 'Esta disciplina ainda não foi instanciada. Crie uma instância primeiro.');
      return;
    }

    setShowAddScheduleModal(true);
  };

  const handleConfirmAddSchedule = async () => {
    if (!discipline?.id) return;

    setIsAddingSchedule(true);
    try {
      const newSchedule = await disciplineSchedulesApi.create({
        disciplineInstanceId: discipline.id,
        weekday: newScheduleWeekday,
        startTime: newScheduleStartTime,
        endTime: newScheduleEndTime,
      });
      setSchedules([...schedules, newSchedule]);
      setShowAddScheduleModal(false);
      setNewScheduleWeekday(1);
      setNewScheduleStartTime('');
      setNewScheduleEndTime('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o horário.');
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const loadTeachers = async (instanceId: string) => {
    setIsLoadingTeachers(true);
    try {
      const loadedTeachers = await disciplineTeachersApi.getByDiscipline(instanceId);
      setTeachers(loadedTeachers);
    } catch (error) {
    } finally {
      setIsLoadingTeachers(false);
    }
  };
  const handleAddTeacher = async () => {
    if (!teacherInput.trim()) {
      return;
    }

    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    if (!discipline.userCourseId) {
      Alert.alert('Aviso', 'Esta disciplina ainda não foi instanciada. Crie uma instância primeiro.');
      return;
    }

    try {
      const newTeacher = await disciplineTeachersApi.create({
        disciplineInstanceId: discipline.id,
        teacherName: teacherInput.trim(),
      });
      setTeachers([...teachers, newTeacher]);
      setTeacherInput('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o docente.');
    }
  };
  const handleRemoveTeacher = (teacherId: string) => {
    setTeacherToDelete(teacherId);
    setShowDeleteTeacherModal(true);
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    setIsDeletingTeacher(true);
    try {
      await disciplineTeachersApi.delete(teacherToDelete);
      setTeachers(teachers.filter(t => t.id !== teacherToDelete));
      setShowDeleteTeacherModal(false);
      setTeacherToDelete(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o docente.');
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    if (!discipline.userCourseId) {
      Alert.alert('Aviso', 'Esta disciplina ainda não foi instanciada. Crie uma instância primeiro.');
      return;
    }

    try {
      const newAssessment = await assessmentsApi.create({
        disciplineInstanceId: discipline.id,
        title: `Avaliação ${assessments.length + 1}`,
      });
      setAssessments([...assessments, newAssessment]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a avaliação.');
    }
  };

  const handleStartEditName = () => {
    if (discipline?.name) {
      setEditedName(discipline.name);
      setIsEditingName(true);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };
  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Erro', 'O nome da disciplina não pode estar vazio.');
      return;
    }

    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    setIsSavingName(true);
    try {
      const updated = await disciplineInstancesApi.update(discipline.id, {
        name: editedName.trim(),
      });
      
      setDiscipline(prev => prev ? { ...prev, name: updated.name } : null);
      setIsEditingName(false);
      setEditedName('');
      Alert.alert('Sucesso', 'Nome da disciplina atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome da disciplina.');
    } finally {
      setIsSavingName(false);
    }
  };

  const displayName = discipline?.name ?? 'Carregando...';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.blueLight} />
        <Text style={styles.loadingText}>Carregando disciplina...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{discipline?.name || 'Disciplina'}</Text>
      </View>

      <View style={styles.disciplineHeader}>
        <Text style={styles.disciplineIcon}></Text>
        {isEditingName ? (
          <View style={styles.nameEditContainer}>
            <InputText
              label=""
              containerStyle={styles.nameInputContainer}
              variant="light"
              value={editedName}
              onChangeText={setEditedName}
              autoFocus
            />
            <View style={styles.nameEditButtons}>
              <TouchableOpacity
                style={styles.nameEditButton}
                onPress={handleCancelEditName}
                disabled={isSavingName}
              >
                <Text style={styles.nameEditButtonText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nameEditButton, styles.nameSaveButton, isSavingName && styles.nameEditButtonDisabled]}
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.nameEditButtonText}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.disciplineName}>{displayName}</Text>
            <TouchableOpacity
              style={styles.editNameButton}
              onPress={handleStartEditName}
            >
              <Image source={require('../../assets/pencil_icon.png')} style={styles.editNameIcon} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Pontuação total: {totalScore}XP</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Image source={require('../../assets/empty_calendar_icon.png')} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Horários e dias</Text>
          </View>
          {isLoadingSchedules ? (
            <ActivityIndicator size="small" color={theme.colors.blueLight} />
          ) : schedules.length > 0 ? (
            schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleText}>{formatSchedule(schedule)}</Text>
                  <TouchableOpacity
                    style={styles.removeScheduleButton}
                    onPress={() => handleRemoveSchedule(schedule.id)}
                  >
                    <Text style={styles.removeScheduleText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : null}
          <Button
            title="+ Adicionar horário"
            onPress={handleAddSchedule}
            variant="secondary"
            style={styles.addButton}
          />
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Image source={require('../../assets/docente_user_icon.png')} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Docente(s)</Text>
          </View>
          {isLoadingTeachers ? (
            <ActivityIndicator size="small" color={theme.colors.blueLight} />
          ) : teachers.length > 0 ? (
            <View style={styles.teachersList}>
              {teachers.map((teacher) => (
                <View key={teacher.id} style={styles.teacherItem}>
                  <Text style={styles.teacherText}>{teacher.teacherName}</Text>
                  <TouchableOpacity
                    style={styles.removeTeacherButton}
                    onPress={() => handleRemoveTeacher(teacher.id)}
                  >
                    <Text style={styles.removeTeacherText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.teacherInputRow}>
            <InputText
              label="Adicionar docente..."
              containerStyle={[styles.inputContainer, { flex: 1 }]}
              variant="light"
              value={teacherInput}
              onChangeText={setTeacherInput}
              onSubmitEditing={handleAddTeacher}
            />
            <TouchableOpacity
              style={[styles.addTeacherButton, !teacherInput.trim() && styles.addTeacherButtonDisabled]}
              onPress={handleAddTeacher}
              disabled={!teacherInput.trim()}
            >
              <Text style={styles.addTeacherButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Image source={require('../../assets/sheet_icon.png')} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Avaliações</Text>
            <View style={styles.evaluationControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleCreateAssessment}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {isLoadingAssessments ? (
            <ActivityIndicator size="small" color={theme.colors.blueLight} />
          ) : assessments.length > 0 ? (
            <View style={styles.evaluationButtons}>
              {assessments.map((assessment, index) => (
                <TouchableOpacity
                  key={assessment.id}
                  style={styles.evaluationButton}
                  onPress={() => {
                    (navigation as any).navigate('EvaluationInfo', {
                      evaluationId: assessment.id,
                      evaluationName: assessment.title || `Avaliação ${index + 1}`,
                      disciplineName: displayName,
                      disciplineId: disciplineId,
                    });
                  }}
                >
                  <Text style={styles.evaluationButtonText}>
                    {assessment.title || `Avaliação ${index + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Tarefas de casa"
          onPress={() => (navigation as any).navigate('Tasks', { disciplineId })}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="Ranking"
          onPress={() => {}}
          variant="primary"
          style={styles.actionButton}
        />
      </View>

      <TouchableOpacity
        style={styles.startStudyButton}
        onPress={() => {
          (navigation as any).navigate('Estudando', {
            disciplineName: displayName,
            disciplineId: disciplineId,
          });
        }}
        activeOpacity={0.8}
      >
        <Image source={require('../../assets/foca2.png')} style={styles.startStudyIcon} />
        <Text style={styles.startStudyText}>Iniciar estudo</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddScheduleModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Horário</Text>
              
              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Dia da semana</Text>
                <SelectDropdown
                  options={weekdayNames.map((name, index) => ({ 
                    label: name, 
                    value: index.toString() 
                  }))}
                  value={newScheduleWeekday.toString()}
                  onChange={(value: string) => setNewScheduleWeekday(parseInt(value))}
                  placeholder="Selecione o dia"
                />
              </View>

              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Horário de início</Text>
                <InputText
                  value={newScheduleStartTime}
                  onChangeText={(text) => setNewScheduleStartTime(formatTimeInput(text))}
                  placeholder=""
                  variant="light"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Horário de término</Text>
                <InputText
                  value={newScheduleEndTime}
                  onChangeText={(text) => setNewScheduleEndTime(formatTimeInput(text))}
                  placeholder=""
                  variant="light"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setShowAddScheduleModal(false);
                    setNewScheduleWeekday(1);
                    setNewScheduleStartTime('');
                    setNewScheduleEndTime('');
                  }}
                  style={styles.modalButton}
                />
                <Button
                  title={isAddingSchedule ? 'Adicionando...' : 'Adicionar'}
                  variant="primary"
                  onPress={handleConfirmAddSchedule}
                  disabled={isAddingSchedule}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        visible={showDeleteScheduleModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Remover Horário</Text>
              <Text style={styles.modalBody}>
                Tem certeza que deseja remover este horário?
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setShowDeleteScheduleModal(false);
                    setScheduleToDelete(null);
                  }}
                  style={styles.modalButton}
                />
                <View style={styles.modalButton}>
                  <TouchableOpacity
                    style={[
                      styles.modalDeleteButton,
                      isDeletingSchedule && styles.modalDeleteButtonDisabled,
                    ]}
                    onPress={handleConfirmDeleteSchedule}
                    disabled={isDeletingSchedule}
                  >
                    <Text style={styles.modalDeleteButtonText}>
                      {isDeletingSchedule ? 'Removendo...' : 'Sim,\nremover'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        visible={showDeleteTeacherModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Remover Docente</Text>
              <Text style={styles.modalBody}>
                Tem certeza que deseja remover este docente?
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setShowDeleteTeacherModal(false);
                    setTeacherToDelete(null);
                  }}
                  style={styles.modalButton}
                />
                <View style={styles.modalButton}>
                  <TouchableOpacity
                    style={[
                      styles.modalDeleteButton,
                      isDeletingTeacher && styles.modalDeleteButtonDisabled,
                    ]}
                    onPress={handleConfirmDeleteTeacher}
                    disabled={isDeletingTeacher}
                  >
                    <Text style={styles.modalDeleteButtonText}>
                      {isDeletingTeacher ? 'Removendo...' : 'Sim,\nremover'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
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
  disciplineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  disciplineIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  disciplineName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.black,
    flex: 1,
  },
  editNameButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  editNameIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  nameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  nameInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  nameEditButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  nameEditButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSaveButton: {
    backgroundColor: theme.colors.blueLight,
  },
  nameEditButtonDisabled: {
    opacity: 0.6,
  },
  nameEditButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  scoreContainer: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.round,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  scoreText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
  detailsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    flex: 1,
  },
  scheduleItem: {
    marginBottom: theme.spacing.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  scheduleText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    flex: 1,
  },
  removeScheduleButton: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.redBad,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  removeScheduleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.white,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    marginBottom: 0,
  },
  teachersList: {
    marginBottom: theme.spacing.sm,
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  teacherText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    flex: 1,
  },
  removeTeacherButton: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.redBad,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  removeTeacherText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.white,
  },
  teacherInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  addTeacherButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  addTeacherButtonDisabled: {
    backgroundColor: theme.colors.grayLight,
    opacity: 0.5,
  },
  addTeacherButtonText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.white,
  },
  evaluationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: theme.colors.grayLight,
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  controlButtonTextDisabled: {
    color: theme.colors.gray,
  },
  evaluationCount: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    minWidth: 24,
    textAlign: 'center',
  },
  evaluationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  evaluationButton: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  evaluationButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  startStudyButton: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.round,
    width: 120,
    height: 120,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  startStudyIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: theme.spacing.xs,
  },
  startStudyText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.white,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 16, 32, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg * 1.5,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalFormSection: {
    marginBottom: theme.spacing.md,
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.grayDark,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  modalBody: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalDeleteButton: {
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
  modalDeleteButtonDisabled: {
    opacity: 0.6,
  },
  modalDeleteButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
});