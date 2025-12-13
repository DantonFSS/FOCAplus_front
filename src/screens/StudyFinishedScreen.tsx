import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';

export const StudyFinishedScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    disciplineName, 
    disciplineId,
    studyType,
    timeSpent,
    pointsEarned,
    totalPoints,
    method,
  } = route.params as { 
    disciplineName?: string;
    disciplineId?: string;
    studyType?: string;
    timeSpent?: number; // em segundos
    pointsEarned?: number;
    totalPoints?: number;
    method?: string;
  };

  const [focusLevel, setFocusLevel] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  };

  const handleReturn = () => {
    navigation.navigate('DisciplineInfo' as never, { disciplineId } as never);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estudo finalizado</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('HomeMain' as never)}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../../assets/casa_icon.png')} 
            style={styles.homeIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Image 
          source={require('../../assets/book_alt.png')} 
          style={styles.titleIcon}
        />
        <Text style={styles.title}>{disciplineName || 'Disciplina'}</Text>
        <View style={styles.studyTypeContainer}>
          <Text style={styles.studyType}>{studyType || 'Estudar'}</Text>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Tempo total: {formatTime(timeSpent || 0)} de foco
        </Text>
        <Text style={styles.summaryText}>
          Pontos ganhos: +{pointsEarned || 0}XP
        </Text>
        <Text style={styles.summaryText}>
          Total na disciplina: +{totalPoints || 0}XP
        </Text>
      </View>

      <View style={styles.badgesContainer}>
        <View style={styles.badge}>
          <View style={[styles.badgeShape, styles.badgeBlue]} />
        </View>
        <View style={styles.badge}>
          <View style={[styles.badgeShape, styles.badgeYellow]} />
        </View>
        <View style={styles.badge}>
          <Image 
            source={require('../../assets/foca2.png')} 
            style={styles.badgeIcon}
          />
        </View>
        <View style={styles.badge}>
          <View style={[styles.badgeShape, styles.badgeGreen]} />
        </View>
        <View style={styles.badge}>
          <View style={[styles.badgeShape, styles.badgeBlue]} />
        </View>
      </View>

      <View style={styles.evaluationSection}>
        <Text style={styles.evaluationTitle}>Autoavaliação</Text>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            Quanto você se manteve focado durante o estudo?
          </Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  focusLevel === num && styles.ratingButtonSelected,
                ]}
                onPress={() => setFocusLevel(num)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    focusLevel === num && styles.ratingButtonTextSelected,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            Como está seu nível de energia após o estudo?
          </Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  energyLevel === num && styles.ratingButtonSelected,
                ]}
                onPress={() => setEnergyLevel(num)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    energyLevel === num && styles.ratingButtonTextSelected,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.returnButton}
        onPress={handleReturn}
        activeOpacity={0.8}
      >
        <Text style={styles.returnButtonText}>Voltar para a disciplina</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    flex: 1,
  },
  homeButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: theme.colors.black,
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
  studyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  studyType: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.blueLight,
    fontWeight: theme.typography.fontWeight.medium,
  },
  checkmark: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.greenGood,
    fontWeight: theme.typography.fontWeight.bold,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  badge: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeShape: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  badgeBlue: {
    backgroundColor: theme.colors.blueLight,
  },
  badgeYellow: {
    backgroundColor: '#FFD700',
  },
  badgeGreen: {
    backgroundColor: theme.colors.greenGood,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  evaluationSection: {
    marginBottom: theme.spacing.xl,
  },
  evaluationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  questionContainer: {
    marginBottom: theme.spacing.xl,
  },
  questionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 2,
    borderColor: theme.colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: theme.colors.blueLight,
    borderColor: theme.colors.blueLight,
  },
  ratingButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
  },
  ratingButtonTextSelected: {
    color: theme.colors.white,
  },
  returnButton: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: theme.spacing.lg,
  },
  returnButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});

