import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface Option {
  label: string;
  value: string;
}

interface CustomPickerProps {
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomPicker({ options, selectedValue, onValueChange, placeholder = 'Выберите...', disabled = false }: CustomPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(o => o.value === selectedValue);

  return (
    <>
      <TouchableOpacity 
        style={[styles.pickerButton, disabled && styles.pickerDisabled]} 
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrowIcon}>▼</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.optionItem,
                      item.value === selectedValue && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      item.value === selectedValue && styles.optionTextSelected
                    ]}>
                      {item.label}
                    </Text>
                    {item.value === selectedValue && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
              />
            </BlurView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    fontSize: 16,
    color: '#f8fafc',
  },
  placeholderText: {
    color: '#64748b',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#818cf8',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    height: '60%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  blurContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#94a3b8',
  },
  listContainer: {
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 5,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  optionText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#818cf8',
    fontWeight: '700',
  },
  checkIcon: {
    fontSize: 18,
    color: '#818cf8',
    fontWeight: '700',
  },
});
