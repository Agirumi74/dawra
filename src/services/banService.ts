import { Address, AddressSuggestion } from '../types';

export interface BANSuggestion {
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    postcode: string;
    city: string;
    context: string;
    type: string;
    importance: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

export class BANService {
  private static readonly BAN_URL = 'https://api-adresse.data.gouv.fr';
  private static readonly DELAY_MS = 300;
  private static debounceTimer: number | null = null;

  // Recherche d'adresses avec la BAN
  static async searchAddresses(query: string, postcode?: string, limit: number = 10): Promise<BANSuggestion[]> {
    if (query.length < 2) return [];

    try {
      let url = `${this.BAN_URL}/search/?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      if (postcode) {
        url += `&postcode=${encodeURIComponent(postcode)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('BAN API error');

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('BAN search error:', error);
      return [];
    }
  }

  // Recherche avec debounce
  static async searchAddressesDebounced(query: string, postcode?: string): Promise<BANSuggestion[]> {
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        const results = await this.searchAddresses(query, postcode);
        resolve(results);
      }, this.DELAY_MS);
    });
  }

  // Recherche de villes avec debounce
  static async searchCitiesByPostcodeDebounced(postcode: string): Promise<BANSuggestion[]> {
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        const results = await this.searchCitiesByPostcode(postcode);
        resolve(results);
      }, this.DELAY_MS);
    });
  }

  // Recherche de villes par code postal
  static async searchCitiesByPostcode(postcode: string): Promise<BANSuggestion[]> {
    if (postcode.length < 2) return [];

    try {
      const url = `${this.BAN_URL}/search/?q=${encodeURIComponent(postcode)}&type=municipality&limit=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('BAN API error');

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('BAN cities search error:', error);
      return [];
    }
  }

  // Convertir une suggestion BAN en Address
  static parseBANSuggestion(suggestion: BANSuggestion): Address {
    const props = suggestion.properties;
    return {
      id: Date.now().toString(),
      street_number: props.housenumber || '',
      street_name: props.street || '',
      postal_code: props.postcode || '',
      city: props.city || '',
      country: 'France',
      full_address: props.label,
      coordinates: {
        lat: suggestion.geometry.coordinates[1],
        lng: suggestion.geometry.coordinates[0]
      }
    };
  }

  // Formater une adresse pour l'affichage
  static formatAddress(address: Address): string {
    const parts = [];
    if (address.street_number) parts.push(address.street_number);
    if (address.street_name) parts.push(address.street_name);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.city) parts.push(address.city);
    return parts.join(' ');
  }

  // Géocoder une adresse complète
  static async geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
    if (address.coordinates) return address.coordinates;

    const query = this.formatAddress(address);
    try {
      const results = await this.searchAddresses(query, address.postal_code, 1);
      if (results.length > 0) {
        const coords = results[0].geometry.coordinates;
        return {
          lat: coords[1],
          lng: coords[0]
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}