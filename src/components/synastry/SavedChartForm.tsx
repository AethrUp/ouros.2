import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../../styles';
import { BirthData, LocationData } from '../../types/user';
import { handleChartGeneration } from '../../handlers/chartGeneration';
import { LocationPicker } from '../LocationPicker';
import { Button } from '../Button';

interface SavedChartFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, birthData: BirthData, natalChart: any, options?: { relationship?: string; notes?: string }) => Promise<void>;
}

export const SavedChartForm: React.FC<SavedChartFormProps> = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');

  // Birth data fields
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref to prevent auto-focus on relationship field
  const relationshipInputRef = React.useRef<TextInput>(null);

  const resetForm = () => {
    setName('');
    setRelationship('');
    setBirthDate(new Date());
    setBirthTime(new Date());
    setTimeUnknown(false);
    setLocation(null);
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please select a birth location');
      return;
    }

    setIsGenerating(true);

    try {
      // Format birth data
      const birthData: BirthData = {
        birthDate: birthDate.toISOString().split('T')[0],
        birthTime: timeUnknown ? '12:00' : birthTime.toTimeString().substring(0, 5),
        timeUnknown,
        birthLocation: location,
        timezone: location.timezone,
      };

      // Generate natal chart
      const result = await handleChartGeneration(birthData, {
        houseSystem: 'placidus',
        precision: 'professional',
        includeReports: false,
        includeAspects: true,
        includeMinorAspects: false,
        includeMidpoints: false,
        forceRegenerate: true,
      });

      if (!result.success || !result.data?.chartData) {
        throw new Error(result.message || 'Failed to generate chart');
      }

      // Save the chart
      await onSave(name.trim(), birthData, result.data.chartData, {
        relationship: relationship.trim() || undefined,
      });

      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error saving chart:', error);
      Alert.alert('Error', error.message || 'Failed to save chart');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Chart</Text>
            <TouchableOpacity onPress={handleClose} disabled={isGenerating}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.text.secondary}
              value={name}
              onChangeText={setName}
              editable={!isGenerating}
            />

            <TextInput
              ref={relationshipInputRef}
              style={styles.input}
              placeholder="Relationship (Optional)"
              placeholderTextColor={colors.text.secondary}
              value={relationship}
              onChangeText={setRelationship}
              editable={!isGenerating}
            />

            <TouchableOpacity
              style={styles.input}
              onPress={() => !isGenerating && setShowDatePicker(true)}
              disabled={isGenerating}
              activeOpacity={0.7}
            >
              <Text style={birthDate.getFullYear() === new Date().getFullYear() && birthDate.getMonth() === new Date().getMonth() && birthDate.getDate() === new Date().getDate() ? styles.placeholder : styles.inputText}>
                {birthDate.getFullYear() === new Date().getFullYear() && birthDate.getMonth() === new Date().getMonth() && birthDate.getDate() === new Date().getDate() ? 'Birth Date' : birthDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                visible={true}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => {
                    setShowDatePicker(false);
                    relationshipInputRef.current?.blur();
                  }}
                >
                  <TouchableOpacity activeOpacity={1}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <TouchableOpacity onPress={() => {
                          setShowDatePicker(false);
                          relationshipInputRef.current?.blur();
                        }}>
                          <Text style={styles.pickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          setShowDatePicker(false);
                          relationshipInputRef.current?.blur();
                        }}>
                          <Text style={styles.pickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, selectedDate) => {
                          if (selectedDate) setBirthDate(selectedDate);
                        }}
                        maximumDate={new Date()}
                        style={styles.picker}
                      />
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setBirthDate(selectedDate);
                  // Blur the relationship input to prevent auto-focus
                  setTimeout(() => relationshipInputRef.current?.blur(), 100);
                }}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.input, styles.timeInput, timeUnknown && styles.inputDisabled]}
                onPress={() => !timeUnknown && !isGenerating && setShowTimePicker(true)}
                disabled={timeUnknown || isGenerating}
                activeOpacity={0.7}
              >
                <Text style={timeUnknown ? styles.placeholder : styles.inputText}>
                  {timeUnknown ? 'Birth Time' : birthTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTimeUnknown(!timeUnknown)}
                disabled={isGenerating}
              >
                <Ionicons
                  name={timeUnknown ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>Unknown</Text>
              </TouchableOpacity>
            </View>

            {showTimePicker && Platform.OS === 'ios' && (
              <Modal
                visible={true}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTimePicker(false)}
              >
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => {
                    setShowTimePicker(false);
                    relationshipInputRef.current?.blur();
                  }}
                >
                  <TouchableOpacity activeOpacity={1}>
                    <View style={styles.pickerContainer}>
                      <View style={styles.pickerHeader}>
                        <TouchableOpacity onPress={() => {
                          setShowTimePicker(false);
                          relationshipInputRef.current?.blur();
                        }}>
                          <Text style={styles.pickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          setShowTimePicker(false);
                          relationshipInputRef.current?.blur();
                        }}>
                          <Text style={styles.pickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={birthTime}
                        mode="time"
                        display="spinner"
                        onChange={(event, selectedTime) => {
                          if (selectedTime) setBirthTime(selectedTime);
                        }}
                        style={styles.picker}
                      />
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}

            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={birthTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setBirthTime(selectedTime);
                  // Blur the relationship input to prevent auto-focus
                  setTimeout(() => relationshipInputRef.current?.blur(), 100);
                }}
              />
            )}

            <View style={styles.locationContainer}>
              <LocationPicker
                onLocationSelect={setLocation}
                testId="saved-chart-location-picker"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="SAVE CHART"
              onPress={handleSave}
              disabled={isGenerating}
              loading={isGenerating}
              fullWidth
              variant="primary"
              testId="save-chart-button"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  inputText: {
    ...typography.body,
    color: colors.text.primary,
  },
  placeholder: {
    ...typography.body,
    color: colors.text.secondary,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 14,
  },
  locationContainer: {
    marginTop: spacing.sm,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerCancelText: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 16,
  },
  pickerDoneText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
