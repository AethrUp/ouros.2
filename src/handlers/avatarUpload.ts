import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../utils/supabase';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Request camera roll permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Pick an image from the device's media library
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Permission to access media library was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    return result;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

/**
 * Upload avatar image to Supabase storage
 */
export const uploadAvatar = async (
  userId: string,
  imageUri: string
): Promise<AvatarUploadResult> => {
  try {
    // Create a unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create FormData for upload
    const arrayBuffer = await blob.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload avatar',
    };
  }
};

/**
 * Delete old avatar from storage
 */
export const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) {
      return false;
    }
    const filePath = `avatars/${urlParts[1]}`;

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
};

/**
 * Complete flow: Pick image, upload, and return URL
 */
export const pickAndUploadAvatar = async (
  userId: string,
  currentAvatarUrl?: string
): Promise<AvatarUploadResult> => {
  // Pick image
  const pickerResult = await pickImage();

  if (!pickerResult || pickerResult.canceled) {
    return {
      success: false,
      error: 'Image selection cancelled',
    };
  }

  const imageUri = pickerResult.assets[0].uri;

  // Upload new image
  const uploadResult = await uploadAvatar(userId, imageUri);

  // If upload succeeded and there was an old avatar, delete it
  if (uploadResult.success && currentAvatarUrl) {
    await deleteAvatar(currentAvatarUrl);
  }

  return uploadResult;
};
