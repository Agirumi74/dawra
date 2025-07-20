import { BANSuggestion, Address } from '../types';

export interface BANSearchResult {
  features: BANSuggestion[];
  query: string;
  type: 'search';
  version: string;
  attribution: string;
  licence: string;
  limit: number;
}

export class BANApiService {
  private static readonly BASE_URL = 'https://api-adresse.data.gouv.fr';
  private static readonly SEARCH_ENDPOINT = '/search/';
  private static readonly DELAY_MS = 300;
  private static debounceTimer: number | null = null;

  /**
   * Recherche d'adresses via l'API BAN
   * @param query Texte de recherche
   * @param limit Nombre maximum de résultats (défaut: 10)
   * @param postcode Code postal pour filtrer les résultats (optionnel)
   * @returns Promise<BANSuggestion[]>
   */
  static async searchAddresses(query: string, limit: number = 10, postcode?: string): Promise<BANSuggestion[]> {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: limit.toString(),
        type: 'housenumber'
      });

      // Ajouter le filtre par code postal si fourni
      if (postcode) {
        params.append('postcode', postcode);
      }

      const url = `${this.BASE_URL}${this.SEARCH_ENDPOINT}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dawra-AddressSearch/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`BAN API error: ${response.status} ${response.statusText}`);
      }

      const data: BANSearchResult = await response.json();
      
      // Filtrer et trier les résultats par score
      return data.features
        .filter(feature => feature.properties.score >= 0.5) // Seuil de pertinence minimum
        .sort((a, b) => b.properties.score - a.properties.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Erreur lors de la recherche BAN:', error);
      return [];
    }
  }

  /**
   * Recherche avec debounce pour éviter trop d'appels API
   * @param query Texte de recherche
   * @param limit Nombre maximum de résultats
   * @param postcode Code postal optionnel
   * @returns Promise<BANSuggestion[]>
   */
  static async searchAddressesDebounced(query: string, limit: number = 10, postcode?: string): Promise<BANSuggestion[]> {
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        const results = await this.searchAddresses(query, limit, postcode);
        resolve(results);
      }, this.DELAY_MS);
    });
  }

  /**
   * Convertit une suggestion BAN en objet Address
   * @param banSuggestion Suggestion de l'API BAN
   * @returns Address
   */
  static banSuggestionToAddress(banSuggestion: BANSuggestion): Address {
    const props = banSuggestion.properties;
    const [lng, lat] = banSuggestion.geometry.coordinates;

    return {
      id: `ban_${props.postcode}_${props.housenumber || ''}_${props.street || ''}`.replace(/\s+/g, '_'),
      street_number: props.housenumber || '',
      street_name: props.street || '',
      postal_code: props.postcode,
      city: props.city,
      country: 'France',
      full_address: props.label,
      coordinates: {
        lat: lat,
        lng: lng
      }
    };
  }

  /**
   * Normalise le texte pour la recherche (supprime accents, ponctuation, etc.)
   * @param text Texte à normaliser
   * @returns Texte normalisé
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .replace(/\s+/g, ' ') // Normaliser les espaces multiples
      .trim();
  }

  /**
   * Vérifie si le service BAN est disponible
   * @returns Promise<boolean>
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'HEAD',
        timeout: 5000
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Recherche d'adresses avec gestion de la résilience
   * Essaie plusieurs fois en cas d'échec
   * @param query Texte de recherche
   * @param limit Nombre maximum de résultats
   * @param postcode Code postal optionnel
   * @param retries Nombre de tentatives (défaut: 2)
   * @returns Promise<BANSuggestion[]>
   */
  static async searchAddressesWithRetry(
    query: string, 
    limit: number = 10, 
    postcode?: string, 
    retries: number = 2
  ): Promise<BANSuggestion[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const results = await this.searchAddresses(query, limit, postcode);
        return results;
      } catch (error) {
        lastError = error as Error;
        
        // Attendre un peu avant la prochaine tentative
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error(`Échec de la recherche BAN après ${retries + 1} tentatives:`, lastError);
    return [];
  }

  /**
   * Recherche par géolocalisation (reverse geocoding)
   * @param lat Latitude
   * @param lng Longitude
   * @returns Promise<BANSuggestion[]>
   */
  static async reverseGeocode(lat: number, lng: number): Promise<BANSuggestion[]> {
    try {
      const params = new URLSearchParams({
        lon: lng.toString(),
        lat: lat.toString(),
        type: 'housenumber'
      });

      const url = `${this.BASE_URL}/reverse/?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dawra-AddressSearch/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`BAN reverse API error: ${response.status} ${response.statusText}`);
      }

      const data: BANSearchResult = await response.json();
      return data.features || [];

    } catch (error) {
      console.error('Erreur lors du géocodage inverse BAN:', error);
      return [];
    }
  }
}