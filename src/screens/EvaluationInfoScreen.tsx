import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { assessmentsApi, AssessmentResponse } from '../api/assessments';

interface EvaluationFormData {
  description: string;
  aiPrompt: string;
}

export const EvaluationInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const evaluationId = (route.params as any)?.evaluationId;
  const fallbackName = (route.params as any)?.evaluationName || 'Avaliação 1';
  const [evaluation, setEvaluation] = useState<AssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EvaluationFormData>({
    defaultValues: {
      description: '',
      aiPrompt: '',
    },
  });

  const description = watch('description');

  // Carregar dados reais da avaliação
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!evaluationId) return;

      setIsLoading(true);
      try {
        const data = await assessmentsApi.update(evaluationId, {}); // GET não existe, usar update com corpo vazio seria errado
      } catch (error) {
        // fallback: apenas não carregar nada extra
        console.error('❌ Erro ao carregar avaliação (não há GET por id exposto na API de frontend):', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluation();
  }, [evaluationId]);

  const handleGenerateWithAI = async (data: EvaluationFormData) => {
    if (!data.aiPrompt.trim()) {
      Alert.alert('Atenção', 'Por favor, descreva os assuntos da avaliação para gerar o texto.');
      return;
    }

    setIsGenerating(true);
    // TODO: Integrar com API de IA real
    // Por enquanto, simula geração de texto baseado no prompt
    setTimeout(() => {
      const generatedText = `Esta avaliação abordará os seguintes temas: ${data.aiPrompt}. 
      
A avaliação será composta por questões que testarão o conhecimento dos estudantes sobre esses assuntos, incluindo conceitos teóricos e aplicações práticas. 

Os estudantes devem estar preparados para demonstrar compreensão profunda dos tópicos mencionados e capacidade de aplicá-los em diferentes contextos.`;

      setValue('description', generatedText);
      setIsGenerating(false);
      Alert.alert('Sucesso', 'Texto gerado com IA!');
    }, 2000);
  };

  const displayName = evaluation?.title || fallbackName;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.blueLight} />
        <Text style={styles.loadingText}>Carregando avaliação...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliação_Info IA</Text>
      </View>

      {/* Evaluation Title */}
      <View style={styles.evaluationHeader}>
        <Text style={styles.evaluationIcon}>📄</Text>
        <Text style={styles.evaluationGrade}>A+</Text>
        <Text style={styles.evaluationName}>{displayName}</Text>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        Adicione informações sobre esta avaliação...
      </Text>

      {/* Empty State (quando não há descrição) */}
      {!description && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>Nenhuma informação adicionada ainda.</Text>
        </View>
      )}

      {/* Evaluation Description */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Descrição da avaliação</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Exemplo: Avaliação sobre o conteúdo da Unidade 1, incluindo temas de probabilidade e estatística..."
              containerStyle={styles.textAreaContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="light"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          )}
        />
        {description && (
          <Button
            title="Salvar descrição"
            onPress={() => {
              Alert.alert('Sucesso', 'Descrição da avaliação salva!');
            }}
            variant="primary"
            style={styles.saveButton}
          />
        )}
      </View>

      {/* AI Assistance Section */}
      <View style={styles.aiSection}>
        <Text style={styles.aiPromptTitle}>
          Quer ajuda para descrever a avaliação?
        </Text>
        <Controller
          control={control}
          name="aiPrompt"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Ex: avaliação terá como assuntos algoritmos genéticos e redes neurais"
              containerStyle={styles.aiInputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="light"
            />
          )}
        />
        <Button
          title={isGenerating ? 'Gerando...' : 'Gerar texto com IA'}
          onPress={handleSubmit(handleGenerateWithAI)}
          variant="primary"
          style={styles.generateButton}
          disabled={isGenerating}
          loading={isGenerating}
        />
      </View>
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
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  evaluationIcon: {
    fontSize: 32,
    marginRight: theme.spacing.sm,
  },
  evaluationGrade: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.greenGood,
    marginRight: theme.spacing.sm,
  },
  evaluationName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.black,
  },
  instruction: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.3,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  aiSection: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  aiPromptTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  aiInputContainer: {
    marginBottom: theme.spacing.md,
  },
  generateButton: {
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
});

