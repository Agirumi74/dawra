import { AddressSuggestion, Address } from '../types';

export class AddressService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
  private static readonly DELAY_MS = 300;
  private static debounceTimer: number | null = null;

  static async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    if (query.length < 3) return [];

    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/search?format=json&addressdetails=1&limit=10&countrycodes=fr&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      // Filtrer par département (code postal)
      const allowedPrefixes = ['69', '74', '01', '73'];
      return data.filter((item: any) => {
        const cp = item.address?.postcode || '';
        return item.address?.road && cp && allowedPrefixes.some(prefix => cp.startsWith(prefix));
      });
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }

  static async searchAddressesDebounced(query: string): Promise<AddressSuggestion[]> {
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        const results = await this.searchAddresses(query);
        resolve(results);
      }, this.DELAY_MS);
    });
  }

  static parseAddress(suggestion: AddressSuggestion): Address {
    const addr = suggestion.address;
    const a = addr as any;
    return {
      id: Date.now().toString(),
      street_number: addr.house_number || '',
      street_name: addr.road || '',
      postal_code: addr.postcode || '',
      city: addr.city || a.town || a.village || '',
      country: addr.country || 'France',
      full_address: suggestion.display_name,
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      }
    };
  }

  static formatAddress(address: Address): string {
  const parts = [];
  if (address.street_number) parts.push(address.street_number);
  if (address.street_name) parts.push(address.street_name);
  if (address.postal_code) parts.push(address.postal_code);
  if (address.city) parts.push(address.city);
  // On ignore le pays et le département
  return parts.join(' ');
  }

  static async geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
    if (address.coordinates) return address.coordinates;

    const query = this.formatAddress(address);
    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}