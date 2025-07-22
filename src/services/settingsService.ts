interface AppSettings {
  geminiApiKey: string;
  cameraResolution: '480p' | '720p' | '1080p';
  ocrTimeout: number;
  cameraFacing: 'environment' | 'user';
}

interface ResolutionConfig {
  width: number;
  height: number;
}

class SettingsService {
  private settings: AppSettings;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.setupStorageListener();
  }

  private loadSettings(): AppSettings {
    try {
      return {
        geminiApiKey: localStorage.getItem('gemini_api_key') || '',
        cameraResolution: (localStorage.getItem('camera_resolution') as '480p' | '720p' | '1080p') || '720p',
        ocrTimeout: parseInt(localStorage.getItem('ocr_timeout') || '30'),
        cameraFacing: (localStorage.getItem('camera_facing') as 'environment' | 'user') || 'environment'
      };
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): AppSettings {
    return {
      geminiApiKey: '',
      cameraResolution: '720p',
      ocrTimeout: 30,
      cameraFacing: 'environment'
    };
  }

  private setupStorageListener() {
    // Listen for settings changes from other components
    window.addEventListener('settingsUpdated', () => {
      const newSettings = this.loadSettings();
      this.settings = newSettings;
      this.notifyListeners();
    });
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  public updateSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners();
  }

  public updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
    this.notifyListeners();
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('gemini_api_key', this.settings.geminiApiKey);
      localStorage.setItem('camera_resolution', this.settings.cameraResolution);
      localStorage.setItem('ocr_timeout', this.settings.ocrTimeout.toString());
      localStorage.setItem('camera_facing', this.settings.cameraFacing);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  }

  public subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  // Helper methods for specific settings
  public getCameraConstraints(): MediaStreamConstraints {
    const resolution = this.getResolutionConfig(this.settings.cameraResolution);
    
    return {
      video: {
        facingMode: this.settings.cameraFacing,
        width: { ideal: resolution.width },
        height: { ideal: resolution.height }
      }
    };
  }

  private getResolutionConfig(resolution: '480p' | '720p' | '1080p'): ResolutionConfig {
    const configs: Record<string, ResolutionConfig> = {
      '480p': { width: 640, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 }
    };
    
    return configs[resolution] || configs['720p'];
  }

  public hasValidApiKey(): boolean {
    return this.settings.geminiApiKey.trim().length > 0;
  }

  public getOcrTimeoutMs(): number {
    return this.settings.ocrTimeout * 1000;
  }

  // Method to validate if required settings are configured
  public isConfigurationValid(): boolean {
    return this.hasValidApiKey();
  }

  public getConfigurationErrors(): string[] {
    const errors: string[] = [];
    
    if (!this.hasValidApiKey()) {
      errors.push('Clé API Gemini non configurée');
    }
    
    if (this.settings.ocrTimeout < 10 || this.settings.ocrTimeout > 60) {
      errors.push('Timeout OCR doit être entre 10 et 60 secondes');
    }
    
    return errors;
  }

  // Reset to default settings
  public resetToDefaults(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    this.notifyListeners();
  }

  // Export settings for backup
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import settings from backup
  public importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson) as AppSettings;
      
      // Validate imported settings
      if (this.isValidSettingsObject(importedSettings)) {
        this.updateSettings(importedSettings);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'import des paramètres:', error);
      return false;
    }
  }

  private isValidSettingsObject(obj: unknown): obj is AppSettings {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Record<string, unknown>).geminiApiKey === 'string' &&
      ['480p', '720p', '1080p'].includes((obj as Record<string, unknown>).cameraResolution as string) &&
      typeof (obj as Record<string, unknown>).ocrTimeout === 'number' &&
      ['environment', 'user'].includes((obj as Record<string, unknown>).cameraFacing as string)
    );
  }
}

// Create singleton instance
export const settingsService = new SettingsService();

// Export types for use in components
export type { AppSettings, ResolutionConfig };