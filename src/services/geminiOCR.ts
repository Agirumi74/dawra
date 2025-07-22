import { settingsService } from './settingsService';

interface OCRResult {
  address: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export class GeminiOCRService {
  private model: unknown = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
    // Listen for settings changes to reinitialize the service
    settingsService.subscribe(() => {
      this.initializeService();
    });
  }

  private async initializeService() {
    try {
      const apiKey = settingsService.getSetting('geminiApiKey');
      
      if (!apiKey || apiKey.trim().length === 0) {
        console.error('❌ Clé API Gemini non configurée. Veuillez configurer la clé API dans les paramètres.');
        this.isInitialized = false;
        return;
      }

      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use Gemini 2.0 Flash Experimental model
        this.model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash-exp",
          generationConfig: {
            temperature: 0.1, // Lower temperature for more consistent OCR results
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 256, // Limit output for address extraction
          },
        });
        
        this.isInitialized = true;
        console.log('✅ Service OCR Gemini 2.0 Flash initialisé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'API Gemini:', error);
        this.isInitialized = false;
        throw new Error('Impossible d\'initialiser l\'API Gemini. Vérifiez votre clé API.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service OCR:', error);
      this.isInitialized = false;
    }
  }

  async extractAddressFromImage(imageData: string): Promise<OCRResult> {
    if (!this.isInitialized || !this.model) {
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'Service OCR non initialisé. Vérifiez la configuration de la clé API Gemini dans les paramètres.'
      };
    }

    try {
      return await this.extractWithGeminiAPI(imageData);
    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction OCR:', error);
      return {
        address: '',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse OCR'
      };
    }
  }

  private async extractWithGeminiAPI(imageData: string): Promise<OCRResult> {
    try {
      const timeout = settingsService.getOcrTimeoutMs();
      
      const prompt = `
        Analysez cette image d'étiquette de colis et extrayez UNIQUEMENT l'adresse de livraison principale.

        Instructions strictes :
        1. Identifiez l'adresse de destination du destinataire (PAS l'expéditeur)
        2. Extrayez : numéro de rue + nom de rue + code postal + ville
        3. Format de sortie : "123 Rue de la Paix, 75001 Paris"
        4. Si l'adresse est illisible ou incomplète, répondez exactement : "ADRESSE_ILLISIBLE"
        5. Ignorez tous les autres textes (codes-barres, numéros de suivi, noms, etc.)
        6. Ne fournissez QUE l'adresse, sans aucun texte supplémentaire

        Répondez uniquement avec l'adresse de livraison ou "ADRESSE_ILLISIBLE".
      `;

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };

      // Create a promise that will timeout
      const extractionPromise = this.model.generateContent([prompt, imagePart]);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout OCR dépassé')), timeout);
      });

      const result = await Promise.race([extractionPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text().trim();
      
      // Validate the response
      if (text === "ADRESSE_ILLISIBLE" || text.length < 5) {
        return {
          address: '',
          confidence: 0,
          success: false,
          error: 'Adresse illisible ou non trouvée dans l\'image'
        };
      }

      // Basic validation of address format
      if (!this.isValidAddressFormat(text)) {
        return {
          address: '',
          confidence: 0,
          success: false,
          error: 'Format d\'adresse invalide détecté'
        };
      }

      // Calculate confidence based on response quality
      const confidence = this.calculateConfidence(text);
      
      return {
        address: text,
        confidence: confidence,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Erreur API Gemini:', error);
      
      if (error instanceof Error && error.message.includes('Timeout')) {
        throw new Error('Le temps d\'analyse a dépassé la limite configurée. Essayez avec une image plus nette.');
      }
      
      throw new Error('Erreur lors de l\'analyse de l\'image. Vérifiez votre connexion et votre clé API.');
    }
  }

  private isValidAddressFormat(text: string): boolean {
    // Basic checks for valid address
    const hasNumbers = /\d+/.test(text);
    const hasStreetWords = /\b(rue|avenue|boulevard|place|chemin|impasse|allée|cours|quai)\b/i.test(text);
    const hasPostalCode = /\b\d{5}\b/.test(text);
    const isReasonableLength = text.length >= 10 && text.length <= 200;
    
    return hasNumbers && hasStreetWords && hasPostalCode && isReasonableLength;
  }

  private calculateConfidence(text: string): number {
    let confidence = 0.5; // Base confidence
    
    // Check for common address patterns
    if (/\d+/.test(text)) confidence += 0.2; // Contains numbers (street number/postal code)
    if (/\b(rue|avenue|boulevard|place|chemin|impasse|allée|cours|quai)\b/i.test(text)) confidence += 0.2; // Contains street type
    if (/\b\d{5}\b/.test(text)) confidence += 0.1; // Contains 5-digit postal code
    if (text.length > 20 && text.length < 100) confidence += 0.1; // Reasonable length
    if (/[A-Za-z]{2,}/.test(text)) confidence += 0.05; // Contains meaningful words
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }

  // Method to process image from canvas
  async processImageFromCanvas(canvas: HTMLCanvasElement): Promise<OCRResult> {
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9); // Higher quality for OCR
      return await this.extractAddressFromImage(imageData);
    } catch (error) {
      console.error('❌ Erreur lors du traitement de l\'image depuis canvas:', error);
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'Erreur lors du traitement de l\'image capturée'
      };
    }
  }

  // Check if service is properly configured and ready
  isReady(): boolean {
    return this.isInitialized && this.model !== null && settingsService.hasValidApiKey();
  }

  // Get current configuration status
  getStatus(): { ready: boolean; error?: string } {
    if (!settingsService.hasValidApiKey()) {
      return {
        ready: false,
        error: 'Clé API Gemini non configurée'
      };
    }

    if (!this.isInitialized || !this.model) {
      return {
        ready: false,
        error: 'Service non initialisé'
      };
    }

    return { ready: true };
  }

  // Force reinitialize the service (useful after settings changes)
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.model = null;
    await this.initializeService();
  }
}

export const geminiOCR = new GeminiOCRService();