import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { tasksApi, TaskResponse } from '../api/tasks';
import { useAuth } from '../contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { InputText } from '../components/InputText';
import { DatePicker } from '../components/DatePicker';

export const TasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { disciplineId } = route.params as { disciplineId: string };
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      const loadedTasks = await tasksApi.getByDiscipline(disciplineId);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTasks();
  };

  const handleCreateTask = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPoints('');
    setTaskDueDate('');
  };

  const convertDateToISO = (dateString: string): string | undefined => {
    if (!dateString) return undefined;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return undefined;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    return date.toISOString();
  };

  const handleSubmitTask = async () => {
    if (!taskTitle.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const newTask = await tasksApi.create({
        disciplineInstanceId: disciplineId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        pointsPossible: taskPoints ? parseInt(taskPoints) : undefined,
        dueDate: convertDateToISO(taskDueDate),
      });
      
      setTasks([...tasks, newTask]);
      handleCloseModal();
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await tasksApi.delete(taskToDelete);
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('❌ Erro ao excluir tarefa:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleToggleComplete = async (taskId: string, currentCompleted: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      const response = await tasksApi.toggleComplete(taskId, !currentCompleted);
      setTasks(tasks.map(t => 
        t.id === taskId ? response.task : t
      ));
    } catch (error) {
      console.error('❌ Erro ao atualizar tarefa:', error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
      </View>
      
      <Text style={styles.emptyTitle}>Nenhuma tarefa adicionada</Text>
      
      <Text style={styles.emptyDescription}>
        Você ainda não cadastrou nenhuma tarefa de casa. Clique abaixo para criar a primeira.
      </Text>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateTask}
      >
        <Text style={styles.createButtonText}>+ Nova tarefa</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTasksList = () => (
    <View style={styles.tasksContainer}>
      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskCard}
          onPress={() => {
            // TODO: Navegar para detalhes da tarefa
            console.log('Task:', task);
          }}
        >
          <View style={styles.taskHeader}>
            <TouchableOpacity 
              style={styles.taskCheckbox}
              onPress={() => handleToggleComplete(task.id, task.completed)}
              disabled={updatingTaskId === task.id}
            >
              {updatingTaskId === task.id ? (
                <ActivityIndicator size="small" color={theme.colors.blueLight} />
              ) : task.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text style={[
                styles.taskTitle,
                task.completed && styles.taskTitleCompleted
              ]}>
                {task.title}
              </Text>
              {task.dueDate && (
                <Text style={styles.taskDueDate}>
                  Vencimento: {formatDate(task.dueDate)}
                </Text>
              )}
              {task.pointsPossible && (
                <Text style={styles.taskPoints}>
                  {task.pointsPossible} pontos
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteTask(task.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={styles.addMoreButton}
        onPress={handleCreateTask}
      >
        <Text style={styles.addMoreButtonText}>+ Adicionar tarefa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <View style={styles.titleIcon}>
            <Text style={styles.titleIconText}>📋</Text>
          </View>
          <Text style={styles.title}>Tarefas de Casa</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.blueLight} />
            <Text style={styles.loadingText}>Carregando tarefas...</Text>
          </View>
        ) : tasks.length === 0 ? (
          renderEmptyState()
        ) : (
          renderTasksList()
        )}
      </ScrollView>

      {/* Modal de Criar Tarefa */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Título *</Text>
                <InputText
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Ex: Estudar capítulo 5"
                  variant="light"
                />
              </View>

              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Descrição</Text>
                <InputText
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Detalhes da tarefa"
                  variant="light"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Pontos</Text>
                <InputText
                  value={taskPoints}
                  onChangeText={setTaskPoints}
                  placeholder="Ex: 10"
                  variant="light"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalFormSection}>
                <Text style={styles.modalLabel}>Data de vencimento</Text>
                <DatePicker
                  value={taskDueDate}
                  onChange={setTaskDueDate}
                  placeholder="Selecione a data"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleCloseModal}
                disabled={isCreating}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (!taskTitle.trim() || isCreating) && styles.modalButtonDisabled
                ]}
                onPress={handleSubmitTask}
                disabled={!taskTitle.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Modal de Confirmar Exclusão */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Excluir Tarefa?</Text>
            <Text style={styles.deleteModalDescription}>
              Esta ação não pode ser desfeita.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                onPress={handleCancelDelete}
                style={styles.deleteModalCancelButton}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={styles.deleteModalConfirmButton}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.grayDark,
    fontWeight: '500',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.blueLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titleIconText: {
    fontSize: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.grayDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.gray,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  emptyIcon: {
    fontSize: 60,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.grayDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: theme.colors.blueLight,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tasksContainer: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 14,
    color: theme.colors.blueLight,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.grayDark,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.gray,
  },
  taskDueDate: {
    fontSize: 13,
    color: theme.colors.gray,
    marginBottom: 4,
  },
  taskPoints: {
    fontSize: 13,
    color: theme.colors.blueLight,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    marginTop: 8,
    marginLeft: 36,
    lineHeight: 20,
  },
  addMoreButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.blueLight,
    borderStyle: 'dashed',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addMoreButtonText: {
    color: theme.colors.blueLight,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 16, 32, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.grayDark,
  },
  modalCloseButton: {
    fontSize: 24,
    color: theme.colors.gray,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  modalFormSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grayDark,
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grayLight,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  modalButtonSecondaryText: {
    color: theme.colors.grayDark,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.blueLight,
  },
  modalButtonPrimaryText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 18,
    color: theme.colors.gray,
    fontWeight: '300',
  },
  deleteModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.grayDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.grayDark,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
