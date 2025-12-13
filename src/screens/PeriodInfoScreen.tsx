import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "../components/DatePicker";
import { Button } from "../components/Button";
import { theme } from "../theme";
import { periodInstancesApi, PeriodInstanceResponse } from "../api/periodInstances";
import { disciplinesApi } from "../api/disciplines";
import { disciplineInstancesApi, DisciplineInstanceResponse } from "../api/disciplineInstances";
import { BlurView } from "expo-blur";
import { InputText } from "../components/InputText";

// Frontend sempre trabalha com period instances
type PeriodData = PeriodInstanceResponse;

interface PeriodInfoFormData {
  name: string;
  plannedStart: string | null;
  plannedEnd: string | null;
}

export const PeriodInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { periodId, userCourseId } = route.params as {
    periodId: string;
    userCourseId: string;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodData | null>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [disciplines, setDisciplines] = useState<DisciplineInstanceResponse[]>(
    []
  );
  const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(false);
  const [showAddDisciplineModal, setShowAddDisciplineModal] = useState(false);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [isSavingDiscipline, setIsSavingDiscipline] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PeriodInfoFormData>({
    defaultValues: {
      name: period?.name,
      plannedStart: period?.plannedStart,
      plannedEnd: period?.plannedEnd,
    },
  });

  // Buscar período do backend (sempre instance)
  useEffect(() => {
    const loadPeriod = async () => {
      if (!periodId) {
        console.warn("⚠️ Nenhum periodId foi recebido pela rota.");
        return;
      }

      setIsLoadingPeriod(true);
      try {
        // Frontend sempre usa instances (tanto OWNER quanto MEMBER)
        const loadedPeriod = await periodInstancesApi.getById(periodId);
        console.log("✅ Período instance carregado:", loadedPeriod);

        setPeriod(loadedPeriod);

        if (loadedPeriod.plannedStart) {
          setValue("plannedStart", convertDateFromISO(loadedPeriod.plannedStart));
        }

        if (loadedPeriod.plannedEnd) {
          setValue("plannedEnd", convertDateFromISO(loadedPeriod.plannedEnd));
        }
      } catch (error) {
        console.error("❌ Erro ao carregar período:", error);
        Alert.alert("Erro", "Não foi possível carregar o período.");
      } finally {
        setIsLoadingPeriod(false);
      }
    };

    loadPeriod();
  }, [periodId, setValue]);

  // Carregar disciplinas do backend
  // IMPORTANT: Always load discipline INSTANCES (both OWNER and MEMBER use instances)
  // Teachers, schedules, tasks, etc. are all linked to instances
  const loadDisciplines = React.useCallback(async () => {
    const currentPeriodId = periodId || period?.id;
    if (!currentPeriodId) return;

    setIsLoadingDisciplines(true);
    try {
      // Frontend sempre usa instances - periodId já é um instance ID
      const loadedDisciplines = await disciplineInstancesApi.getByPeriodInstance(
        currentPeriodId
      );
      setDisciplines(loadedDisciplines);
      console.log(`✅ ${loadedDisciplines.length} discipline instances carregadas`);
    } catch (error) {
      console.error("❌ Erro ao carregar disciplinas:", error);
    } finally {
      setIsLoadingDisciplines(false);
    }
  }, [periodId, period?.id]);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  // Recarregar disciplinas quando a tela receber foco (ao voltar de AddDisciplines)
  useFocusEffect(
    React.useCallback(() => {
      loadDisciplines();
    }, [loadDisciplines])
  );

  // Função para converter data ISO para dd/mm/aaaa
  const convertDateFromISO = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  // Função para converter data dd/mm/aaaa para ISO
  const convertDateToISO = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr.trim() === "") return undefined;

    try {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      // Retorna ISO completo com timezone (ZonedDateTime no backend)
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  const onSubmit = async (data: PeriodInfoFormData) => {
    if (!period?.id) {
      Alert.alert("Erro", "Período não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const plannedStartISO = convertDateToISO(data.plannedStart ?? "");
      const plannedEndISO = convertDateToISO(data.plannedEnd ?? "");

      console.log("📝 Atualizando período instance:", period.id);

      // Frontend sempre atualiza instances (backend detecta role internamente)
      const updated = await periodInstancesApi.update(period.id, {
        name: period.name,
        plannedStart: plannedStartISO,
        plannedEnd: plannedEndISO,
      });

      setPeriod(updated);

      reset({
        name: updated.name,
        plannedStart: updated.plannedStart
          ? convertDateFromISO(updated.plannedStart)
          : "",
        plannedEnd: updated.plannedEnd
          ? convertDateFromISO(updated.plannedEnd)
          : "",
      });

      Alert.alert("Sucesso", "Período atualizado com sucesso!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("❌ Erro ao salvar período:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message ||
          "Erro ao salvar informações do período."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleSaveDiscipline = async () => {
    const effectivePeriodId = period?.id || periodId;

    console.log(
      "📝 Salvando nova disciplina para período:",
      effectivePeriodId
    );

    if (!effectivePeriodId) {
      Alert.alert("Erro", "Período não encontrado.");
      return;
    }

    if (!newDisciplineName.trim()) return;

    setIsSavingDiscipline(true);

    console.log("📝 Criando disciplina:", newDisciplineName.trim());

    try {
      // Criar discipline template (backend auto-cria instance para o user)
      if (!period?.periodTemplateId) {
        Alert.alert("Erro", "Template do período não encontrado.");
        setIsSavingDiscipline(false);
        return;
      }

      await disciplinesApi.create({
        periodTemplateId: period.periodTemplateId,
        name: newDisciplineName.trim(),
      });

      console.log("✅ Disciplina template criada (backend auto-cria instance).");

      // Reload discipline instances (backend creates them automatically)
      await loadDisciplines();

      // Limpa e fecha modal
      setNewDisciplineName("");
      setShowAddDisciplineModal(false);
      
      Alert.alert("Sucesso", "Disciplina criada com sucesso!");
    } catch (error: any) {
      console.error("❌ Erro ao criar disciplina:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Erro ao criar disciplina."
      );
    } finally {
      setIsSavingDiscipline(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {period?.name || 'Período'}
        </Text>
      </View>

      {/* Period Overview */}
      <View style={styles.periodOverview}>
        <View style={styles.periodNumberCircle}>
          <Text style={styles.periodNumber}>{period?.position}</Text>
        </View>
        <Text style={styles.periodTitle}>{period?.name}</Text>
      </View>

      {/* Information Card */}
      <View style={styles.infoCard}>
        {isEditing ? (
          <>
            <Text style={styles.editTitle}>Editar informações do período</Text>

            <Controller
              control={control}
              name="plannedStart"
              rules={{ required: "Data de início é obrigatória" }}
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Previsão de início"
                  placeholder="dd/mm/aaaa"
                  value={value ?? undefined}
                  onChange={onChange}
                  error={errors.plannedStart?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="plannedEnd"
              rules={{ required: "Data de término é obrigatória" }}
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Previsão de término"
                  placeholder="dd/mm/aaaa"
                  value={value ?? undefined}
                  onChange={onChange}
                  error={errors.plannedEnd?.message}
                />
              )}
            />

            <View style={styles.editButtons}>
              <Button
                title="Cancelar"
                onPress={handleCancel}
                variant="secondary"
                style={styles.cancelButton}
              />
              <Button
                title={isLoading ? "Salvando..." : "Salvar"}
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                style={styles.saveButton}
                disabled={isLoading}
              />
            </View>
          </>
        ) : (
          <>
            {isLoadingPeriod ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.blueLight}
                />
                <Text style={styles.loadingText}>
                  Carregando informações...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Previsão de início</Text>
                  <Text style={styles.infoValue}>
                    {period?.plannedStart
                      ? convertDateFromISO(period.plannedStart)
                      : "dd/mm/aaaa"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Previsão de término</Text>
                  <Text style={styles.infoValue}>
                    {period?.plannedEnd
                      ? convertDateFromISO(period.plannedEnd)
                      : "dd/mm/aaaa"}
                  </Text>
                </View>

                <Button
                  title="Editar informações"
                  onPress={() => setIsEditing(true)}
                  variant="primary"
                  style={styles.editButton}
                />
              </>
            )}
          </>
        )}
      </View>

      {/* Add Disciplines Button */}
      <Button
        title="+ Adicionar disciplinas"
        onPress={() => setShowAddDisciplineModal(true)}
        variant="primary"
        style={styles.addDisciplinesButton}
      />

      <Modal
        visible={showAddDisciplineModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar disciplina</Text>

              <InputText
                label="Nome da disciplina"
                placeholder="Ex: Matemática"
                value={newDisciplineName}
                onChangeText={setNewDisciplineName}
                variant="light"
              />

              <View style={styles.modalActions}>
                <Button
                  title={isSavingDiscipline ? "Salvando..." : "Salvar"}
                  variant="primary"
                  onPress={handleSaveDiscipline}
                  disabled={!newDisciplineName.trim() || isSavingDiscipline}
                />

                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setNewDisciplineName("");
                    setShowAddDisciplineModal(false);
                  }}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Disciplines List */}
      {isLoadingDisciplines ? (
        <View style={styles.disciplinesLoadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.blueLight} />
          <Text style={styles.disciplinesLoadingText}>
            Carregando disciplinas...
          </Text>
        </View>
      ) : disciplines.length > 0 ? (
        <View style={styles.disciplinesContainer}>
          <Text style={styles.disciplinesTitle}>Disciplinas</Text>
          {disciplines.map((discipline) => (
            <TouchableOpacity
              key={discipline.id}
              style={styles.disciplineCard}
              onPress={() => {
                // Navegar para informações da disciplina
                (navigation as any).navigate("DisciplineInfo", {
                  disciplineId: discipline.id,
                });
              }}
            >
              <View style={styles.disciplineCardContent}>
                <View style={styles.disciplineIcon}>
                  <Text style={styles.disciplineIconText}>📚</Text>
                </View>
                <Text style={styles.disciplineName}>{discipline.name}</Text>
                <Text style={styles.disciplineArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  backArrow: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "600",
    color: theme.colors.black,
  },
  periodOverview: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  periodNumberCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.blueLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  periodNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.white,
  },
  periodTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: "700",
    color: theme.colors.black,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  editTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: "700",
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    flex: 1,
    textAlign: "right",
    marginLeft: theme.spacing.md,
    fontWeight: "600",
  },
  editButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    marginTop: theme.spacing.md,
  },
  addDisciplinesButton: {
    marginBottom: theme.spacing.xl,
  },
  disciplinesContainer: {
    marginTop: theme.spacing.md,
  },
  disciplineCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
  },
  disciplineCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  disciplineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.blueLight + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  disciplineIconText: {
    fontSize: 20,
  },
  disciplineName: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: theme.colors.black,
  },
  disciplineArrow: {
    fontSize: 24,
    color: theme.colors.gray,
    fontWeight: "300",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  disciplinesLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
  },
  disciplinesLoadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
  },
  disciplinesTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "700",
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8, 16, 32, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    width: "100%",
    height: "100%",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg * 1.5,
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: "column",
    gap: theme.spacing.md,
    width: "100%",
  },
});
