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
import { useAppStore } from '../store';
import { colors, spacing, typography, theme } from '../styles';
import { handleChartGeneration } from '../handlers/chartGeneration';

export const BirthDateTimeScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const { location } = route.params as any;
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { updateBirthData, saveNatalChart, setAppLoading, user } = useAppStore();

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
    if (!date || !time || !location || !user) return;

    // Format birth data
    const birthData = {
      birthDate: date.toISOString().split('T')[0], // YYYY-MM-DD
      birthTime: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
      timeUnknown: false,
      birthLocation: location,
      timezone: location.timezone,
    };

    setAppLoading(true);
    try {
      // Step 1: Save birth data to database
      console.log('💾 Saving birth data to database...');
      await updateBirthData(birthData);

      // Step 2: Generate natal chart
      console.log('🌟 Generating natal chart...');
      const result = await handleChartGeneration(birthData, {
        houseSystem: 'placidus',
        precision: 'professional',
        includeReports: true,
        includeAspects: true,
        includeMinorAspects: false,
        includeMidpoints: false,
        forceRegenerate: true,
      });

      if (result.success && result.data?.chartData) {
        // Step 3: Save natal chart to database
        console.log('💾 Saving natal chart to database...');
        await saveNatalChart(user.id, result.data.chartData, 'placidus');

        // Navigate to home after successful chart generation and save
        navigation.reset({
          index: 0,
          routes: [{ name: 'home' }],
        });
      } else {
        console.error('Chart generation failed:', result.message);
        alert('Failed to generate chart. Please try again.');
      }
    } catch (error: any) {
      console.error('Chart generation/save error:', error);
      alert(`An error occurred: ${error.message || 'Please try again.'}`);
    } finally {
      setAppLoading(false);
    }
  };

  const canContinue = date !== null && time !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>

        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.pickerText, date && styles.pickerTextSelected]}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
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
  pickerButton: {
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
