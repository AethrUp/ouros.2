import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProps } from '../types';
import { Button } from '../components';
import { colors, spacing, typography } from '../styles';

export const BirthDateTimeScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [hours, setHours] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);


  const formatDate = (date: Date | null) => {
    if (!date) return 'DATE';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (hours: number | null, minutes: number | null) => {
    if (hours === null || minutes === null) return 'TIME';
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerOpen(false);
      if (selectedDate) {
        setDate(selectedDate);
      }
    } else if (Platform.OS === 'ios' && selectedDate) {
      // On iOS, update the date without closing the modal
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerOpen(false);
      if (selectedTime) {
        setHours(selectedTime.getHours());
        setMinutes(selectedTime.getMinutes());
      }
    } else if (Platform.OS === 'ios' && selectedTime) {
      // On iOS, update the time without closing the modal
      setHours(selectedTime.getHours());
      setMinutes(selectedTime.getMinutes());
    }
  };

  const handleContinue = async () => {
    if (!date || hours === null || minutes === null) return;

    // Combine date and time into a single Date object
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0
    );

    navigation.navigate('birthData', { date, time: combinedDateTime });
  };

  const canContinue = date !== null && hours !== null && minutes !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>

        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setDatePickerOpen(true)}
          >
            <Text style={[styles.pickerText, date && styles.pickerTextSelected]}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setTimePickerOpen(true)}
          >
            <Text style={[styles.pickerText, (hours !== null && minutes !== null) && styles.pickerTextSelected]}>
              {formatTime(hours, minutes)}
            </Text>
          </TouchableOpacity>
        </View>

        {datePickerOpen && (
          Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={datePickerOpen}
              onRequestClose={() => setDatePickerOpen(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setDatePickerOpen(false)}>
                      <Text style={styles.modalButton}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={date || new Date()}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                    textColor={colors.text.primary}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )
        )}

        {timePickerOpen && (() => {
          // Use a date from 100 years ago as the base for the time picker to prevent
          // iOS DateTimePicker from rejecting times based on "future datetime" validation.
          // We only extract hours/minutes from the picker, so the date portion doesn't matter.
          const safeBaseDate = new Date();
          safeBaseDate.setFullYear(safeBaseDate.getFullYear() - 100);

          const timePickerValue = hours !== null && minutes !== null
            ? new Date(safeBaseDate.getFullYear(), safeBaseDate.getMonth(), safeBaseDate.getDate(), hours, minutes)
            : new Date(safeBaseDate.getFullYear(), safeBaseDate.getMonth(), safeBaseDate.getDate(), 12, 0);


          return Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={timePickerOpen}
              onRequestClose={() => setTimePickerOpen(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Time</Text>
                    <TouchableOpacity onPress={() => setTimePickerOpen(false)}>
                      <Text style={styles.modalButton}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={timePickerValue}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    textColor={colors.text.primary}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={timePickerValue}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          );
        })()}
      </View>

      <View style={styles.footer}>
        <Button
          title="NEXT"
          onPress={handleContinue}
          disabled={!canContinue}
          fullWidth
          variant="primary"
          testId="birth-datetime-next-button"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    marginBottom: spacing.xl,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  datePickerButton: {
    flex: 2,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  timePickerButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  pickerText: {
    ...typography.h4,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerTextSelected: {
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalButton: {
    ...typography.h4,
    color: colors.primary,
  },
});
