'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import {
  Input,
  DatePicker,
  TimePicker,
  StepWizard,
  type WizardStep,
} from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';

interface OnboardingData {
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setBirthData } = useAppStore();

  // Form state
  const [data, setData] = useState<OnboardingData>({
    birthDate: '',
    birthTime: '',
    birthLocation: '',
  });

  // Errors
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [locationError, setLocationError] = useState('');

  // Validation functions
  const validateDate = () => {
    if (!data.birthDate) {
      setDateError('Birth date is required');
      return false;
    }

    const date = new Date(data.birthDate);
    const today = new Date();

    if (date > today) {
      setDateError('Birth date cannot be in the future');
      return false;
    }

    setDateError('');
    return true;
  };

  const validateTime = () => {
    if (!data.birthTime) {
      setTimeError('Birth time is required for accurate chart calculations');
      return false;
    }
    setTimeError('');
    return true;
  };

  const validateLocation = () => {
    if (!data.birthLocation || data.birthLocation.trim().length < 3) {
      setLocationError('Birth location is required');
      return false;
    }
    setLocationError('');
    return true;
  };

  // Complete onboarding
  const handleComplete = async () => {
    try {
      // Save birth data to store
      await setBirthData({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        timeUnknown: false,
        birthLocation: {
          name: data.birthLocation,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.timezone || 'UTC',
          timezoneOffset: 0, // TODO: Calculate from timezone
          country: '', // TODO: Parse from location string
          region: '', // TODO: Parse from location string
        },
        timezone: data.timezone || 'UTC',
      });

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save birth data:', error);
    }
  };

  // Wizard steps
  const steps: WizardStep[] = [
    {
      id: 'birth-date',
      title: 'Birth Date',
      description: 'When were you born?',
      validate: validateDate,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Birth Date</h2>
            <p className="text-secondary">
              This helps us calculate your natal chart accurately
            </p>
          </div>

          <DatePicker
            label="Date of Birth"
            value={data.birthDate}
            onChange={(e) => {
              setData({ ...data, birthDate: e.target.value });
              if (dateError) setDateError('');
            }}
            onBlur={validateDate}
            error={dateError}
            required
            helperText="Select the date you were born"
            autoFocus
          />
        </div>
      ),
    },
    {
      id: 'birth-time',
      title: 'Birth Time',
      description: 'What time were you born?',
      validate: validateTime,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Birth Time</h2>
            <p className="text-secondary">
              The exact time is crucial for your rising sign and house placements
            </p>
          </div>

          <TimePicker
            label="Time of Birth"
            value={data.birthTime}
            onChange={(e) => {
              setData({ ...data, birthTime: e.target.value });
              if (timeError) setTimeError('');
            }}
            onBlur={validateTime}
            error={timeError}
            required
            helperText="Enter your birth time (check your birth certificate if unsure)"
            autoFocus
          />

          <div className="bg-card/50 border border-border rounded-lg p-4 text-sm text-secondary">
            <p className="font-medium text-white mb-2">💡 Tip: Finding Your Birth Time</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Check your birth certificate</li>
              <li>Ask your parents or family members</li>
              <li>Hospital birth records may have this information</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'birth-location',
      title: 'Birth Location',
      description: 'Where were you born?',
      validate: validateLocation,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Birth Location</h2>
            <p className="text-secondary">
              The location determines planetary positions relative to Earth
            </p>
          </div>

          <Input
            label="Place of Birth"
            type="text"
            value={data.birthLocation}
            onChange={(e) => {
              setData({ ...data, birthLocation: e.target.value });
              if (locationError) setLocationError('');
            }}
            onBlur={validateLocation}
            error={locationError}
            placeholder="e.g., New York, NY, USA"
            required
            helperText="Enter your city, state/region, and country"
            leftIcon={<MapPin className="w-5 h-5" />}
            autoFocus
          />

          <div className="bg-card/50 border border-border rounded-lg p-4 text-sm text-secondary">
            <p className="font-medium text-white mb-2">📍 Location Tips</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Include city, state/province, and country</li>
              <li>Be as specific as possible for accuracy</li>
              <li>For small towns, include the nearest major city</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'confirm',
      title: 'Confirm',
      description: 'Review your information',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Almost There!</h2>
            <p className="text-secondary">
              Review your birth information before continuing
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-secondary">Birth Date</p>
                <p className="font-medium">
                  {data.birthDate
                    ? new Date(data.birthDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-secondary">Birth Time</p>
                <p className="font-medium">
                  {data.birthTime
                    ? new Date(`2000-01-01T${data.birthTime}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-secondary">Birth Location</p>
                <p className="font-medium">{data.birthLocation || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
            <p className="text-primary">
              ℹ️ You can always update this information later in your profile settings.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={transitions.spring}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-serif text-primary mb-3">
            Ouros
          </h1>
          <p className="text-lg text-secondary">
            Let's create your cosmic profile
          </p>
        </div>

        {/* Wizard */}
        <StepWizard
          steps={steps}
          onComplete={handleComplete}
          onCancel={() => router.push('/login')}
          showStepIndicator={true}
        />
      </motion.div>
    </div>
  );
}
