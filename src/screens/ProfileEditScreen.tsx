import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProps } from '../types';
import { HeaderBar, Button } from '../components';
import { colors, spacing, typography } from '../styles';
import { useAppStore } from '../store';
import { pickAndUploadAvatar } from '../handlers/avatarUpload';

export const ProfileEditScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { user, profile, birthData, updateProfile, updateBirthData } = useAppStore();

  // Store initial values for comparison
  const initialFirstName = '';
  const initialLastName = '';
  const initialUserName = profile?.displayName || '';
  const initialEmail = user?.email || '';
  const initialBirthDate = birthData?.birthDate ? new Date(birthData.birthDate) : new Date();
  const initialBirthTime = (() => {
    if (birthData?.birthTime) {
      const [hours, minutes] = birthData.birthTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date;
    }
    return new Date();
  })();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [userName, setUserName] = useState(initialUserName);
  const [email, setEmail] = useState(initialEmail);
  const [birthDate, setBirthDate] = useState<Date>(initialBirthDate);
  const [birthTime, setBirthTime] = useState<Date>(initialBirthTime);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatar);

  // Check if any changes have been made
  const hasChanges =
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    userName !== initialUserName ||
    avatarUri !== profile?.avatar ||
    birthDate.toISOString().split('T')[0] !== initialBirthDate.toISOString().split('T')[0] ||
    `${birthTime.getHours()}:${birthTime.getMinutes()}` !== `${initialBirthTime.getHours()}:${initialBirthTime.getMinutes()}`;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerOpen(false);
      if (selectedDate) {
        setBirthDate(selectedDate);
      }
    } else if (Platform.OS === 'ios' && selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerOpen(false);
      if (selectedTime) {
        setBirthTime(selectedTime);
      }
    } else if (Platform.OS === 'ios' && selectedTime) {
      setBirthTime(selectedTime);
    }
  };

  const handleChangePhoto = async () => {
    if (!user?.id) return;

    setIsUploadingImage(true);
    try {
      const result = await pickAndUploadAvatar(user.id, profile?.avatar);

      if (result.success && result.url) {
        setAvatarUri(result.url);
        Alert.alert('Success', 'Photo uploaded successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare profile updates
      const profileUpdates: any = {};
      if (userName !== profile?.displayName) {
        profileUpdates.displayName = userName;
      }
      if (avatarUri !== profile?.avatar) {
        profileUpdates.avatar = avatarUri;
      }

      // Update profile if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
      }

      // Update birth data if changed
      if (birthData) {
        const newBirthDate = birthDate.toISOString().split('T')[0];
        const newBirthTime = `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`;

        if (newBirthDate !== birthData.birthDate || newBirthTime !== birthData.birthTime) {
          await updateBirthData({
            ...birthData,
            birthDate: newBirthDate,
            birthTime: newBirthTime,
          });
        }
      }

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Profile"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleChangePhoto}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={colors.text.secondary} />
            ) : (
              <Text style={styles.imageButtonText}>Change Photo</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="FIRST NAME"
            placeholderTextColor={colors.text.secondary}
          />

          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="LAST NAME"
            placeholderTextColor={colors.text.secondary}
          />

          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="USER NAME"
            placeholderTextColor={colors.text.secondary}
          />

          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
            placeholder="EMAIL"
            placeholderTextColor={colors.text.secondary}
          />

          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => setDatePickerOpen(true)}
          >
            <Text style={styles.dateTimeText}>{formatDate(birthDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => setTimePickerOpen(true)}
          >
            <Text style={styles.dateTimeText}>{formatTime(birthTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            fullWidth
            variant={hasChanges ? "primary" : "secondary"}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
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
                  value={birthDate}
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
            value={birthDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )
      )}

      {/* Time Picker Modal */}
      {timePickerOpen && (
        Platform.OS === 'ios' ? (
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
                  value={birthTime}
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
            value={birthTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  imagePlaceholderText: {
    ...typography.h1,
    fontSize: 40,
    color: colors.text.secondary,
  },
  imageButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  imageButtonText: {
    ...typography.h4,
    color: colors.text.secondary,
    fontSize: 14,
  },
  formSection: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.h4,
    color: colors.text.primary,
    minHeight: 56,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  dateTimeInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
  },
  dateTimeText: {
    ...typography.h4,
    color: colors.text.primary,
  },
  buttonContainer: {
    marginTop: spacing.xl,
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
