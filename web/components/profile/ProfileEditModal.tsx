'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store';
import { fadeInUp } from '@/lib/animations';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, updateProfile, isSavingProfile } = useAppStore();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with current profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.displayName || '');
      setError('');
      setShowSuccess(false);
    }
  }, [isOpen, profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const trimmedName = displayName.trim();
      const currentName = profile.displayName || '';
      setHasChanges(trimmedName !== currentName && trimmedName.length > 0);
    }
  }, [displayName, profile]);

  // Validation function
  const validateDisplayName = (value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Display name is required';
    }

    if (trimmed.length < 2) {
      return 'Display name must be at least 2 characters';
    }

    if (trimmed.length > 50) {
      return 'Display name must be less than 50 characters';
    }

    // Check for invalid characters (allow letters, numbers, spaces, hyphens, underscores, apostrophes)
    const validNameRegex = /^[a-zA-Z0-9\s\-_']+$/;
    if (!validNameRegex.test(trimmed)) {
      return 'Display name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes';
    }

    return null;
  };

  // Handle input change with real-time validation
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);

    // Only show validation errors if user has typed something
    if (value.length > 0) {
      const validationError = validateDisplayName(value);
      setError(validationError || '');
    } else {
      setError('');
    }
  };

  // Handle save
  const handleSave = async () => {
    // Final validation
    const trimmedName = displayName.trim();
    const validationError = validateDisplayName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError('');
      await updateProfile({ displayName: trimmedName });

      // Show success feedback
      setShowSuccess(true);

      // Close modal after brief delay to show success state
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isSavingProfile) {
      onClose();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanges && !error && !isSavingProfile) {
      handleSave();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Edit Profile"
      description="Update your display name"
      size="small"
      closeOnOverlayClick={!isSavingProfile}
      closeOnEscape={!isSavingProfile}
    >
      <div className="space-y-6">
        {/* Success State */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-500">Profile updated successfully!</span>
          </motion.div>
        )}

        {/* Profile Preview */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-secondary">Current display name</p>
            <p className="text-base text-white font-medium">
              {profile?.displayName || 'Not set'}
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div>
          <Input
            type="text"
            label="Display Name"
            value={displayName}
            onChange={handleDisplayNameChange}
            onKeyPress={handleKeyPress}
            error={error}
            disabled={isSavingProfile}
            autoFocus
            maxLength={50}
          />

          {/* Character count */}
          <div className="flex justify-between items-center mt-2 px-1">
            <p className="text-xs text-secondary">
              {displayName.trim().length > 0
                ? `${displayName.trim().length} / 50 characters`
                : 'Minimum 2 characters'
              }
            </p>
            {hasChanges && !error && (
              <p className="text-xs text-primary">
                Ready to save
              </p>
            )}
          </div>
        </div>

        {/* General error from API */}
        {error && !displayName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-error/10 border border-error/20 rounded-lg"
          >
            <p className="text-sm text-error">{error}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSavingProfile}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || !!error || isSavingProfile}
            loading={isSavingProfile}
            className="flex-1"
          >
            {isSavingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Helper text */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-secondary text-center">
            Your display name is visible to friends and in synastry readings
          </p>
        </div>
      </div>
    </Modal>
  );
};
