import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NavigationProps, JournalEntryType, LinkedReading } from '../types';
import { HeaderBar } from '../components';
import { colors, spacing, typography } from '../styles';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../store';

interface JournalEntryScreenProps extends NavigationProps {
  route: {
    params?: {
      entryId?: string;
      linkedReading?: LinkedReading;
      entryType?: JournalEntryType;
    };
  };
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({ navigation, route }) => {
  const { createEntry, updateEntry, getEntry, currentEntry, isSavingEntry } = useAppStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryType, setEntryType] = useState<JournalEntryType>('journal');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEntryTypePicker, setShowEntryTypePicker] = useState(false);
  const [linkedReading, setLinkedReading] = useState<LinkedReading | undefined>(undefined);

  const entryId = route.params?.entryId;

  // Load entry if editing
  useEffect(() => {
    if (entryId) {
      getEntry(entryId).then(() => {
        if (currentEntry) {
          setTitle(currentEntry.title || '');
          setContent(currentEntry.content);
          setEntryType(currentEntry.entry_type);
          setDate(new Date(currentEntry.date));
          setLinkedReading(currentEntry.linked_reading);
        }
      });
    }
  }, [entryId]);

  // Pre-fill if coming from a reading
  useEffect(() => {
    if (route.params?.linkedReading) {
      setLinkedReading(route.params.linkedReading);
    }
    if (route.params?.entryType) {
      setEntryType(route.params.entryType);
    }
  }, [route.params?.linkedReading, route.params?.entryType]);

  // Generate default title
  const getDefaultTitle = () => {
    return `Journal Entry ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  const handleSave = async () => {
    if (!content.trim()) {
      return;
    }

    try {
      if (entryId) {
        // Update existing entry
        await updateEntry(entryId, {
          title: title.trim() || undefined,
          content: content.trim(),
          entry_type: entryType,
          date: date.toISOString(),
        });
      } else {
        // Create new entry
        await createEntry({
          title: title.trim() || undefined,
          content: content.trim(),
          entry_type: entryType,
          date: date.toISOString(),
          linked_reading_id: linkedReading?.id,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const entryTypes: { value: JournalEntryType; label: string }[] = [
    { value: 'journal', label: 'JOURNAL' },
    { value: 'dream', label: 'DREAM' },
    { value: 'tarot', label: 'TAROT' },
    { value: 'iching', label: 'I CHING' },
    { value: 'horoscope', label: 'HOROSCOPE' },
    { value: 'synastry', label: 'SYNASTRY' },
  ];

  const handleReadingPress = () => {
    if (linkedReading) {
      // Navigate to the reading detail screen based on reading type
      // This will be implemented when we have reading detail screens
      console.log('Navigate to reading:', linkedReading.id);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="JOURNAL"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => navigation.goBack(),
        }}
        rightActions={[
          {
            icon: 'checkmark',
            onPress: handleSave,
            disabled: !content.trim() || isSavingEntry,
          },
        ]}
      />
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {/* Date Picker */}
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.dateText}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).toUpperCase()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            textColor={colors.text.primary}
          />
        )}

        {/* Title Input */}
        <TextInput
          style={styles.titleInput}
          placeholder={getDefaultTitle()}
          placeholderTextColor={colors.text.secondary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Entry Type Picker */}
        <View style={styles.entryTypeContainer}>
          <TouchableOpacity
            style={styles.entryTypeButton}
            onPress={() => setShowEntryTypePicker(!showEntryTypePicker)}
          >
            <Text style={styles.entryTypeText}>
              {entryTypes.find((t) => t.value === entryType)?.label || 'JOURNAL'}
            </Text>
            <Ionicons
              name={showEntryTypePicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {showEntryTypePicker && (
            <View style={styles.entryTypePicker}>
              {entryTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.entryTypeOption}
                  onPress={() => {
                    setEntryType(type.value);
                    setShowEntryTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.entryTypeOptionText,
                      type.value === entryType && styles.entryTypeOptionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Linked Reading Card */}
        {linkedReading && (
          <TouchableOpacity style={styles.linkedReadingCard} onPress={handleReadingPress}>
            <View style={styles.linkedReadingHeader}>
              <Text style={styles.linkedReadingLabel}>Prompt or link to reading</Text>
            </View>
            <Text style={styles.linkedReadingTitle} numberOfLines={1}>
              {linkedReading.intention || 'Reading'}
            </Text>
            <Text style={styles.linkedReadingDate}>
              {new Date(linkedReading.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.linkedReadingPreview} numberOfLines={3}>
              {linkedReading.interpretation}
            </Text>
          </TouchableOpacity>
        )}

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts..."
          placeholderTextColor={colors.text.secondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  entryTypeContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: spacing.md,
  },
  entryTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B8A3C8',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    width: '50%',
  },
  entryTypeText: {
    ...typography.caption,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  entryTypePicker: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#B8A3C8',
    borderRadius: 16,
    overflow: 'hidden',
    width: '50%',
    zIndex: 1001,
  },
  entryTypeOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  entryTypeOptionText: {
    ...typography.caption,
    color: '#FFFFFF',
    letterSpacing: 1,
    opacity: 0.7,
  },
  entryTypeOptionTextActive: {
    opacity: 1,
  },
  titleInput: {
    ...typography.h2,
    color: '#F6D99F',
    marginBottom: spacing.md,
    padding: 0,
  },
  linkedReadingCard: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  linkedReadingHeader: {
    marginBottom: spacing.xs,
  },
  linkedReadingLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  linkedReadingTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  linkedReadingDate: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  linkedReadingPreview: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  contentInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: '#141414',
    minHeight: 400,
    padding: spacing.md,
    borderRadius: 8,
  },
});
