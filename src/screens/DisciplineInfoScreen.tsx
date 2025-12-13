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
import { tasksApi, TaskResponse } from '../api/tasks';
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
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Modal de adicionar horário
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleWeekday, setNewScheduleWeekday] = useState<number>(1);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  
  // Modal de confirmar deleção de horário
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  
  // Modal de confirmar deleção de docente
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  // Mapear weekday para nome do dia
  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Formatar horário automaticamente (adiciona os dois pontos)
  const formatTimeInput = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  // Formatar horário para exibição
  const formatSchedule = (schedule: DisciplineScheduleResponse): string => {
    const day = weekdayNames[schedule.weekday] || `Dia ${schedule.weekday}`;
    const startTime = schedule.startTime.substring(0, 5); // "HH:mm"
    const endTime = schedule.endTime.substring(0, 5); // "HH:mm"
    return `${day} - ${startTime} às ${endTime}`;
  };

  // Buscar dados da disciplina do backend
  // IMPORTANT: disciplineId is ALWAYS an instance ID (never template ID)
  // Backend auto-creates instances for OWNER when they create templates
  useEffect(() => {
    const loadDiscipline = async () => {
      if (!disciplineId) return;

      setIsLoading(true);
      try {
        // Always load discipline instance (OWNER and MEMBER both use instances)
        const disciplineData = await disciplineInstancesApi.getById(disciplineId);
        setDiscipline(disciplineData);
        if (disciplineData.assessmentsCount) {
          setEvaluationCount(disciplineData.assessmentsCount);
        }
        console.log('✅ Discipline instance carregada:', disciplineData.name);
        
        // Carregar horários, docentes, avaliações, tarefas e pontuação da disciplina
        // All these are linked to discipline INSTANCE
        await loadScore(disciplineData.id);
        await loadSchedules(disciplineData.id);
        await loadTeachers(disciplineData.id);
        await loadAssessments(disciplineData.id);
        await loadTasks(disciplineData.id);
      } catch (error) {
        console.error('❌ Erro ao carregar disciplina instance:', error);
        Alert.alert('Erro', 'Não foi possível carregar a disciplina.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDiscipline();
  }, [disciplineId]);

  // Recarregar pontuação quando a tela receber foco (quando voltar de outras telas)
  useFocusEffect(
    React.useCallback(() => {
      if (disciplineId) {
        console.log('🔄 Recarregando pontuação (useFocusEffect)...');
        loadScore(disciplineId);
      }
    }, [disciplineId])
  );

  // Carregar pontuação do backend
  const loadScore = async (instanceId: string) => {
    setIsLoadingScore(true);
    try {
      console.log('📊 Carregando pontuação para disciplina:', instanceId);
      const scores = await scoresApi.getByDiscipline(instanceId);
      console.log('📋 Scores recebidos:', scores);
      const total = scores.reduce((sum, record) => sum + record.points, 0);
      console.log('💰 Total calculado:', total);
      setTotalScore(total);
      console.log('✅ Pontuação atualizada no estado:', total);
    } catch (error) {
      console.error('❌ Erro ao carregar pontuação:', error);
    } finally {
      setIsLoadingScore(false);
    }
  };

  // Carregar horários do backend
  const loadSchedules = async (instanceId: string) => {
    setIsLoadingSchedules(true);
    try {
      const loadedSchedules = await disciplineSchedulesApi.getByDiscipline(instanceId);
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Carregar avaliações do backend
  const loadAssessments = async (instanceId: string) => {
    setIsLoadingAssessments(true);
    try {
      const loaded = await assessmentsApi.getByDiscipline(instanceId);
      setAssessments(loaded);
    } catch (error) {
      console.error('❌ Erro ao carregar avaliações:', error);
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  // Remover horário
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
      console.error('❌ Erro ao remover horário:', error);
      Alert.alert('Erro', 'Não foi possível remover o horário.');
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  // Adicionar horário (simplificado - apenas segunda-feira 14h-16h como exemplo)
  const handleAddSchedule = async () => {
    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    // Verificar se é uma instância real (tem userCourseId)
    if (!discipline.userCourseId) {
      Alert.alert('Aviso', 'Esta disciplina ainda não foi instanciada. Crie uma instância primeiro.');
      return;
    }

    // Abrir modal
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
      // Resetar valores
      setNewScheduleWeekday(1);
      setNewScheduleStartTime('');
      setNewScheduleEndTime('');
    } catch (error) {
      console.error('❌ Erro ao adicionar horário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o horário.');
    } finally {
      setIsAddingSchedule(false);
    }
  };

  // Carregar docentes do backend
  const loadTeachers = async (instanceId: string) => {
    setIsLoadingTeachers(true);
    try {
      const loadedTeachers = await disciplineTeachersApi.getByDiscipline(instanceId);
      setTeachers(loadedTeachers);
    } catch (error) {
      console.error('❌ Erro ao carregar docentes:', error);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // Adicionar docente
  const handleAddTeacher = async () => {
    if (!teacherInput.trim()) {
      return;
    }

    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    // Verificar se é uma instância real (tem userCourseId)
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
      console.error('❌ Erro ao adicionar docente:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o docente.');
    }
  };

  // Remover docente
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
      console.error('❌ Erro ao remover docente:', error);
      Alert.alert('Erro', 'Não foi possível remover o docente.');
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  // Criar avaliação simples (título + descrição opcional)
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
      console.error('❌ Erro ao criar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível criar a avaliação.');
    }
  };

  // Carregar tarefas do backend
  const loadTasks = async (instanceId: string) => {
    setIsLoadingTasks(true);
    try {
      const loaded = await tasksApi.getByDiscipline(instanceId);
      setTasks(loaded);
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Criar tarefa simples
  const handleCreateTask = async () => {
    if (!discipline?.id) {
      Alert.alert('Erro', 'Disciplina não encontrada.');
      return;
    }

    if (!discipline.userCourseId) {
      Alert.alert('Aviso', 'Esta disciplina ainda não foi instanciada. Crie uma instância primeiro.');
      return;
    }

    try {
      const newTask = await tasksApi.create({
        disciplineInstanceId: discipline.id,
        title: `Tarefa ${tasks.length + 1}`,
      });
      setTasks([...tasks, newTask]);
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível criar a tarefa.');
    }
  };

  // Alternar concluído
  const handleToggleTaskComplete = async (task: TaskResponse) => {
    try {
      const updated = await tasksApi.toggleComplete(task.id, !task.completed);
      const updatedTask = updated.task;
      setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    } catch (error) {
      console.error('❌ Erro ao atualizar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.');
    }
  };

  // Iniciar edição do nome
  const handleStartEditName = () => {
    if (discipline?.name) {
      setEditedName(discipline.name);
      setIsEditingName(true);
    }
  };

  // Cancelar edição do nome
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Salvar novo nome
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
      const updated = await disciplinesApi.update(discipline.id, {
        name: editedName.trim(),
      });
      
      // Atualizar estado local
      setDiscipline(prev => prev ? { ...prev, name: updated.name } : null);
      setIsEditingName(false);
      setEditedName('');
      Alert.alert('Sucesso', 'Nome da disciplina atualizado!');
    } catch (error) {
      console.error('❌ Erro ao atualizar nome:', error);
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

      {/* Discipline Title */}
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
                style={[styles.nameEditButton, styles.nameSaveButton]}
                onPress={handleSaveName}
                disabled={isSavingName}
              >
                <Text style={styles.nameEditButtonText}>✓</Text>
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

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Pontuação total: {totalScore}XP</Text>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        {/* Horários e dias */}
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

        {/* Docente(s) */}
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

        {/* Avaliações */}
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Tarefas de casa"
          onPress={handleCreateTask}
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

      {/* Lista simples de tarefas */}
      {isLoadingTasks ? (
        <View style={styles.tasksContainer}>
          <ActivityIndicator size="small" color={theme.colors.blueLight} />
          <Text style={styles.tasksLoadingText}>Carregando tarefas...</Text>
        </View>
      ) : tasks.length > 0 ? (
        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>Tarefas</Text>
          {tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
              onPress={() => handleToggleTaskComplete(task)}
            >
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted,
                ]}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Start Study Button */}
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

      {/* Modal Adicionar Horário */}
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

      {/* Modal Confirmar Deleção de Horário */}
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

      {/* Modal Confirmar Deleção de Docente */}
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
  tasksContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tasksTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  tasksLoadingText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grayDark,
  },
  taskItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: theme.spacing.xs,
  },
  taskItemCompleted: {
    backgroundColor: theme.colors.grayLight,
  },
  taskTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.grayDark,
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

