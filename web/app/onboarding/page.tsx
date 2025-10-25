'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Brain,
  Target,
  CheckCircle2,
  Heart,
  Briefcase,
  HeartPulse,
  Home,
  Users,
  Plane,
  Palette,
  Gem,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  Input,
  DatePicker,
  TimePicker,
  StepWizard,
  Button,
  type WizardStep,
} from '@/components/ui';
import { fadeInUp, transitions, staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneOffset: number;
  country: string;
  region: string;
}

interface OnboardingData {
  birthDate: string;
  birthTime: string;
  birthLocation: LocationData | null;
  selectedCategories: string[];
  interpretationStyle: 'mystical' | 'psychological' | 'practical' | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface InterpretationStyle {
  id: 'mystical' | 'psychological' | 'practical';
  name: string;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: Category[] = [
  { id: 'love', name: 'Love', description: 'Romance, relationships, attraction, and emotional connections', icon: <Heart className="w-6 h-6" /> },
  { id: 'career', name: 'Career', description: 'Professional growth, ambition, success, and work dynamics', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'health', name: 'Health', description: 'Physical wellness, mental health, vitality, and healing', icon: <HeartPulse className="w-6 h-6" /> },
  { id: 'family', name: 'Family', description: 'Family bonds, home life, ancestry, and domestic harmony', icon: <Home className="w-6 h-6" /> },
  { id: 'friendship', name: 'Friendship', description: 'Social connections, community, networking, and platonic relationships', icon: <Users className="w-6 h-6" /> },
  { id: 'travel', name: 'Travel', description: 'Adventures, exploration, new experiences, and cultural expansion', icon: <Plane className="w-6 h-6" /> },
  { id: 'creativity', name: 'Creativity', description: 'Artistic expression, innovation, imagination, and creative projects', icon: <Palette className="w-6 h-6" /> },
  { id: 'spirituality', name: 'Spirituality', description: 'Spiritual growth, intuition, higher consciousness, and inner wisdom', icon: <Gem className="w-6 h-6" /> },
  { id: 'education', name: 'Education', description: 'Learning, skill development, knowledge acquisition, and intellectual growth', icon: <BookOpen className="w-6 h-6" /> },
];

const INTERPRETATION_STYLES: InterpretationStyle[] = [
  {
    id: 'mystical',
    name: 'Mystical',
    description: 'Connect to bigger themes and life lessons, wisdom traditions, and personal meaning-making',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'psychological',
    name: 'Psychological',
    description: 'Explore inner patterns, motivations, and personal growth opportunities through accessible insights',
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: 'practical',
    name: 'Practical',
    description: 'Focus on real-world situations, concrete next steps, and actionable guidance for daily life',
    icon: <Target className="w-6 h-6" />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateBirthData, updatePreferences, generateNatalChart, saveNatalChart, generateHoroscope, user, profile, preferences } = useAppStore();

  // Form state
  const [data, setData] = useState<OnboardingData>({
    birthDate: '',
    birthTime: '',
    birthLocation: null,
    selectedCategories: [],
    interpretationStyle: null,
  });

  // Errors
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [styleError, setStyleError] = useState('');

  // Touched state
  const [dateTouched, setDateTouched] = useState(false);
  const [timeTouched, setTimeTouched] = useState(false);

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Validation functions
  const validateDate = (showError = true) => {
    if (!data.birthDate) {
      if (showError && dateTouched) {
        setDateError('Birth date is required');
      }
      return false;
    }

    const date = new Date(data.birthDate);
    const today = new Date();

    if (date > today) {
      if (showError && dateTouched) {
        setDateError('Birth date cannot be in the future');
      }
      return false;
    }

    setDateError('');
    return true;
  };

  const validateTime = (showError = true) => {
    if (!data.birthTime) {
      if (showError && timeTouched) {
        setTimeError('Birth time is required for accurate chart calculations');
      }
      return false;
    }
    setTimeError('');
    return true;
  };

  const validateLocation = () => {
    if (!data.birthLocation) {
      setLocationError('Birth location is required');
      return false;
    }
    setLocationError('');
    return true;
  };

  const validateCategories = () => {
    if (data.selectedCategories.length !== 3) {
      setCategoryError('Please select exactly 3 focus areas');
      return false;
    }
    setCategoryError('');
    return true;
  };

  const validateStyle = () => {
    if (!data.interpretationStyle) {
      setStyleError('Please select an interpretation style');
      return false;
    }
    setStyleError('');
    return true;
  };

  // Location search using server-side API route
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/location/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      setLocationSuggestions(data.predictions || []);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setData({ ...data, birthLocation: location });
    setLocationSearch(location.name);
    setLocationSuggestions([]);
    if (locationError) setLocationError('');
  };

  const toggleCategory = (categoryId: string) => {
    const current = data.selectedCategories;
    if (current.includes(categoryId)) {
      setData({ ...data, selectedCategories: current.filter((id) => id !== categoryId) });
    } else if (current.length < 3) {
      setData({ ...data, selectedCategories: [...current, categoryId] });
    }
    if (categoryError) setCategoryError('');
  };

  const selectStyle = (styleId: 'mystical' | 'psychological' | 'practical') => {
    setData({ ...data, interpretationStyle: styleId });
    if (styleError) setStyleError('');
  };

  // Complete onboarding
  const handleComplete = async () => {
    if (!data.birthLocation || !data.interpretationStyle || !profile?.id) {
      return;
    }

    try {
      // Save preferences to Supabase
      console.log('💾 Saving preferences to Supabase...');
      await updatePreferences({
        focusAreas: data.selectedCategories,
        interpretationStyle: data.interpretationStyle,
      });
      console.log('✅ Preferences saved');

      // Save birth data to Supabase
      console.log('💾 Saving birth data to Supabase...');
      await updateBirthData({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        timeUnknown: false,
        birthLocation: data.birthLocation,
        timezone: data.birthLocation.timezone,
      });
      console.log('✅ Birth data saved');

      // Generate natal chart
      console.log('🌟 Generating natal chart...');
      const natalChart = await generateNatalChart(
        data.birthDate,
        data.birthTime,
        data.birthLocation
      );
      console.log('✅ Natal chart generated');

      // Save natal chart to Supabase
      console.log('💾 Saving natal chart to Supabase...');
      await saveNatalChart(
        profile.id,
        natalChart,
        preferences.houseSystem || 'placidus'
      );
      console.log('✅ Natal chart saved to database');

      // Generate today's horoscope
      console.log('🔮 Generating daily horoscope...');
      try {
        await generateHoroscope(natalChart, {
          id: profile.id,
          selectedCategories: data.selectedCategories,
          interpretationStyle: data.interpretationStyle,
          birthDate: data.birthDate,
          birthTime: data.birthTime,
          birthLocation: data.birthLocation,
        });
        console.log('✅ Daily horoscope generated and saved');
      } catch (horoscopeError) {
        console.error('⚠️ Failed to generate horoscope (non-critical):', horoscopeError);
        // Don't block onboarding if horoscope generation fails
      }

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data or generate chart:', error);
      // Still navigate to dashboard even if chart generation fails
      // User can regenerate from profile later
      router.push('/dashboard');
    }
  };

  // Combined validation for date and time
  const validateBirthDateTime = () => {
    const dateValid = validateDate();
    const timeValid = validateTime();
    return dateValid && timeValid;
  };

  // Wizard steps
  const steps: WizardStep[] = [
    {
      id: 'birth-datetime',
      title: 'Birth Info',
      description: 'When were you born?',
      validate: validateBirthDateTime,
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold mb-2">When were you born?</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <DatePicker
                label="DATE"
                value={data.birthDate}
                onChange={(e) => {
                  setData({ ...data, birthDate: e.target.value });
                  setDateTouched(true);
                  if (dateError) setDateError('');
                }}
                onBlur={() => {
                  setDateTouched(true);
                  validateDate();
                }}
                error={dateError}
                required
                autoFocus
              />
            </div>

            <div className="col-span-1">
              <TimePicker
                label="TIME"
                value={data.birthTime}
                onChange={(e) => {
                  setData({ ...data, birthTime: e.target.value });
                  setTimeTouched(true);
                  if (timeError) setTimeError('');
                }}
                onBlur={() => {
                  setTimeTouched(true);
                  validateTime();
                }}
                error={timeError}
                required
              />
            </div>
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
            <h2 className="text-2xl font-serif font-semibold mb-2">Where were you born?</h2>
          </div>

          <div className="relative">
            <Input
              label="Place of Birth"
              type="text"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                searchLocations(e.target.value);
                if (locationError) setLocationError('');
              }}
              error={locationError}
              placeholder="e.g., New York, NY, USA"
              required
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            {/* Location suggestions */}
            {locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {locationSuggestions.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="w-full px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <p className="text-white">{location.name}</p>
                    <p className="text-sm text-secondary">
                      {location.timezone}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'categories',
      title: 'Focus Areas',
      description: 'Select 3 areas',
      validate: validateCategories,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold mb-2">What brings you here?</h2>
            <p className="text-secondary">
              Select 3 areas you'd like to focus on
            </p>
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={cn(
                    'w-10 h-2 rounded-full transition-all duration-300',
                    index < data.selectedCategories.length
                      ? 'bg-primary'
                      : 'bg-surface opacity-30'
                  )}
                />
              ))}
            </div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-3"
          >
            {CATEGORIES.map((category, index) => {
              const isSelected = data.selectedCategories.includes(category.id);
              const isDisabled = !isSelected && data.selectedCategories.length >= 3;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  variants={staggerItem}
                  onClick={() => toggleCategory(category.id)}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-4 rounded-lg border-2 text-left transition-all',
                    'hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-1">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-primary mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-white">
                        {category.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-background" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {categoryError && (
            <p className="text-sm text-error text-center">{categoryError}</p>
          )}
        </div>
      ),
    },
    {
      id: 'style',
      title: 'Reading Style',
      description: 'Choose your style',
      validate: validateStyle,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-semibold mb-2">Choose your style</h2>
            <p className="text-secondary">
              How would you like your readings delivered?
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {INTERPRETATION_STYLES.map((style) => {
              const isSelected = data.interpretationStyle === style.id;

              return (
                <motion.button
                  key={style.id}
                  type="button"
                  variants={staggerItem}
                  onClick={() => selectStyle(style.id)}
                  className={cn(
                    'relative w-full p-5 rounded-lg border-2 text-left transition-all',
                    'hover:border-primary/50',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-lg',
                      isSelected ? 'bg-primary/20 text-white' : 'bg-surface text-white'
                    )}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-primary mb-2">
                        {style.name}
                      </h3>
                      <p className="text-sm text-white">
                        {style.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-background" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {styleError && (
            <p className="text-sm text-error text-center">{styleError}</p>
          )}
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
            <h2 className="text-2xl font-serif font-semibold mb-2">Almost There!</h2>
            <p className="text-secondary">
              Review your information before we create your cosmic profile
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {/* Birth Info */}
            <div className="p-5">
              <h3 className="text-sm font-medium text-secondary mb-3">Birth Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Date</p>
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
                    <p className="text-sm text-secondary">Time</p>
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
                    <p className="text-sm text-secondary">Location</p>
                    <p className="font-medium">{data.birthLocation?.name || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-5">
              <h3 className="text-sm font-medium text-secondary mb-3">Your Preferences</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-secondary mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {data.selectedCategories.map((catId) => {
                      const category = CATEGORIES.find((c) => c.id === catId);
                      return category ? (
                        <span
                          key={catId}
                          className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary"
                        >
                          {category.icon} {category.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-secondary mb-2">Reading Style</p>
                  <div className="flex items-center gap-2">
                    {data.interpretationStyle && (
                      <>
                        {INTERPRETATION_STYLES.find((s) => s.id === data.interpretationStyle)?.icon}
                        <span className="font-medium capitalize">
                          {data.interpretationStyle}
                        </span>
                      </>
                    )}
                  </div>
                </div>
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold font-serif text-white">
          Ouros
        </h1>
      </div>

      {/* Wizard Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={transitions.spring}
          className="w-full max-w-2xl"
        >
          <StepWizard
            steps={steps}
            onComplete={handleComplete}
            onCancel={() => router.push('/login')}
            showStepIndicator={false}
          />
        </motion.div>
      </div>
    </div>
  );
}
