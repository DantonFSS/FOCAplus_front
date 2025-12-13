import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "../components/InputText";
import { DatePicker } from "../components/DatePicker";
import { Button } from "../components/Button";
import { theme } from "../theme";
import { CourseResponse, coursesApi } from "../api/courses";
import { userCoursesApi, UserCourseResponse } from "../api/userCourses";
import { periodInstancesApi, PeriodInstanceResponse } from "../api/periodInstances";
import { BlurView } from "expo-blur";

interface CourseInfoFormData {
  address: string;
  contact: string;
  online: boolean;
  startDate: string;
  endDate: string;
}

type PeriodData = PeriodInstanceResponse;

const convertISOToDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const convertDateToISO = (dateStr: string): string | undefined => {
  if (!dateStr || dateStr === "dd/mm/aaaa") return undefined;
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return undefined;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toISOString();
};

export const CourseInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as any;
  const userCourseId = routeParams?.userCourseId as string | undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [currentUserCourse, setCurrentUserCourse] = useState<
    UserCourseResponse | undefined
  >(undefined);
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!currentUserCourse?.userCourseId) return;
    setIsDeleting(true);
    try {
      await userCoursesApi.delete(currentUserCourse.userCourseId);
      
      setShowDeleteConfirm(false);
      (navigation as any).reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchUserCourse = async () => {
      if (!userCourseId) return;

      setIsLoadingCourse(true);
      try {
        const userCourse = await userCoursesApi.getById(userCourseId);
        setCurrentUserCourse(userCourse);
      } catch (error: any) {
        Alert.alert(
          "Erro",
          "Não foi possível carregar as informações do curso. Tente novamente."
        );
      } finally {
        setIsLoadingCourse(false);
      }
    };

    fetchUserCourse();
  }, [userCourseId]);

  const loadPeriods = React.useCallback(async () => {
    if (!currentUserCourse) {
      setPeriods([]);
      return;
    }

    setIsLoadingPeriods(true);
    try {
      const instances = await periodInstancesApi.getByUserCourse(currentUserCourse.userCourseId);
      setPeriods(instances);
    } catch (error) {
      setPeriods([]);
    } finally {
      setIsLoadingPeriods(false);
    }
  }, [currentUserCourse]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useFocusEffect(
    React.useCallback(() => {
      loadPeriods();
    }, [loadPeriods])
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseInfoFormData>({
    defaultValues: {
      address: currentUserCourse?.address || "",
      contact: currentUserCourse?.phones?.[0] || currentUserCourse?.emails?.[0] || "",
      online: currentUserCourse?.online || false,
      startDate: currentUserCourse?.startDate
        ? convertISOToDate(currentUserCourse.startDate)
        : "",
      endDate: currentUserCourse?.endDate
        ? convertISOToDate(currentUserCourse.endDate)
        : "",
    },
  });

  useEffect(() => {
    if (currentUserCourse) {
      reset({
        address: currentUserCourse.address || "",
        contact: currentUserCourse.phones?.[0] || currentUserCourse.emails?.[0] || "",
        online: currentUserCourse.online || false,
        startDate: currentUserCourse.startDate
          ? convertISOToDate(currentUserCourse.startDate)
          : "",
        endDate: currentUserCourse.endDate
          ? convertISOToDate(currentUserCourse.endDate)
          : "",
      });
    }
  }, [currentUserCourse, reset]);

  const getLevelLabel = (level?: string): string => {
    const mapping: { [key: string]: string } = {
      UNDERGRADUATE: "Superior",
      HIGH_SCHOOL: "Ensino Médio",
      MASTER: "Mestrado",
      DOCTORATE: "Doutorado",
      FREE_COURSE: "Curso Livre",
      PROFESSIONAL: "Profissional",
      TECHNICAL: "Técnico",
    };
    return mapping[level || ""] || "Superior";
  };

  const onSubmit = async (data: CourseInfoFormData) => {
    if (!currentUserCourse?.userCourseId) {
      Alert.alert("Erro", "ID do curso não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const startDateISO = convertDateToISO(data.startDate);
      const endDateISO = convertDateToISO(data.endDate);

      const updateData = {
        address: data.address || undefined,
        online: data.online,
        startDate: startDateISO,
        endDate: endDateISO,
        phones:
          data.contact && /^\d/.test(data.contact) ? [data.contact] : undefined,
        emails:
          data.contact && data.contact.includes("@")
            ? [data.contact]
            : undefined,
      };

      const updatedUserCourse = await userCoursesApi.update(
        currentUserCourse.userCourseId,
        updateData
      );
      setCurrentUserCourse(updatedUserCourse);
      setIsEditing(false);

      Alert.alert("Sucesso", "Informações do curso atualizadas com sucesso!");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          "Erro ao atualizar informações do curso. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (isLoadingCourse) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>
          Carregando informações do curso...
        </Text>
      </View>
    );
  }

  if (!currentUserCourse) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Curso não encontrado</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          variant="primary"
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUserCourse?.name || 'Curso'}
        </Text>
      </View>

      <View style={styles.courseOverview}>
        <View style={styles.courseIcon}>
          <Text style={styles.courseIconText}>{"</>"}</Text>
        </View>
        <Text style={styles.courseName}>
          {currentUserCourse?.name || "Nome do Curso"}
        </Text>
        <Text style={styles.institutionName}>
          {currentUserCourse?.institutionName || "Instituição"}
        </Text>
        <Text style={styles.courseLevel}>
          {getLevelLabel(currentUserCourse?.level)}
        </Text>
      </View>

      <View style={styles.infoCard}>
        {isEditing ? (
          <>
            <Text style={styles.editTitle}>Editar informações do curso</Text>

            <View style={styles.row}>
              <View style={styles.column}>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputText
                      label="Endereço"
                      containerStyle={[styles.inputContainer, { flex: 1 }]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="light"
                    />
                  )}
                />
              </View>
              <View style={styles.columnLast}>
                <Controller
                  control={control}
                  name="contact"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputText
                      label="Contato"
                      containerStyle={[styles.inputContainer, { flex: 1 }]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      variant="light"
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>EAD/Online</Text>
              <Controller
                control={control}
                name="online"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{
                      false: theme.colors.grayLight,
                      true: theme.colors.blueLight,
                    }}
                    thumbColor={theme.colors.white}
                  />
                )}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.column}>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      label="Previsão de início"
                      placeholder="dd/mm/aaaa"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </View>
              <View style={styles.columnLast}>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      label="Previsão de término"
                      placeholder="dd/mm/aaaa"
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              </View>
            </View>

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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Endereço</Text>
              <Text style={styles.infoValue}>
                {currentUserCourse?.address || "Adicione um endereço..."}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contato</Text>
              <Text style={styles.infoValue}>
                {currentUserCourse?.phones?.[0] ||
                  currentUserCourse?.emails?.[0] ||
                  "Adicione um contato..."}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EAD/Online</Text>
              <Switch
                value={currentUserCourse?.online || false}
                disabled
                trackColor={{
                  false: theme.colors.grayLight,
                  true: theme.colors.blueLight,
                }}
                thumbColor={theme.colors.white}
              />
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previsão de início</Text>
              <Text style={styles.infoValue}>
                {currentUserCourse?.startDate
                  ? convertISOToDate(currentUserCourse.startDate)
                  : "dd/mm/aaaa"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previsão de término</Text>
              <Text style={styles.infoValue}>
                {currentUserCourse?.endDate
                  ? convertISOToDate(currentUserCourse.endDate)
                  : "dd/mm/aaaa"}
              </Text>
            </View>

            <Button
              title="Editar informações"
              onPress={() => setIsEditing(true)}
              variant="primary"
              style={styles.editButton}
            />
            <TouchableOpacity
              style={[styles.deleteButton, styles.deleteButtonTouchable]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Text style={styles.deleteButtonText}>
                {currentUserCourse?.role === 'OWNER' ? 'Excluir curso' : 'Sair do curso'}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showDeleteConfirm}
              transparent
              animationType="fade"
              statusBarTranslucent
            >
              <BlurView
                intensity={40}
                tint="dark"
                style={StyleSheet.absoluteFill}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      {currentUserCourse?.role === 'OWNER' ? 'Excluir curso' : 'Sair do curso'}
                    </Text>
                    <Text style={styles.modalBody}>
                      {currentUserCourse?.role === 'OWNER'
                        ? `Tem certeza que deseja excluir o curso "${currentUserCourse?.name}"? Esta ação não pode ser desfeita.`
                        : `Tem certeza que deseja sair do curso "${currentUserCourse?.name}"? Você poderá entrar novamente usando o código de compartilhamento.`}
                    </Text>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[
                          styles.modalDeleteButton,
                          isDeleting && styles.modalDeleteButtonDisabled,
                        ]}
                        onPress={handleDelete}
                        disabled={isDeleting}
                      >
                        <Text style={styles.modalDeleteButtonText}>
                          {isDeleting
                            ? (currentUserCourse?.role === 'OWNER' ? 'Excluindo...' : 'Saindo...')
                            : (currentUserCourse?.role === 'OWNER' ? 'Sim, excluir' : 'Sim, sair')}
                        </Text>
                      </TouchableOpacity>
                      <Button
                        title="Cancelar"
                        variant="secondary"
                        onPress={() => setShowDeleteConfirm(false)}
                        style={styles.modalButton}
                      />
                    </View>
                  </View>
                </View>
              </BlurView>
            </Modal>
          </>
        )}
      </View>

      <View style={styles.periodsSection}>
        <Text style={styles.periodsTitle}>Períodos</Text>
        <View style={styles.periodsGrid}>
          {isLoadingPeriods ? (
            <View style={styles.periodsLoadingContainer}>
              <Text style={styles.periodsLoadingText}>
                Carregando períodos...
              </Text>
            </View>
          ) : periods.length > 0 ? (
            periods.map((period) => {
              return (
                <TouchableOpacity
                  key={period.id}
                  style={styles.periodButton}
                  onPress={() => {
                    (navigation as any).navigate("PeriodInfo", {
                      periodId: period.id,
                      userCourseId: currentUserCourse.userCourseId,
                    });
                  }}
                >
                  <Text style={styles.periodButtonText}>{period.name}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.periodsEmptyContainer}>
              <Text style={styles.periodsEmptyText}>
                Nenhum período encontrado
              </Text>
            </View>
          )}
        </View>
      </View>

      <Button
        title="Finalizar"
        onPress={() => navigation.goBack()}
        variant="primary"
        style={styles.finalizeButton}
        disabled={isLoadingCourse}
      />
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
    fontSize: 24,
    color: theme.colors.black,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "600",
    color: theme.colors.black,
  },
  courseOverview: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.blueLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  courseIconText: {
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.white,
    fontWeight: "700",
  },
  courseName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: "700",
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  institutionName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  courseLevel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
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
  row: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    width: "100%",
  },
  column: {
    flex: 1,
    minWidth: 0, // Permite que o flex shrink funcione corretamente
    maxWidth: "50%",
    overflow: "hidden",
  },
  columnLast: {
    flex: 1,
    minWidth: 0, // Permite que o flex shrink funcione corretamente
    maxWidth: "50%",
    overflow: "hidden",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 0,
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
    marginBottom: theme.spacing.sm,
  },
  deleteButton: {
    marginTop: theme.spacing.sm,
  },
  deleteButtonTouchable: {
    backgroundColor: theme.colors.redBad,
    borderColor: theme.colors.redBad,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    width: "100%",
    shadowColor: theme.colors.redBad,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: theme.colors.white,
  },
  periodsSection: {
    marginBottom: theme.spacing.xl,
  },
  periodsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  periodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  periodButton: {
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: "48%",
    marginBottom: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: "600",
  },
  finalizeButton: {
    marginTop: theme.spacing.lg,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  periodsLoadingContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  periodsLoadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  periodsEmptyContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  periodsEmptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
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
  modalBody: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grayDark,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: "column",
    gap: theme.spacing.md,
    width: "100%",
  },
  modalButton: {
    width: "100%",
  },
  modalDeleteButton: {
    backgroundColor: theme.colors.redBad,
    borderColor: theme.colors.redBad,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    width: "100%",
    shadowColor: theme.colors.redBad,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalDeleteButtonDisabled: {
    opacity: 0.6,
  },
  modalDeleteButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "600",
    color: theme.colors.white,
  },
});
