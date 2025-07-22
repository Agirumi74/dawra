import { useState, useEffect } from 'react';

interface VoiceSettings {
  speechRecognitionEnabled: boolean;
  textToSpeechEnabled: boolean;
  voiceEnabled: boolean; // Master toggle
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  speechRecognitionEnabled: false, // Disabled by default for better reliability
  textToSpeechEnabled: false, // Disabled by default for better reliability
  voiceEnabled: false, // Master toggle disabled by default
};

const VOICE_SETTINGS_KEY = 'dawra_voice_settings';

export const useVoiceSettings = () => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setVoiceSettings({ ...DEFAULT_VOICE_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load voice settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
    } catch (error) {
      console.warn('Failed to save voice settings to localStorage:', error);
    }
  }, [voiceSettings]);

  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const toggleVoiceEnabled = () => {
    updateVoiceSettings({ voiceEnabled: !voiceSettings.voiceEnabled });
  };

  const toggleSpeechRecognition = () => {
    updateVoiceSettings({ speechRecognitionEnabled: !voiceSettings.speechRecognitionEnabled });
  };

  const toggleTextToSpeech = () => {
    updateVoiceSettings({ textToSpeechEnabled: !voiceSettings.textToSpeechEnabled });
  };

  const resetToDefaults = () => {
    setVoiceSettings(DEFAULT_VOICE_SETTINGS);
  };

  return {
    voiceSettings,
    updateVoiceSettings,
    toggleVoiceEnabled,
    toggleSpeechRecognition,
    toggleTextToSpeech,
    resetToDefaults,
  };
};