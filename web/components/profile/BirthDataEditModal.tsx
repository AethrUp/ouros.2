'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MapPin, AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { useAppStore } from '@/store';
import { fadeInUp } from '@/lib/animations';
import type { BirthData, LocationData } from '@/types/user';
import type { BirthDataModificationStatus } from '@/types/subscription';

interface BirthDataEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'check' | 'edit' | 'confirm' | 'processing' | 'success' | 'error';

export const BirthDataEditModal: React.FC<BirthDataEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    birthData: currentBirthData,
    updateBirthDataWithValidation,
    checkBirthDataModificationStatus,
    birthDataModificationStatus,
    isSavingProfile,
    subscriptionState,
  } = useAppStore();

  // Step management
  const [step, setStep] = useState<Step>('check');
  const [error, setError] = useState<string>('');

  // Form data
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [birthTime, setBirthTime] = useState<Date>(new Date());
  const [birthLocation, setBirthLocation] = useState<LocationData | null>(null);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [locationResults, setLocationResults] = useState<LocationData[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Confirmations
  const [confirmDeleteHoroscopes, setConfirmDeleteHoroscopes] = useState(false);
  const [confirmDataCorrect, setConfirmDataCorrect] = useState(false);

  // Progress tracking
  const [progressStep, setProgressStep] = useState<string>('');

  const tier = subscriptionState?.tier || 'free';

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('check');
      setError('');
      setConfirmDeleteHoroscopes(false);
      setConfirmDataCorrect(false);

      if (currentBirthData) {
        setBirthDate(new Date(currentBirthData.birthDate));
        const [hours, minutes] = currentBirthData.birthTime.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes));
        setBirthTime(timeDate);
        setBirthLocation(currentBirthData.birthLocation);
        setLocationSearch(currentBirthData.birthLocation.name);
      }

      // Check modification status
      checkBirthDataModificationStatus().catch(err => {
        console.error('Failed to check modification status:', err);
      });
    }
  }, [isOpen, currentBirthData]);

  // Search for locations
  useEffect(() => {
    if (locationSearch.length < 3) {
      setLocationResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const response = await fetch(`/api/location/search?query=${encodeURIComponent(locationSearch)}`);
        const data = await response.json();
        if (data.success && data.locations) {
          setLocationResults(data.locations);
        }
      } catch (err) {
        console.error('Location search failed:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [locationSearch]);

  // Check if there are changes
  const hasChanges = currentBirthData && (
    birthDate.toISOString().split('T')[0] !== currentBirthData.birthDate ||
    `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}` !== currentBirthData.birthTime ||
    birthLocation?.name !== currentBirthData.birthLocation.name
  );

  // Handle save
  const handleSave = async () => {
    if (!birthLocation) {
      setError('Please select a birth location');
      return;
    }

    if (!confirmDeleteHoroscopes || !confirmDataCorrect) {
      setError('Please confirm both checkboxes to proceed');
      return;
    }

    const newBirthData: BirthData = {
      birthDate: birthDate.toISOString().split('T')[0],
      birthTime: `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`,
      timeUnknown: false,
      birthLocation,
      timezone: birthLocation.timezone,
    };

    try {
      setStep('processing');
      setError('');

      setProgressStep('Validating changes...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgressStep('Updating birth data...');
      await updateBirthDataWithValidation(newBirthData, {
        deletesHoroscopes: confirmDeleteHoroscopes,
        dataCorrect: confirmDataCorrect,
      });

      setProgressStep('Complete!');
      setStep('success');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to update birth data:', err);
      setError(err.message || 'Failed to update birth data');
      setStep('error');
    }
  };

  // Render based on step
  const renderContent = () => {
    switch (step) {
      case 'check':
        return renderCheckStep();
      case 'edit':
        return renderEditStep();
      case 'confirm':
        return renderConfirmStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return null;
    }
  };

  const renderCheckStep = () => {
    if (!birthDataModificationStatus) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }

    if (!birthDataModificationStatus.allowed) {
      return (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
            <X className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-error mb-1">Cannot Modify Birth Data</h4>
              <p className="text-sm text-error/80">{birthDataModificationStatus.reason}</p>
              {birthDataModificationStatus.daysRemaining > 0 && (
                <p className="text-sm text-error/80 mt-2">
                  You can modify your birth data again in {birthDataModificationStatus.daysRemaining} days.
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-card-secondary rounded-lg">
            <h4 className="text-sm font-medium mb-3">Your Limits ({tier} tier):</h4>
            <ul className="space-y-2 text-sm text-secondary">
              <li>• Total changes allowed: {birthDataModificationStatus.totalAllowed}</li>
              <li>• Changes remaining: {birthDataModificationStatus.remainingChanges}</li>
              <li>• Cooldown period: {birthDataModificationStatus.cooldownDays} days</li>
              {birthDataModificationStatus.lastModifiedAt && (
                <li>• Last modified: {new Date(birthDataModificationStatus.lastModifiedAt).toLocaleDateString()}</li>
              )}
            </ul>
          </div>

          {tier === 'free' && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-white mb-3">
                Upgrade to Premium or Pro for more flexibility:
              </p>
              <ul className="space-y-1 text-sm text-secondary mb-4">
                <li>• Premium: 5 changes, 14-day cooldown</li>
                <li>• Pro: Unlimited changes, 7-day cooldown</li>
              </ul>
              <Button
                variant="primary"
                size="small"
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
              >
                View Pricing
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-500 mb-1">Ready to Update</h4>
            <p className="text-sm text-green-500/80">
              You can modify your birth data now.
            </p>
          </div>
        </div>

        <div className="p-4 bg-card-secondary rounded-lg">
          <h4 className="text-sm font-medium mb-3">Current Birth Information:</h4>
          {currentBirthData && (
            <div className="space-y-2 text-sm">
              <p><span className="text-secondary">Date:</span> {new Date(currentBirthData.birthDate).toLocaleDateString()}</p>
              <p><span className="text-secondary">Time:</span> {currentBirthData.birthTime}</p>
              <p><span className="text-secondary">Location:</span> {currentBirthData.birthLocation.name}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-amber-950/30 border border-amber-600/30 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-medium text-amber-400">Important:</h4>
          </div>
          <ul className="space-y-1 text-xs text-amber-200/80">
            <li>• All existing daily horoscopes will be deleted</li>
            <li>• Your natal chart will be recalculated</li>
            <li>• A new horoscope will be generated for today</li>
            <li>• Changes remaining after this: {
              birthDataModificationStatus.remainingChanges === 'unlimited'
                ? 'unlimited'
                : typeof birthDataModificationStatus.remainingChanges === 'number'
                  ? birthDataModificationStatus.remainingChanges - 1
                  : 0
            }</li>
            <li>• Next change available in {birthDataModificationStatus.cooldownDays} days</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep('edit')}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  };

  const renderEditStep = () => (
    <div className="space-y-6">
      {/* Birth Date */}
      <div>
        <label className="block text-sm font-medium mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-2" />
          Birth Date
        </label>
        <DatePicker
          value={birthDate}
          onChange={(date) => setBirthDate(date || new Date())}
          maxDate={new Date()}
        />
      </div>

      {/* Birth Time */}
      <div>
        <label className="block text-sm font-medium mb-2">
          <Clock className="w-4 h-4 inline mr-2" />
          Birth Time
        </label>
        <TimePicker
          value={birthTime}
          onChange={(time) => setBirthTime(time || new Date())}
        />
      </div>

      {/* Birth Location */}
      <div>
        <label className="block text-sm font-medium mb-2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Birth Location
        </label>
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Search for a city..."
          className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-white placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {isSearchingLocation && (
          <p className="text-xs text-secondary mt-2">Searching...</p>
        )}

        {locationResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg bg-background-secondary">
            {locationResults.map((location, index) => (
              <button
                key={index}
                onClick={() => {
                  setBirthLocation(location);
                  setLocationSearch(location.name);
                  setLocationResults([]);
                }}
                className="w-full px-4 py-3 text-left hover:bg-background-tertiary transition-colors border-b border-border last:border-b-0"
              >
                <p className="text-sm text-white">{location.name}</p>
                <p className="text-xs text-secondary">{location.timezone}</p>
              </button>
            ))}
          </div>
        )}

        {birthLocation && (
          <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-white">{birthLocation.name}</p>
            <p className="text-xs text-secondary">{birthLocation.timezone}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep('check')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (!hasChanges) {
              setError('No changes detected');
              return;
            }
            if (!birthLocation) {
              setError('Please select a birth location');
              return;
            }
            setError('');
            setStep('confirm');
          }}
          disabled={!hasChanges || !birthLocation}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="p-4 bg-card-secondary rounded-lg">
        <h4 className="text-sm font-medium mb-4">Review Your Changes:</h4>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">FROM:</p>
              <p className="text-white">{currentBirthData && new Date(currentBirthData.birthDate).toLocaleDateString()}</p>
            </div>
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">TO:</p>
              <p className="text-primary">{birthDate.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">FROM:</p>
              <p className="text-white">{currentBirthData?.birthTime}</p>
            </div>
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">TO:</p>
              <p className="text-primary">
                {birthTime.getHours().toString().padStart(2, '0')}:{birthTime.getMinutes().toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">FROM:</p>
              <p className="text-white text-sm">{currentBirthData?.birthLocation.name}</p>
            </div>
            <div className="flex-1">
              <p className="text-secondary text-xs mb-1">TO:</p>
              <p className="text-primary text-sm">{birthLocation?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmDeleteHoroscopes}
            onChange={(e) => setConfirmDeleteHoroscopes(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border bg-background-secondary text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span className="text-sm text-white">
            I understand this will delete all my existing daily horoscopes
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmDataCorrect}
            onChange={(e) => setConfirmDataCorrect(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border bg-background-secondary text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span className="text-sm text-white">
            I confirm this information is correct
          </span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep('edit')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!confirmDeleteHoroscopes || !confirmDataCorrect}
          className="flex-1"
        >
          Confirm & Update
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-sm text-white">{progressStep}</p>
      <p className="text-xs text-secondary">Please wait, this may take a minute...</p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-medium text-white">Birth Data Updated!</h3>
      <p className="text-sm text-secondary text-center">
        Your natal chart and horoscope have been regenerated.
      </p>
    </div>
  );

  const renderErrorStep = () => (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
        <X className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-error mb-1">Update Failed</h4>
          <p className="text-sm text-error/80">{error}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex-1"
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => setStep('confirm')}
          className="flex-1"
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case 'check':
        return 'Update Birth Data';
      case 'edit':
        return 'Edit Birth Information';
      case 'confirm':
        return 'Confirm Changes';
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error';
      default:
        return 'Update Birth Data';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'processing' ? () => {} : onClose}
      title={getTitle()}
      size="medium"
      closeOnOverlayClick={step !== 'processing'}
      closeOnEscape={step !== 'processing'}
    >
      {renderContent()}
    </Modal>
  );
};
