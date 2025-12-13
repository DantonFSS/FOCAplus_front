import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { calculateXP } from '../utils';
import { scoresApi } from '../api/scores';
import { disciplineInstancesApi } from '../api/disciplineInstances';
import { studySessionsApi, StudySessionType, StudySessionMode } from '../api/studySessions';

export const PomodoroScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { disciplineName, studyType, disciplineId } = route.params as { 
    disciplineName?: string; 
    studyType?: string;
    disciplineId?: string;
  };

  const STUDY_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const [time, setTime] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  useEffect(() => {
    if (isRunning && !startedAtRef.current) {
      startedAtRef.current = new Date();
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            if (isBreak) {
              setIsBreak(false);
              setPomodoroCount((prev) => prev + 1);
              return STUDY_TIME;
            } else {
              setIsBreak(true);
              return BREAK_TIME;
            }
          }
          return prevTime - 1;
        });
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
  }, [isRunning, isBreak]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTime(STUDY_TIME);
    setPomodoroCount(0);
  };

  const handleFinish = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (!disciplineId) {
      Alert.alert('Erro', 'ID da disciplina não encontrado.');
      return;
    }

    const studyTime = pomodoroCount * 25 * 60;
    const breakTime = pomodoroCount * 5 * 60;
    const totalTime = studyTime + breakTime;
    
    const pointsEarned = calculateXP(studyTime, studyType || 'Estudar Conteúdo');
    const mapStudyTypeToEnum = (type: string): StudySessionType => {
      if (type === 'Estudar para Avaliação') return StudySessionType.ASSESSMENT;
      if (type === 'Fazer Tarefa de casa') return StudySessionType.HOMEWORK;
      if (type === 'Assistir Aula') return StudySessionType.LESSON;
      return StudySessionType.CONTENT;
    };
    
    let totalPoints = pointsEarned;
    
    try {
      const disciplineData = await disciplineInstancesApi.getById(disciplineId);
      
      const endedAt = new Date();
      const startedAt = startedAtRef.current || new Date();
      
      const createdSession = await studySessionsApi.create({
        userCourseId: disciplineData.userCourseId,
        disciplineInstanceId: disciplineId,
        sessionType: mapStudyTypeToEnum(studyType || 'Estudar Conteúdo'),
        mode: StudySessionMode.POMODORO,
        durationSeconds: studyTime,
        pomodoroCycles: pomodoroCount,
        pointsEarned,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      });
      
      let allScores = await scoresApi.getByDiscipline(disciplineId);
      const existingScoreForSession = allScores.find(
        score => score.sourceId === createdSession.id && score.sourceType === 'STUDY_SESSION'
      );
      
      totalPoints = allScores.reduce((sum, record) => sum + record.points, 0);
      
      if (!existingScoreForSession || existingScoreForSession.points === 0) {
        const scoresWithPoints = allScores.filter(s => s.points > 0);
        const existingTotal = scoresWithPoints.reduce((sum, record) => sum + record.points, 0);
        totalPoints = existingTotal + pointsEarned;
      }
    } catch (error: any) {
      try {
        const allScores = await scoresApi.getByDiscipline(disciplineId);
        totalPoints = allScores.reduce((sum, record) => sum + record.points, 0);
      } catch (e) {
      }
    }
    
    try {
      (navigation as any).navigate('StudyFinished', {
        disciplineName,
        disciplineId,
        studyType,
        timeSpent: totalTime,
        pointsEarned,
        totalPoints,
        method: 'pomodoro',
        pomodoroCount,
      });
    } catch (navError) {
      Alert.alert('Erro', 'Não foi possível navegar para a tela de conclusão.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Image 
          source={require('../../assets/book_alt.png')} 
          style={styles.titleIcon}
        />
        <Text style={styles.title}>{disciplineName || 'Disciplina'}</Text>
        <Text style={styles.studyType}>{studyType || 'Estudar'}</Text>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countLabel}>Pomodoros completados:</Text>
        <Text style={styles.countNumber}>{pomodoroCount}</Text>
      </View>

      <View style={styles.timerContainer}>
        <View style={[
          styles.timerCircle,
          isBreak && styles.timerCircleBreak
        ]}>
          <Text style={styles.timerText}>{formatTime(time)}</Text>
          <Text style={styles.timerLabel}>
            {isBreak ? 'Descanso' : 'Estudo'}
          </Text>
        </View>
        <Image 
          source={require('../../assets/foca2.png')} 
          style={styles.logoIcon}
        />
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          {isBreak 
            ? 'Hora de descansar! \n Você merece uma pausa.'
            : 'Mantenha o foco, \n você está indo muito bem!'
          }
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.startPauseButton}
          onPress={handleStartPause}
          activeOpacity={0.8}
        >
          <Text style={styles.startPauseIcon}>
            {isRunning ? '⏸' : '▶'}
          </Text>
          <Text style={styles.startPauseButtonText}>
            {isRunning ? 'Pausar' : 'Iniciar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetIcon}>↻</Text>
          <Text style={styles.resetButtonText}>Resetar</Text>
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
    marginBottom: theme.spacing.lg,
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
  countContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  countLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grayDark,
    marginBottom: theme.spacing.xs,
  },
  countNumber: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.blueLight,
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
  timerCircleBreak: {
    borderColor: theme.colors.greenGood,
  },
  timerText: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  timerLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: theme.typography.fontWeight.medium,
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
    gap: theme.spacing.sm,
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
  },
  startPauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  startPauseIcon: {
    fontSize: 18,
    color: theme.colors.white,
  },
  startPauseButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.grayLight,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  resetIcon: {
    fontSize: 18,
    color: theme.colors.black,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.greenGood,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  finishIcon: {
    fontSize: 18,
    color: theme.colors.white,
  },
  finishButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

