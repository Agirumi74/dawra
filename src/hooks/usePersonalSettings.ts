import { useState, useEffect } from 'react';
import { DEFAULT_TRUCK_LOCATIONS } from '../constants/locations';
import { TruckLocation } from '../types';

export interface PersonalSettings {
  truckLocations: TruckLocation[];
  defaultLocation?: string;
  driverName?: string;
  vehicleNumber?: string;
  customConstants: Record<string, string | number>;
}

const DEFAULT_PERSONAL_SETTINGS: PersonalSettings = {
  truckLocations: DEFAULT_TRUCK_LOCATIONS,
  defaultLocation: 'middle-right',
  driverName: '',
  vehicleNumber: '',
  customConstants: {}
};

const PERSONAL_SETTINGS_KEY = 'dawra_personal_settings';

export const usePersonalSettings = () => {
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings>(DEFAULT_PERSONAL_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSONAL_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new fields are available
        const merged = {
          ...DEFAULT_PERSONAL_SETTINGS,
          ...parsed,
          truckLocations: [
            ...DEFAULT_TRUCK_LOCATIONS,
            ...(parsed.truckLocations?.filter((loc: TruckLocation) => loc.isCustom) || [])
          ]
        };
        setPersonalSettings(merged);
      }
    } catch (error) {
      console.warn('Failed to load personal settings from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage when they change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(PERSONAL_SETTINGS_KEY, JSON.stringify(personalSettings));
    } catch (error) {
      console.warn('Failed to save personal settings to localStorage:', error);
    }
  }, [personalSettings, isInitialized]);

  const updatePersonalSettings = (newSettings: Partial<PersonalSettings>) => {
    setPersonalSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const addTruckLocation = (name: string, color: string = 'blue') => {
    const newLocation: TruckLocation = {
      id: `custom-${Date.now()}`,
      name,
      color,
      isDefault: false,
      isCustom: true
    };

    setPersonalSettings(prev => ({
      ...prev,
      truckLocations: [...prev.truckLocations, newLocation]
    }));

    return newLocation.id;
  };

  const removeTruckLocation = (locationId: string) => {
    setPersonalSettings(prev => ({
      ...prev,
      truckLocations: prev.truckLocations.filter(loc => 
        loc.id !== locationId || !loc.isCustom // Only allow removing custom locations
      )
    }));
  };

  const updateTruckLocation = (locationId: string, updates: Partial<TruckLocation>) => {
    setPersonalSettings(prev => ({
      ...prev,
      truckLocations: prev.truckLocations.map(loc =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      )
    }));
  };

  const setDefaultLocation = (locationId: string) => {
    updatePersonalSettings({ defaultLocation: locationId });
  };

  const setCustomConstant = (key: string, value: string | number) => {
    setPersonalSettings(prev => ({
      ...prev,
      customConstants: {
        ...prev.customConstants,
        [key]: value
      }
    }));
  };

  const removeCustomConstant = (key: string) => {
    setPersonalSettings(prev => ({
      ...prev,
      customConstants: Object.fromEntries(
        Object.entries(prev.customConstants).filter(([k]) => k !== key)
      )
    }));
  };

  const resetToDefaults = () => {
    setPersonalSettings(DEFAULT_PERSONAL_SETTINGS);
  };

  return {
    personalSettings,
    updatePersonalSettings,
    addTruckLocation,
    removeTruckLocation,
    updateTruckLocation,
    setDefaultLocation,
    setCustomConstant,
    removeCustomConstant,
    resetToDefaults,
    isInitialized
  };
};