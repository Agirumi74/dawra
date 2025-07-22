interface BasicOCRResult {
  address: string;
  confidence: number;
  success: boolean;
  error?: string;
}

/**
 * Basic OCR service that works without external APIs
 * Uses browser APIs and pattern matching for simple address extraction
 */
export class BasicOCRService {
  /**
   * Extract address from image using basic techniques
   */
  async extractAddressFromImage(imageData: string): Promise<BasicOCRResult> {
    try {
      // Convert image data to canvas for processing
      const canvas = await this.imageDataToCanvas(imageData);
      const context = canvas.getContext('2d');
      
      if (!context) {
        return {
          address: '',
          confidence: 0,
          success: false,
          error: 'Impossible d\'analyser l\'image'
        };
      }

      // For now, return a fallback result indicating manual entry is needed
      // In a real implementation, this could use techniques like:
      // - Canvas text analysis
      // - Edge detection for text regions
      // - Simple pattern matching
      // - Browser's experimental text detection APIs if available
      
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'OCR basique non disponible - saisie manuelle recommandée'
      };
      
    } catch (error) {
      console.error('Erreur OCR basique:', error);
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'Erreur lors de l\'analyse de l\'image'
      };
    }
  }

  /**
   * Process image from canvas element
   */
  async processImageFromCanvas(canvas: HTMLCanvasElement): Promise<BasicOCRResult> {
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      return await this.extractAddressFromImage(imageData);
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image depuis canvas:', error);
      return {
        address: '',
        confidence: 0,
        success: false,
        error: 'Erreur lors du traitement de l\'image capturée'
      };
    }
  }

  /**
   * Check if the service can extract text from images
   * For basic OCR, this could check for experimental browser APIs
   */
  isSupported(): boolean {
    // Check if we have canvas support (minimum requirement)
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  /**
   * Get status of the basic OCR service
   */
  getStatus(): { ready: boolean; error?: string } {
    if (!this.isSupported()) {
      return {
        ready: false,
        error: 'OCR basique non supporté par ce navigateur'
      };
    }

    return { ready: true };
  }

  /**
   * Convert image data URL to canvas
   */
  private async imageDataToCanvas(imageData: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        
        resolve(canvas);
      };
      
      image.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };
      
      image.src = imageData;
    });
  }

  /**
   * Future enhancement: Use experimental browser text detection APIs
   * This is a placeholder for when browser support improves
   */
  private async tryExperimentalTextDetection(canvas: HTMLCanvasElement): Promise<string[]> {
    // Check for experimental text detection APIs
    if ('BarcodeDetector' in window) {
      // Could potentially use similar APIs for text detection in the future
      // For now, return empty array
    }
    
    return [];
  }

  /**
   * Simple pattern matching for common address patterns
   */
  private extractAddressPatterns(text: string): string[] {
    const patterns = [
      // French address patterns
      /\d+\s+(?:rue|avenue|boulevard|place|chemin|impasse|allée|cours|quai)\s+[^,]+,?\s*\d{5}\s+[a-zA-ZÀ-ÿ\s]+/gi,
      // Postal code patterns
      /\d{5}\s+[a-zA-ZÀ-ÿ\s]+/gi,
      // Street patterns
      /\d+\s+[a-zA-ZÀ-ÿ\s]+(?:rue|avenue|boulevard|place|chemin|impasse|allée|cours|quai)/gi
    ];

    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });

    return matches;
  }
}

export const basicOCR = new BasicOCRService();