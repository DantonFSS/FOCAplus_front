import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from '../components/InputText';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { assessmentsApi, AssessmentResponse } from '../api/assessments';

interface EvaluationFormData {
  title: string;
  description: string;
  pointsPossible: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const EvaluationInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const evaluationId = (route.params as any)?.evaluationId;
  const [evaluation, setEvaluation] = useState<AssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EvaluationFormData>({
    defaultValues: {
      title: '',
      description: '',
      pointsPossible: '',
      date: '',
      startTime: '',
      endTime: '',
    },
  });

  // Formatar horário automaticamente
  const formatTimeInput = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  // Converter data ISO para formato brasileiro
  const convertISOToDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Converter data brasileira para ISO
  const convertDateToISO = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr === 'dd/mm/aaaa') return undefined;
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return undefined;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
  };

  // Carregar dados da avaliação
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!evaluationId) return;

      setIsLoading(true);
      try {
        const data = await assessmentsApi.getById(evaluationId);
        setEvaluation(data);
        console.log('✅ Avaliação carregada:', data);
      } catch (error) {
        console.error('❌ Erro ao carregar avaliação:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados da avaliação.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluation();
  }, [evaluationId]);

  // Atualizar form quando evaluation mudar
  useEffect(() => {
    if (evaluation) {
      reset({
        title: evaluation.title || '',
        description: evaluation.description || '',
        pointsPossible: evaluation.pointsPossible?.toString() || '',
        date: evaluation.date ? convertISOToDate(evaluation.date) : '',
        startTime: evaluation.startTime?.substring(0, 5) || '',
        endTime: evaluation.endTime?.substring(0, 5) || '',
      });
    }
  }, [evaluation, reset]);

  const onSubmit = async (data: EvaluationFormData) => {
    if (!evaluationId) {
      Alert.alert('Erro', 'ID da avaliação não encontrado');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {};
      
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.pointsPossible) updateData.pointsPossible = parseInt(data.pointsPossible);
      if (data.date) updateData.date = convertDateToISO(data.date);
      if (data.startTime) updateData.startTime = data.startTime;
      if (data.endTime) updateData.endTime = data.endTime;

      const updated = await assessmentsApi.update(evaluationId, updateData);
      setEvaluation(updated);
      Alert.alert('Sucesso', 'Avaliação atualizada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = evaluation?.title || 'Avaliação';

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
        <Text style={styles.headerTitle}>Detalhes da Avaliação</Text>
      </View>

      {/* Evaluation Header */}
      <View style={styles.evaluationHeader}>
        <Text style={styles.evaluationIcon}>📄</Text>
        <Text style={styles.evaluationName}>{displayName}</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Informações da avaliação</Text>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Título"
              containerStyle={styles.inputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="light"
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Descrição"
              containerStyle={styles.inputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="light"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        />

        <Controller
          control={control}
          name="pointsPossible"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputText
              label="Pontuação máxima"
              containerStyle={styles.inputContainer}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="light"
              keyboardType="numeric"
              placeholder="10"
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Data da avaliação"
              placeholder="dd/mm/aaaa"
              value={value}
              onChange={onChange}
            />
          )}
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <Controller
              control={control}
              name="startTime"
              render={({ field: { onChange, value } }) => (
                <InputText
                  label="Horário de início"
                  containerStyle={styles.inputContainer}
                  value={value}
                  onChangeText={(text) => onChange(formatTimeInput(text))}
                  variant="light"
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="08:00"
                />
              )}
            />
          </View>
          <View style={styles.columnLast}>
            <Controller
              control={control}
              name="endTime"
              render={({ field: { onChange, value } }) => (
                <InputText
                  label="Horário de término"
                  containerStyle={styles.inputContainer}
                  value={value}
                  onChangeText={(text) => onChange(formatTimeInput(text))}
                  variant="light"
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="10:00"
                />
              )}
            />
          </View>
        </View>

        <Button
          title={isSaving ? 'Salvando...' : 'Salvar alterações'}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          style={styles.saveButton}
          disabled={isSaving}
        />
      </View>

      {/* Seção de IA comentada para implementação futura
      <View style={styles.aiSection}>
        <Text style={styles.aiPromptTitle}>
          🤖 Assistente de IA (em breve)
        </Text>
        <Text style={styles.aiDescription}>
          Em breve você poderá usar IA para gerar descrições automáticas para suas avaliações.
        </Text>
      </View>
      */}
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
    marginBottom: theme.spacing.xl,
  },
  evaluationIcon: {
    fontSize: 32,
    marginRight: theme.spacing.sm,
  },
  evaluationName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.black,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  column: {
    flex: 1,
  },
  columnLast: {
    flex: 1,
  },
  saveButton: {
    marginTop: theme.spacing.md,
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
});

