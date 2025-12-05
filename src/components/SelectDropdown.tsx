import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { theme } from '../theme';

interface SelectDropdownProps {
  label?: string;
  placeholder: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectButtonError]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.selectText, !value && styles.placeholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Selecione uma opção'}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    value === item.value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item.value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  selectButton: {
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
  selectButtonError: {
    borderColor: theme.colors.redBad,
  },
  selectText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    flex: 1,
    fontWeight: '600',
  },
  placeholder: {
    color: theme.colors.gray,
    fontWeight: '400',
  },
  selectArrow: {
    fontSize: 16,
    color: theme.colors.blueLight,
    marginLeft: theme.spacing.sm,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.redBad,
    marginTop: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.black,
  },
  modalClose: {
    fontSize: 28,
    color: theme.colors.gray,
    fontWeight: '300',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grayLight,
    minHeight: 56,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(0, 139, 242, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.blueLight,
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.black,
    flex: 1,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: theme.colors.blueLight,
  },
  checkmark: {
    fontSize: 22,
    color: theme.colors.blueLight,
    marginLeft: theme.spacing.sm,
    fontWeight: 'bold',
  },
});

