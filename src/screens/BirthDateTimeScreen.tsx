import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProps } from '../types';
import { Button } from '../components';
import { colors, spacing, typography, theme } from '../styles';

export const BirthDateTimeScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'DATE';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date | null) => {
    if (!time) return 'TIME';
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleContinue = async () => {
    if (!date || !time) return;

    // Pass date and time to the next screen (birthData)
    navigation.navigate('birthData', { date, time });
  };

  const canContinue = date !== null && time !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>

        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              setShowTimePicker(false);
              setShowDatePicker(true);
            }}
          >
            <Text style={[styles.pickerText, date && styles.pickerTextSelected]}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => {
              setShowDatePicker(false);
              setShowTimePicker(true);
            }}
          >
            <Text style={[styles.pickerText, time && styles.pickerTextSelected]}>
              {formatTime(time)}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            textColor={theme.colors.textInverse}
            themeVariant="dark"
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            textColor={theme.colors.textInverse}
            themeVariant="dark"
          />
        )}
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
});
