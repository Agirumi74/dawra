import { Address } from '../types';

export interface CSVAddress {
  id: string;
  numero: string;
  nom_voie: string;
  code_postal: string;
  nom_commune: string;
  lon: number;
  lat: number;
  libelle_acheminement: string;
  nom_afnor: string;
}

export interface CSVLieuDit {
  id: string;
  nom_lieu_dit: string;
  code_postal: string;
  nom_commune: string;
  lon: number;
  lat: number;
}

export class CSVAddressService {
  private static addresses: CSVAddress[] = [];
  private static lieuxDits: CSVLieuDit[] = [];
  private static isLoaded = false;
  private static readonly DELAY_MS = 300;
  private static debounceTimer: number | null = null;

  // Charger les données CSV
  static async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Charger les adresses
      const addressResponse = await fetch('/data/addresses.csv');
      const addressText = await addressResponse.text();
      this.addresses = this.parseAddressCSV(addressText);

      // Charger les lieux-dits
      const lieuxDitsResponse = await fetch('/data/lieux_dits.csv');
      const lieuxDitsText = await lieuxDitsResponse.text();
      this.lieuxDits = this.parseLieuxDitsCSV(lieuxDitsText);

      this.isLoaded = true;
      console.log(`Chargé ${this.addresses.length} adresses et ${this.lieuxDits.length} lieux-dits`);
    } catch (error) {
      console.error('Erreur lors du chargement des données CSV:', error);
    }
  }

  // Parser le CSV des adresses
  private static parseAddressCSV(csvText: string): CSVAddress[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(';');
    const addresses: CSVAddress[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(';');
      if (values.length < headers.length) continue;

      const address: CSVAddress = {
        id: values[0] || '',
        numero: values[2] || '',
        nom_voie: values[4] || '',
        code_postal: values[5] || '',
        nom_commune: values[7] || '',
        lon: parseFloat(values[12]) || 0,
        lat: parseFloat(values[13]) || 0,
        libelle_acheminement: values[17] || '',
        nom_afnor: values[18] || ''
      };

      if (address.nom_voie && address.nom_commune && address.code_postal) {
        addresses.push(address);
      }
    }

    return addresses;
  }

  // Parser le CSV des lieux-dits
  private static parseLieuxDitsCSV(csvText: string): CSVLieuDit[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(';');
    const lieuxDits: CSVLieuDit[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(';');
      if (values.length < headers.length) continue;

      const lieuDit: CSVLieuDit = {
        id: values[0] || '',
        nom_lieu_dit: values[1] || '',
        code_postal: values[2] || '',
        nom_commune: values[4] || '',
        lon: parseFloat(values[9]) || 0,
        lat: parseFloat(values[10]) || 0
      };

      if (lieuDit.nom_lieu_dit && lieuDit.nom_commune && lieuDit.code_postal) {
        lieuxDits.push(lieuDit);
      }
    }

    return lieuxDits;
  }

  // Rechercher des adresses
  static async searchAddresses(query: string, postcode?: string, limit: number = 10): Promise<CSVAddress[]> {
    await this.loadData();

    const normalizedQuery = this.normalizeText(query);
    let results: CSVAddress[] = [];

    // Recherche dans les adresses
    for (const address of this.addresses) {
      if (results.length >= limit) break;

      const addressText = this.normalizeText(`${address.numero} ${address.nom_voie} ${address.nom_commune}`);
      const voieText = this.normalizeText(address.nom_voie);
      const communeText = this.normalizeText(address.nom_commune);

      // Filtrer par code postal si fourni
      if (postcode && !address.code_postal.startsWith(postcode)) {
        continue;
      }

      // Vérifier si la requête correspond
      if (addressText.includes(normalizedQuery) || 
          voieText.includes(normalizedQuery) || 
          communeText.includes(normalizedQuery)) {
        results.push(address);
      }
    }

    // Recherche dans les lieux-dits
    for (const lieuDit of this.lieuxDits) {
      if (results.length >= limit) break;

      const lieuDitText = this.normalizeText(`${lieuDit.nom_lieu_dit} ${lieuDit.nom_commune}`);
      const nomText = this.normalizeText(lieuDit.nom_lieu_dit);

      // Filtrer par code postal si fourni
      if (postcode && !lieuDit.code_postal.startsWith(postcode)) {
        continue;
      }

      // Vérifier si la requête correspond
      if (lieuDitText.includes(normalizedQuery) || nomText.includes(normalizedQuery)) {
        // Convertir le lieu-dit en format adresse
        const addressFromLieuDit: CSVAddress = {
          id: lieuDit.id,
          numero: '',
          nom_voie: lieuDit.nom_lieu_dit,
          code_postal: lieuDit.code_postal,
          nom_commune: lieuDit.nom_commune,
          lon: lieuDit.lon,
          lat: lieuDit.lat,
          libelle_acheminement: lieuDit.nom_commune.toUpperCase(),
          nom_afnor: lieuDit.nom_lieu_dit.toUpperCase()
        };
        results.push(addressFromLieuDit);
      }
    }

    // Trier par pertinence (correspondance exacte en premier)
    results.sort((a, b) => {
      const aText = this.normalizeText(`${a.numero} ${a.nom_voie}`);
      const bText = this.normalizeText(`${b.numero} ${b.nom_voie}`);
      
      const aExact = aText.startsWith(normalizedQuery) ? 1 : 0;
      const bExact = bText.startsWith(normalizedQuery) ? 1 : 0;
      
      return bExact - aExact;
    });

    return results.slice(0, limit);
  }

  // Recherche avec debounce
  static async searchAddressesDebounced(query: string, postcode?: string): Promise<CSVAddress[]> {
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

  // Rechercher des villes par code postal
  static async searchCitiesByPostcode(postcode: string): Promise<CSVAddress[]> {
    await this.loadData();

    if (postcode.length < 2) return [];

    const cities = new Map<string, CSVAddress>();

    // Recherche dans les adresses
    for (const address of this.addresses) {
      if (address.code_postal.startsWith(postcode)) {
        const key = `${address.code_postal}-${address.nom_commune}`;
        if (!cities.has(key)) {
          cities.set(key, {
            id: `city-${address.code_postal}-${address.nom_commune}`,
            numero: '',
            nom_voie: '',
            code_postal: address.code_postal,
            nom_commune: address.nom_commune,
            lon: address.lon,
            lat: address.lat,
            libelle_acheminement: address.nom_commune.toUpperCase(),
            nom_afnor: address.nom_commune.toUpperCase()
          });
        }
      }
    }

    // Recherche dans les lieux-dits
    for (const lieuDit of this.lieuxDits) {
      if (lieuDit.code_postal.startsWith(postcode)) {
        const key = `${lieuDit.code_postal}-${lieuDit.nom_commune}`;
        if (!cities.has(key)) {
          cities.set(key, {
            id: `city-${lieuDit.code_postal}-${lieuDit.nom_commune}`,
            numero: '',
            nom_voie: '',
            code_postal: lieuDit.code_postal,
            nom_commune: lieuDit.nom_commune,
            lon: lieuDit.lon,
            lat: lieuDit.lat,
            libelle_acheminement: lieuDit.nom_commune.toUpperCase(),
            nom_afnor: lieuDit.nom_commune.toUpperCase()
          });
        }
      }
    }

    return Array.from(cities.values()).sort((a, b) => 
      a.nom_commune.localeCompare(b.nom_commune)
    );
  }

  // Recherche de villes avec debounce
  static async searchCitiesByPostcodeDebounced(postcode: string): Promise<CSVAddress[]> {
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

  // Convertir une adresse CSV en Address
  static parseCSVAddress(csvAddress: CSVAddress): Address {
    return {
      id: csvAddress.id,
      street_number: csvAddress.numero,
      street_name: csvAddress.nom_voie,
      postal_code: csvAddress.code_postal,
      city: csvAddress.nom_commune,
      country: 'France',
      full_address: `${csvAddress.numero} ${csvAddress.nom_voie}, ${csvAddress.code_postal} ${csvAddress.nom_commune}`.trim(),
      coordinates: {
        lat: csvAddress.lat,
        lng: csvAddress.lon
      }
    };
  }

  // Géocoder une adresse
  static async geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
    if (address.coordinates) return address.coordinates;

    await this.loadData();

    // Rechercher l'adresse dans les données
    const query = `${address.street_number} ${address.street_name} ${address.city}`;
    const results = await this.searchAddresses(query, address.postal_code, 1);

    if (results.length > 0) {
      return {
        lat: results[0].lat,
        lng: results[0].lon
      };
    }

    return null;
  }

  // Normaliser le texte pour la recherche
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();
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
}