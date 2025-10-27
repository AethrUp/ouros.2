'use client';

import { useState, useEffect } from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { Modal, Button, Input, DatePicker, TimePicker, LoadingScreen } from '@/components/ui';
import { useAppStore } from '@/store';
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

interface SavedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedChartModal({ isOpen, onClose }: SavedChartModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState<LocationData | null>(null);

  // Location search
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { createSavedChart, generateNatalChart } = useAppStore();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setRelationship('');
      setBirthDate('');
      setBirthTime('');
      setBirthLocation(null);
      setLocationSearch('');
      setLocationSuggestions([]);
      setErrors({});
    }
  }, [isOpen]);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/location/search?query=${encodeURIComponent(query)}`);

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

  useEffect(() => {
    const debounce = setTimeout(() => {
      // Only search if we're typing AND don't have a selected location
      // If we have a selected location and the search matches it, don't search again
      if (locationSearch && !birthLocation) {
        searchLocations(locationSearch);
      } else if (locationSearch && birthLocation && locationSearch !== birthLocation.name) {
        // User is editing after selection - clear the selection and search
        setBirthLocation(null);
        searchLocations(locationSearch);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [locationSearch, birthLocation]);

  const handleLocationSelect = (location: LocationData) => {
    setBirthLocation(location);
    setLocationSearch(location.name);
    setLocationSuggestions([]);
    setErrors((prev) => ({ ...prev, location: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const date = new Date(birthDate);
      const today = new Date();
      if (date > today) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    if (!birthTime) {
      newErrors.birthTime = 'Birth time is required for accurate chart calculations';
    }

    if (!birthLocation) {
      newErrors.location = 'Birth location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !birthLocation) return;

    setLoading(true);
    setIsGenerating(true);

    try {
      // Generate natal chart
      const natalChart = await generateNatalChart(birthDate, birthTime, birthLocation);

      // Create saved chart
      await createSavedChart(
        name,
        {
          birthDate: birthDate,
          birthTime: birthTime,
          timeUnknown: false,
          birthLocation: birthLocation,
          timezone: birthLocation.timezone,
        },
        natalChart,
        {
          relationship: relationship || undefined,
          isPublic: false,
        }
      );

      // Close modal on success
      onClose();
    } catch (error) {
      console.error('Failed to create saved chart:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create chart',
      });
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isGenerating}
        onClose={onClose}
        title="Create Saved Chart"
        description="Add a chart for someone who doesn't use the app"
        size="medium"
      >
        <div className="space-y-6">
          {/* Name */}
          <div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="Name"
              error={errors.name}
            />
          </div>

          {/* Relationship (Optional) */}
          <div>
            <Input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Relationship (e.g. Partner, Friend, Crush, Ex)"
            />
          </div>

          {/* Birth Date */}
          <div>
            <DatePicker
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setErrors((prev) => ({ ...prev, birthDate: '' }));
              }}
              placeholder="Birth date"
            />
            {errors.birthDate && (
              <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>
            )}
          </div>

          {/* Birth Time */}
          <div>
            <TimePicker
              value={birthTime}
              onChange={(e) => {
                setBirthTime(e.target.value);
                setErrors((prev) => ({ ...prev, birthTime: '' }));
              }}
              placeholder="Birth time"
            />
            {errors.birthTime && (
              <p className="text-xs text-red-500 mt-1">{errors.birthTime}</p>
            )}
          </div>

          {/* Birth Location */}
          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  if (!e.target.value) {
                    setBirthLocation(null);
                  }
                }}
                placeholder="BIRTH LOCATION"
                className={cn(
                  'flex h-14 w-full rounded-lg pl-10 pr-4 py-4 mb-4',
                  'text-base text-white placeholder:text-white/50 placeholder:uppercase placeholder:tracking-wide placeholder:text-sm',
                  'bg-[#141414]',
                  'border-0',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  'transition-all duration-200',
                  errors.location && 'ring-2 ring-red-500 focus:ring-red-500'
                )}
              />

              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Dropdown suggestions - appears above */}
              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bottom-full mb-2 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {locationSuggestions.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-3 text-left hover:bg-surface transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{location.name}</p>
                          {(location.region || location.country) && (
                            <p className="text-xs text-secondary mt-0.5">
                              {[location.region, location.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              Create Chart
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generating Chart Loading Screen */}
      {isGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl text-white mb-2">Generating Chart</h3>
            <p className="text-secondary mb-4">
              Calculating planetary positions and aspects for {name}...
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
