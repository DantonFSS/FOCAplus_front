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
import { periodsApi, PeriodTemplateResponse } from "../api/periods";
import { disciplinesApi, DisciplineTemplateResponse } from "../api/disciplines";
import { BlurView } from "expo-blur";
import { InputText } from "../components/InputText";

interface PeriodInfoFormData {
  startDate: string;
  endDate: string;
}

export const PeriodInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { periodTemplateId, courseId } = route.params as {
    periodTemplateId: string;
    courseId: string;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [periodTemplate, setPeriodTemplate] =
    useState<PeriodTemplateResponse | null>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [disciplines, setDisciplines] = useState<DisciplineTemplateResponse[]>(
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
      startDate: "",
      endDate: "",
    },
  });

  // Buscar período do backend
  useEffect(() => {
    const loadPeriod = async () => {
      if (!periodTemplateId) {
        console.warn("⚠️ Nenhum periodTemplateId foi recebido pela rota.");
        return;
      }

      setIsLoadingPeriod(true);
      try {
        const template = await periodsApi.getTemplateById(periodTemplateId);

        console.log("✅ Período carregado do backend:", template);
        setPeriodTemplate(template);

        if (template.plannedStart) {
          setValue("startDate", convertDateFromISO(template.plannedStart));
        }

        if (template.plannedEnd) {
          setValue("endDate", convertDateFromISO(template.plannedEnd));
        }
      } catch (error) {
        console.error("❌ Erro ao carregar período:", error);
        Alert.alert("Erro", "Não foi possível carregar o período.");
      } finally {
        setIsLoadingPeriod(false);
      }
    };

    loadPeriod();
  }, [periodTemplateId, setValue]);

  // Carregar disciplinas do backend
  const loadDisciplines = React.useCallback(async () => {
    const currentPeriodTemplateId = periodTemplateId || periodTemplate?.id;
    if (!currentPeriodTemplateId) return;

    setIsLoadingDisciplines(true);
    try {
      const loadedDisciplines = await disciplinesApi.getByPeriod(
        currentPeriodTemplateId
      );
      setDisciplines(loadedDisciplines);
    } catch (error) {
      console.error("❌ Erro ao carregar disciplinas:", error);
    } finally {
      setIsLoadingDisciplines(false);
    }
  }, [periodTemplateId, periodTemplate?.id]);

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
      return date.toISOString().split("T")[0];
    } catch {
      return undefined;
    }
  };

  const onSubmit = async (data: PeriodInfoFormData) => {
    if (!periodTemplate?.id) {
      Alert.alert("Erro", "Período não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const startDateISO = convertDateToISO(data.startDate);
      const endDateISO = convertDateToISO(data.endDate);

      console.log("📝 Atualizando período:", periodTemplate.id);

      const updated = await periodsApi.updateTemplate(periodTemplate.id, {
        startDate: startDateISO,
        endDate: endDateISO,
      });

      setPeriodTemplate(updated);

      reset({
        startDate: updated.plannedStart
          ? convertDateFromISO(updated.plannedStart)
          : "",
        endDate: updated.plannedEnd
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
    const effectivePeriodTemplateId = periodTemplate?.id || periodTemplateId;

    console.log(
      "📝 Salvando nova effectivePeriodTemplateId:",
      effectivePeriodTemplateId
    );

    if (!effectivePeriodTemplateId) {
      Alert.alert("Erro", "Período não encontrado.");
      return;
    }

    if (!newDisciplineName.trim()) return;

    setIsSavingDiscipline(true);

    console.log("📝 Criando disciplina:", newDisciplineName.trim());

    try {
      const created = await disciplinesApi.create({
        periodTemplateId: effectivePeriodTemplateId,
        name: newDisciplineName.trim(),
      });

      // Atualiza lista imediatamente na tela (sem precisar recarregar tudo)
      setDisciplines((prev) => [...prev, created]);

      // Limpa e fecha modal
      setNewDisciplineName("");
      setShowAddDisciplineModal(false);
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
          {isEditing ? "Período Info Editando" : "Período Info"}
        </Text>
      </View>

      {/* Period Overview */}
      <View style={styles.periodOverview}>
        <View style={styles.periodNumberCircle}>
          <Text style={styles.periodNumber}>{periodTemplate?.position}</Text>
        </View>
        <Text style={styles.periodTitle}>{periodTemplate?.name}</Text>
      </View>

      {/* Information Card */}
      <View style={styles.infoCard}>
        {isEditing ? (
          <>
            <Text style={styles.editTitle}>Editar informações do período</Text>

            <Controller
              control={control}
              name="startDate"
              rules={{ required: "Data de início é obrigatória" }}
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Previsão de início"
                  placeholder="dd/mm/aaaa"
                  value={value}
                  onChange={onChange}
                  error={errors.startDate?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="endDate"
              rules={{ required: "Data de término é obrigatória" }}
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label="Previsão de término"
                  placeholder="dd/mm/aaaa"
                  value={value}
                  onChange={onChange}
                  error={errors.endDate?.message}
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
                    {periodTemplate?.plannedStart
                      ? convertDateFromISO(periodTemplate.plannedStart)
                      : "dd/mm/aaaa"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Previsão de término</Text>
                  <Text style={styles.infoValue}>
                    {periodTemplate?.plannedEnd
                      ? convertDateFromISO(periodTemplate.plannedEnd)
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
                  disciplineName: discipline.name,
                  periodTemplateId: periodTemplate?.id || periodTemplateId,
                });
              }}
            >
              <Text style={styles.disciplineName}>{discipline.name}</Text>
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
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  disciplineName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
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
