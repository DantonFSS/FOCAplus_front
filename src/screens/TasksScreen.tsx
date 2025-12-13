import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { tasksApi, TaskResponse } from '../api/tasks';
import { useAuth } from '../contexts/AuthContext';

export const TasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = async () => {
    try {
      // Por enquanto, deixar vazio - precisará implementar endpoint que retorna todas as tarefas do usuário
      // ou buscar por todas as disciplinas
      setTasks([]);
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
    // TODO: Navegar para tela de criar tarefa ou abrir modal
    console.log('Criar nova tarefa');
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
            <View style={styles.taskCheckbox}>
              {task.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
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
    color: theme.colors.grayMedium,
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
    color: theme.colors.grayMedium,
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
    color: theme.colors.grayMedium,
  },
  taskDueDate: {
    fontSize: 13,
    color: theme.colors.grayMedium,
    marginBottom: 4,
  },
  taskPoints: {
    fontSize: 13,
    color: theme.colors.blueLight,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: theme.colors.grayMedium,
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
});
