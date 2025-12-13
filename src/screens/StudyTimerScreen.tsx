import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { calculateXP } from '../utils';
import { scoresApi } from '../api/scores';
import { disciplineInstancesApi } from '../api/disciplineInstances';
import { studySessionsApi, StudySessionType, StudySessionMode } from '../api/studySessions';

export const StudyTimerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { disciplineName, studyType, disciplineId } = route.params as { 
    disciplineName?: string; 
    studyType?: string;
    disciplineId?: string;
  };

  const [time, setTime] = useState(0); // tempo em segundos
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<Date>(new Date()); // Momento em que o estudo começou

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsRunning(!isRunning);
  };

  const handleFinish = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (!disciplineId) {
      Alert.alert('Erro', 'ID da disciplina não encontrado.');
      return;
    }

    console.log('🎯 Finalizando estudo - Cronômetro');
    console.log('⏱️ Tempo estudado:', time, 'segundos');
    console.log('📚 Tipo de estudo:', studyType);

    // Calcular XP baseado no tempo e tipo de estudo
    const pointsEarned = calculateXP(time, studyType || 'Estudar Conteúdo');
    console.log('💰 Pontos calculados:', pointsEarned);
    
    // Mapear tipo de estudo para enum (valores do backend)
    const mapStudyTypeToEnum = (type: string): StudySessionType => {
      if (type === 'Estudar para Avaliação') return StudySessionType.ASSESSMENT;
      if (type === 'Fazer Tarefa de casa') return StudySessionType.HOMEWORK;
      if (type === 'Assistir Aula') return StudySessionType.LESSON;
      return StudySessionType.CONTENT;
    };
    
    let totalPoints = pointsEarned;
    
    try {
      // Buscar dados da disciplina para obter userCourseId
      const disciplineData = await disciplineInstancesApi.getById(disciplineId);
      
      const endedAt = new Date();
      const startedAt = startedAtRef.current;
      
      console.log('💾 Criando sessão de estudo no backend...');
      // Criar sessão de estudo
      await studySessionsApi.create({
        userCourseId: disciplineData.userCourseId,
        disciplineInstanceId: disciplineId,
        sessionType: mapStudyTypeToEnum(studyType || 'Estudar Conteúdo'),
        mode: StudySessionMode.STOPWATCH,
        durationSeconds: time,
        pointsEarned,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      });
      console.log('✅ Sessão de estudo criada com sucesso!');
      
      // Os pontos são salvos automaticamente pelo backend quando a sessão é criada
      // Buscar total de pontos da disciplina após criar a sessão
      console.log('📊 Buscando total de pontos da disciplina...');
      const allScores = await scoresApi.getByDiscipline(disciplineId);
      totalPoints = allScores.reduce((sum, record) => sum + record.points, 0);
      console.log('📊 Total de pontos na disciplina:', totalPoints);
    } catch (error: any) {
      console.error('❌ Erro ao salvar sessão/pontos:', error);
      console.error('📋 Detalhes do erro:', error?.response?.data || error?.message);
      // Continua mesmo se houver erro ao salvar, mas mostra o total atual
      try {
        const allScores = await scoresApi.getByDiscipline(disciplineId);
        totalPoints = allScores.reduce((sum, record) => sum + record.points, 0);
      } catch (e) {
        console.error('❌ Erro ao buscar pontos:', e);
      }
    }
    
    console.log('🚀 Navegando para StudyFinished...');
    console.log('📦 Parâmetros:', {
      disciplineName,
      disciplineId,
      studyType,
      timeSpent: time,
      pointsEarned,
      totalPoints,
      method: 'cronometro',
    });
    
    // Navegar para a tela de estudo finalizado
    try {
      (navigation as any).navigate('StudyFinished', {
        disciplineName,
        disciplineId,
        studyType,
        timeSpent: time,
        pointsEarned,
        totalPoints,
        method: 'cronometro',
      });
      console.log('✅ Navegação realizada!');
    } catch (navError) {
      console.error('❌ Erro na navegação:', navError);
      Alert.alert('Erro', 'Não foi possível navegar para a tela de conclusão.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* Icon and Title */}
      <View style={styles.titleSection}>
        <Image 
          source={require('../../assets/book_alt.png')} 
          style={styles.titleIcon}
        />
        <Text style={styles.title}>{disciplineName || 'Disciplina'}</Text>
        <Text style={styles.studyType}>{studyType || 'Estudar'}</Text>
      </View>

      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(time)}</Text>
        </View>
        <Image 
          source={require('../../assets/foca2.png')} 
          style={styles.logoIcon}
        />
      </View>

      {/* Motivational Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          Mantenha o foco,{'\n'}
          você está indo muito bem!
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handlePause}
          activeOpacity={0.8}
        >
          <Text style={styles.pauseIcon}>
            {isRunning ? '⏸' : '▶'}
          </Text>
          <Text style={styles.pauseButtonText}>
            {isRunning ? 'Pausar' : 'Retomar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.finishIcon}>✓</Text>
          <Text style={styles.finishButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  backText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    fontWeight: theme.typography.fontWeight.medium,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  titleIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  studyType: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.blueLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  timerText: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    fontFamily: 'monospace',
  },
  logoIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    position: 'absolute',
    top: -25,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  messageText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.blueLight,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: 28,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  pauseIcon: {
    fontSize: 20,
    color: theme.colors.white,
  },
  pauseButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.greenGood,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  finishIcon: {
    fontSize: 20,
    color: theme.colors.white,
  },
  finishButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

