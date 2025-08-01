import { basicOCR } from './basicOCR';
import { geminiOCR } from './geminiOCR';
import { settingsService } from './settingsService';

interface UnifiedOCRResult {
  address: string;
  confidence: number;
  success: boolean;
  error?: string;
  method?: 'basic' | 'gemini' | 'none';
}

/**
 * Unified OCR service that combines basic OCR and Gemini OCR
 * Uses basic OCR first, then falls back to Gemini if available and needed
 */
export class UnifiedOCRService {
  /**
   * Extract address from image using best available method
   */
  async extractAddressFromImage(imageData: string): Promise<UnifiedOCRResult> {
    let result: UnifiedOCRResult;

    // Step 1: Try basic OCR first (always available, no API key needed)
    try {
      const basicResult = await basicOCR.extractAddressFromImage(imageData);
      
      if (basicResult.success && basicResult.address && basicResult.confidence > 0.5) {
        return {
          ...basicResult,
          method: 'basic'
        };
      }
      
      // Basic OCR didn't find a good result, continue to Gemini
      console.log('OCR basique n\'a pas trouvé d\'adresse fiable, tentative avec Gemini...');
      
    } catch (error) {
      console.warn('Erreur OCR basique:', error);
    }

    // Step 2: Try Gemini OCR if available and configured
    const geminiStatus = geminiOCR.getStatus();
    
    if (geminiStatus.ready) {
      try {
        const geminiResult = await geminiOCR.extractAddressFromImage(imageData);
        
        if (geminiResult.success && geminiResult.address) {
          return {
            ...geminiResult,
            method: 'gemini'
          };
        } else {
          // Gemini failed, return its error but indicate it was tried
          result = {
            address: '',
            confidence: 0,
            success: false,
            error: geminiResult.error || 'Aucune adresse trouvée avec Gemini OCR',
            method: 'gemini'
          };
        }
        
      } catch (error) {
        console.error('Erreur Gemini OCR:', error);
        result = {
          address: '',
          confidence: 0,
          success: false,
          error: 'Erreur lors de l\'analyse Gemini',
          method: 'gemini'
        };
      }
    } else {
      // Gemini not available
      result = {
        address: '',
        confidence: 0,
        success: false,
        error: 'Adresse non détectée automatiquement. Saisie manuelle recommandée.',
        method: 'none'
      };
    }

    return result;
  }

  /**
   * Process image from canvas element
   */
  async processImageFromCanvas(canvas: HTMLCanvasElement): Promise<UnifiedOCRResult> {
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      return await this.extractAddressFromImage(imageData);
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image depuis canvas:', error);
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'Erreur lors du traitement de l\'image capturée',
        method: 'none'
      };
    }
  }

  /**
   * Check what OCR methods are available
   */
  getAvailableMethods(): { basic: boolean; gemini: boolean } {
    return {
      basic: basicOCR.isSupported(),
      gemini: geminiOCR.isReady()
    };
  }

  /**
   * Get overall status of OCR capabilities
   */
  getStatus(): { ready: boolean; methods: string[]; warnings: string[] } {
    const methods: string[] = [];
    const warnings: string[] = [];
    
    // Check basic OCR
    if (basicOCR.isSupported()) {
      methods.push('OCR basique (navigateur)');
    } else {
      warnings.push('OCR basique non supporté');
    }
    
    // Check Gemini OCR
    const geminiStatus = geminiOCR.getStatus();
    if (geminiStatus.ready) {
      methods.push('Gemini AI OCR');
    } else if (settingsService.hasValidApiKey()) {
      warnings.push('Gemini OCR configuré mais non initialisé');
    } else {
      // Don't show this as a warning since Gemini is optional
      methods.push('Gemini AI OCR (optionnel, non configuré)');
    }
    
    return {
      ready: methods.length > 0,
      methods,
      warnings
    };
  }

  /**
   * Check if any OCR method is available
   */
  isReady(): boolean {
    const available = this.getAvailableMethods();
    return available.basic || available.gemini;
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    const status = this.getStatus();
    
    if (status.methods.length === 0) {
      return 'Aucune méthode OCR disponible';
    }
    
    const mainMethods = status.methods.filter(m => !m.includes('optionnel'));
    
    if (mainMethods.length === 0) {
      return 'Seule la saisie manuelle est disponible';
    }
    
    return `Méthodes disponibles: ${mainMethods.join(', ')}`;
  }

  /**
   * Force reinitialize Gemini if needed
   */
  async reinitializeGemini(): Promise<void> {
    try {
      await geminiOCR.reinitialize();
    } catch (error) {
      console.warn('Impossible de réinitialiser Gemini OCR:', error);
    }
  }
}

export const unifiedOCR = new UnifiedOCRService();