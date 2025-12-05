import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TextInput } from 'react-native';
import { theme } from '../theme';

// Import DateTimePicker only for native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker not available');
  }
}

interface DatePickerProps {
  label?: string;
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return new Date();
  });

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      onChange(formatDate(date));
    }
    
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const handleOpen = () => {
    if (Platform.OS === 'web') {
      // Inicializar campos com valor atual se existir
      if (value) {
        const parts = value.split('/');
        setDay(parts[0] || '');
        setMonth(parts[1] || '');
        setYear(parts[2] || '');
      } else {
        const today = new Date();
        setDay(today.getDate().toString().padStart(2, '0'));
        setMonth((today.getMonth() + 1).toString().padStart(2, '0'));
        setYear(today.getFullYear().toString());
      }
    }
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dateButton, error && styles.dateButtonError]}
        onPress={handleOpen}
      >
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && DateTimePicker && (
        <>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.iosButtonContainer}>
              <TouchableOpacity
                style={styles.iosButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.iosButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {showPicker && Platform.OS === 'web' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Selecione a data'}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputsContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateInputLabel}>Dia</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    value={day || (value ? value.split('/')[0] : '')}
                    onChangeText={(text) => setDay(text.replace(/\D/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.dateSeparator}>/</Text>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateInputLabel}>Mês</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    value={month || (value ? value.split('/')[1] : '')}
                    onChangeText={(text) => setMonth(text.replace(/\D/g, '').slice(0, 2))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.dateSeparator}>/</Text>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateInputLabel}>Ano</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="AAAA"
                    value={year || (value ? value.split('/')[2] : '')}
                    onChangeText={(text) => setYear(text.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPicker(false);
                    setDay('');
                    setMonth('');
                    setYear('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    if (day && month && year) {
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      setSelectedDate(date);
                      onChange(formatDate(date));
                      setShowPicker(false);
                      setDay('');
                      setMonth('');
                      setYear('');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.grayDark,
    marginBottom: 2,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonError: {
    borderColor: theme.colors.redBad,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    flex: 1,
    fontWeight: '600',
  },
  placeholder: {
    color: theme.colors.gray,
  },
  calendarIcon: {
    fontSize: 20,
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.redBad,
    marginTop: theme.spacing.xs,
  },
  iosButtonContainer: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grayLight,
    padding: theme.spacing.md,
  },
  iosButton: {
    backgroundColor: theme.colors.blueLight,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  iosButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '80%',
    maxWidth: 400,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.black,
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.gray,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grayDark,
    marginBottom: theme.spacing.xs,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.blueLight,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.gray,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.blueLight,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.blueLight,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: '600',
  },
});

