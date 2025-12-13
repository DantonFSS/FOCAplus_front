import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';

export const EstudandoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { disciplineName, disciplineId } = route.params as { disciplineName?: string; disciplineId?: string };
  
  const [selectedStudyOption, setSelectedStudyOption] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'pomodoro' | 'cronometro'>('cronometro');
  const [showMethodDescription, setShowMethodDescription] = useState<'pomodoro' | 'cronometro' | null>(null);

  const studyOptions = [
    {
      id: 'avaliacao',
      title: 'Estudar para Avaliação',
      icon: require('../../assets/sheet_icon.png'),
    },
    {
      id: 'tarefa',
      title: 'Fazer Tarefa de casa',
      icon: require('../../assets/book_alt.png'),
    },
    {
      id: 'aula',
      title: 'Assistir Aula',
      icon: require('../../assets/play_icon.png'),
    },
    {
      id: 'conteudo',
      title: 'Estudar Conteúdo',
      icon: require('../../assets/book_alt.png'),
    },
  ];

  const handleStart = () => {
    if (!selectedStudyOption) {
      return;
    }

    const studyOptionTitles: { [key: string]: string } = {
      'avaliacao': 'Estudar para Avaliação',
      'tarefa': 'Fazer Tarefa de casa',
      'aula': 'Assistir Aula',
      'conteudo': 'Estudar Conteúdo',
    };

    const studyType = studyOptionTitles[selectedStudyOption] || 'Estudar';

    if (selectedMethod === 'cronometro') {
      (navigation as any).navigate('StudyTimer', {
        disciplineName,
        disciplineId,
        studyType,
        method: 'cronometro',
      });
    } else {
      (navigation as any).navigate('Pomodoro', {
        disciplineName,
        disciplineId,
        studyType,
        method: 'pomodoro',
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/book_alt.png')} 
            style={styles.titleIcon}
          />
        </View>
        <Text style={styles.title}>
          Estudar — {disciplineName || 'Disciplina'}
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {studyOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedStudyOption === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => setSelectedStudyOption(option.id)}
            activeOpacity={0.7}
          >
            <Image 
              source={option.icon} 
              style={[
                styles.optionIcon,
                selectedStudyOption === option.id && styles.optionIconSelected,
              ]} 
            />
            <Text
              style={[
                styles.optionText,
                selectedStudyOption === option.id && styles.optionTextSelected,
              ]}
            >
              {option.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.methodSection}>
        <Text style={styles.methodTitle}>Como você quer estudar?</Text>
        <View style={styles.methodButtons}>
          <View style={styles.methodButtonContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === 'pomodoro' && styles.methodButtonSelected,
              ]}
              onPress={() => setSelectedMethod('pomodoro')}
              activeOpacity={0.7}
            >
              <Text style={styles.methodIcon}>⏱</Text>
              <Text
                style={[
                  styles.methodText,
                  selectedMethod === 'pomodoro' && styles.methodTextSelected,
                ]}
              >
                Pomodoro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowMethodDescription(showMethodDescription === 'pomodoro' ? null : 'pomodoro')}
            >
              <Image 
                source={require('../../assets/info_icon.png')} 
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.methodButtonContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === 'cronometro' && styles.methodButtonSelected,
              ]}
              onPress={() => setSelectedMethod('cronometro')}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../../assets/hourglass_icon.png')} 
                style={[
                  styles.methodIcon,
                  selectedMethod === 'cronometro' && styles.methodIconSelected,
                ]} 
              />
              <Text
                style={[
                  styles.methodText,
                  selectedMethod === 'cronometro' && styles.methodTextSelected,
                ]}
              >
                Cronômetro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowMethodDescription(showMethodDescription === 'cronometro' ? null : 'cronometro')}
            >
              <Image 
                source={require('../../assets/info_icon.png')} 
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {showMethodDescription === 'pomodoro' && (
          <View style={styles.descriptionBubble}>
            <Text style={styles.descriptionTitle}>Pomodoro</Text>
            <Text style={styles.descriptionText}>
              Método de longa duração fixa - Intercalando entre 25 minutos de estudo e 5 minutos de descanso.
            </Text>
          </View>
        )}
        {showMethodDescription === 'cronometro' && (
          <View style={styles.descriptionBubble}>
            <Text style={styles.descriptionTitle}>Cronômetro</Text>
            <Text style={styles.descriptionText}>
              Método de duração variada - O cronômetro começa do zero e segue aumentando até você parar. É uma boa opção para sair da zona de conforto e estudar cada vez mais, medindo sua evolução.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          !selectedStudyOption && styles.startButtonDisabled,
        ]}
        onPress={handleStart}
        disabled={!selectedStudyOption}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Começar!</Text>
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
    marginBottom: theme.spacing.lg,
  },
  backText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: theme.typography.fontWeight.medium,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  titleIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  optionButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.grayLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.blueLight,
    borderColor: theme.colors.blueLight,
  },
  optionIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: theme.spacing.sm,
    tintColor: theme.colors.blueLight,
  },
  optionIconSelected: {
    tintColor: theme.colors.white,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: theme.colors.white,
  },
  methodSection: {
    marginBottom: theme.spacing.lg,
  },
  methodTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  methodButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.grayLight,
  },
  infoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  infoIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    tintColor: theme.colors.white,
  },
  methodButtonSelected: {
    backgroundColor: theme.colors.blueLight,
    borderColor: theme.colors.blueLight,
  },
  methodIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: theme.spacing.xs,
    tintColor: theme.colors.black,
  },
  methodIconSelected: {
    tintColor: theme.colors.white,
  },
  methodText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.black,
  },
  methodTextSelected: {
    color: theme.colors.white,
  },
  startButton: {
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
  },
  startButtonDisabled: {
    backgroundColor: theme.colors.grayLight,
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  descriptionBubble: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  descriptionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.blueLight,
    marginBottom: theme.spacing.xs,
  },
  descriptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grayDark,
    lineHeight: 20,
  },
});

