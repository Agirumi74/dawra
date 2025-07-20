import { Address } from '../types';
import { AddressDatabaseService } from './addressDatabase';

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

  // Rechercher des adresses avec recherche fuzzy améliorée
  static async searchAddresses(query: string, postcode?: string, limit: number = 10): Promise<CSVAddress[]> {
    await this.loadData();

    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
    const results: CSVAddress[] = [];

    // Recherche dans la base d'adresses locale d'abord
    const localAddresses = AddressDatabaseService.searchAddresses(query);
    for (const localAddr of localAddresses) {
      if (results.length >= limit) break;
      
      // Convertir l'adresse locale en format CSV
      const csvAddr: CSVAddress = {
        id: localAddr.id,
        numero: localAddr.street_number,
        nom_voie: localAddr.street_name,
        code_postal: localAddr.postal_code,
        nom_commune: localAddr.city,
        lon: localAddr.coordinates?.lng || 0,
        lat: localAddr.coordinates?.lat || 0,
        libelle_acheminement: localAddr.city.toUpperCase(),
        nom_afnor: localAddr.street_name.toUpperCase()
      };
      
      // Filtrer par code postal si fourni
      if (!postcode || csvAddr.code_postal.startsWith(postcode)) {
        results.push(csvAddr);
      }
    }

    // Recherche dans les adresses avec scoring de pertinence
    const addressCandidates: Array<{ address: CSVAddress; score: number }> = [];

    for (const address of this.addresses) {
      // Filtrer par code postal si fourni
      if (postcode && !address.code_postal.startsWith(postcode)) {
        continue;
      }

      // Éviter les doublons avec la base locale
      const isDuplicate = results.some(r => 
        r.numero === address.numero && 
        r.nom_voie === address.nom_voie && 
        r.code_postal === address.code_postal
      );
      
      if (isDuplicate) continue;

      // Calculer le score de pertinence
      const score = this.calculateRelevanceScore(address, queryWords, normalizedQuery);
      
      if (score > 0) {
        addressCandidates.push({ address, score });
      }
    }

    // Trier par score de pertinence et ajouter aux résultats
    addressCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length)
      .forEach(candidate => results.push(candidate.address));

    // Recherche dans les lieux-dits avec scoring
    const lieuxDitsCandidates: Array<{ lieuDit: CSVLieuDit; score: number }> = [];

    for (const lieuDit of this.lieuxDits) {
      // Filtrer par code postal si fourni
      if (postcode && !lieuDit.code_postal.startsWith(postcode)) {
        continue;
      }

      // Éviter les doublons avec la base locale et les adresses
      const isDuplicate = results.some(r => 
        r.nom_voie === lieuDit.nom_lieu_dit && 
        r.code_postal === lieuDit.code_postal
      );
      
      if (isDuplicate) continue;

      // Calculer le score pour les lieux-dits
      const lieuDitText = this.normalizeText(`${lieuDit.nom_lieu_dit} ${lieuDit.nom_commune}`);
      const nomText = this.normalizeText(lieuDit.nom_lieu_dit);
      
      let score = 0;
      
      // Score basé sur la correspondance des mots
      for (const word of queryWords) {
        if (nomText.includes(word)) score += 3;
        else if (lieuDitText.includes(word)) score += 1;
      }
      
      // Bonus pour correspondance exacte
      if (nomText === normalizedQuery) score += 10;
      else if (nomText.startsWith(normalizedQuery)) score += 5;
      
      if (score > 0) {
        lieuxDitsCandidates.push({ lieuDit, score });
      }
    }

    // Ajouter les lieux-dits triés par score
    lieuxDitsCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - results.length)
      .forEach(candidate => {
        // Convertir le lieu-dit en format adresse
        const addressFromLieuDit: CSVAddress = {
          id: candidate.lieuDit.id,
          numero: '',
          nom_voie: candidate.lieuDit.nom_lieu_dit,
          code_postal: candidate.lieuDit.code_postal,
          nom_commune: candidate.lieuDit.nom_commune,
          lon: candidate.lieuDit.lon,
          lat: candidate.lieuDit.lat,
          libelle_acheminement: candidate.lieuDit.nom_commune.toUpperCase(),
          nom_afnor: candidate.lieuDit.nom_lieu_dit.toUpperCase()
        };
        results.push(addressFromLieuDit);
      });

    return results.slice(0, limit);
  }

  /**
   * Calcule un score de pertinence pour une adresse donnée
   * @param address Adresse à évaluer
   * @param queryWords Mots de la requête normalisés
   * @param normalizedQuery Requête complète normalisée
   * @returns Score de pertinence (plus élevé = plus pertinent)
   */
  private static calculateRelevanceScore(address: CSVAddress, queryWords: string[], normalizedQuery: string): number {
    const fullAddressText = this.normalizeText(`${address.numero} ${address.nom_voie} ${address.nom_commune}`);
    const voieText = this.normalizeText(address.nom_voie);
    const communeText = this.normalizeText(address.nom_commune);
    const numeroVoieText = this.normalizeText(`${address.numero} ${address.nom_voie}`);
    
    let score = 0;
    
    // Score basé sur la correspondance exacte
    if (fullAddressText === normalizedQuery) score += 100;
    else if (numeroVoieText === normalizedQuery) score += 80;
    else if (voieText === normalizedQuery) score += 60;
    
    // Score basé sur le début de correspondance
    if (fullAddressText.startsWith(normalizedQuery)) score += 50;
    else if (numeroVoieText.startsWith(normalizedQuery)) score += 40;
    else if (voieText.startsWith(normalizedQuery)) score += 30;
    
    // Score basé sur la correspondance des mots individuels
    let wordMatches = 0;
    for (const word of queryWords) {
      if (word.length < 2) continue; // Ignorer les mots trop courts
      
      if (voieText.includes(word)) {
        wordMatches++;
        score += 5;
      } else if (communeText.includes(word)) {
        wordMatches++;
        score += 3;
      } else if (address.numero.includes(word)) {
        wordMatches++;
        score += 2;
      }
    }
    
    // Bonus si tous les mots correspondent
    if (queryWords.length > 0 && wordMatches === queryWords.length) {
      score += 20;
    }
    
    // Score basé sur la correspondance partielle
    if (fullAddressText.includes(normalizedQuery)) score += 10;
    else if (numeroVoieText.includes(normalizedQuery)) score += 8;
    else if (voieText.includes(normalizedQuery)) score += 6;
    
    // Malus pour les adresses très courtes qui matchent par accident
    if (voieText.length < 4 && normalizedQuery.length > voieText.length) {
      score -= 5;
    }
    
    return score;
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

  // Méthode pour normaliser une adresse complète
  static normalizeFullAddress(address: Address): string {
    return `${address.street_number || ''} ${address.street_name || ''}, ${address.postal_code || ''} ${address.city || ''}`.trim();
  }

  /**
   * Ajoute une adresse issue de BAN au fichier CSV local (en mémoire)
   * @param address Adresse à ajouter
   * @returns L'adresse CSV ajoutée
   */
  static addBANAddressToLocal(address: Address): CSVAddress {
    const csvAddress: CSVAddress = {
      id: address.id,
      numero: address.street_number,
      nom_voie: address.street_name,
      code_postal: address.postal_code,
      nom_commune: address.city,
      lon: address.coordinates?.lng || 0,
      lat: address.coordinates?.lat || 0,
      libelle_acheminement: address.city.toUpperCase(),
      nom_afnor: address.street_name.toUpperCase()
    };

    // Vérifier si l'adresse n'existe pas déjà
    const exists = this.addresses.some(addr => 
      addr.numero === csvAddress.numero &&
      addr.nom_voie === csvAddress.nom_voie &&
      addr.code_postal === csvAddress.code_postal
    );

    if (!exists) {
      this.addresses.push(csvAddress);
      console.log('Adresse BAN ajoutée au cache local:', csvAddress);
    }

    return csvAddress;
  }

  /**
   * Recherche fuzzy améliorée avec support des abréviations communes
   * @param query Requête de recherche
   * @param text Texte à comparer
   * @returns Score de correspondance (0-1)
   */
  static fuzzyMatch(query: string, text: string): number {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    
    // Correspondance exacte
    if (normalizedText === normalizedQuery) return 1.0;
    
    // Correspondance au début
    if (normalizedText.startsWith(normalizedQuery)) return 0.9;
    
    // Correspondance avec mots dans l'ordre
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
    const textWords = normalizedText.split(' ');
    
    let matchedWords = 0;
    let lastIndex = -1;
    
    for (const queryWord of queryWords) {
      const found = textWords.findIndex((textWord, index) => 
        index > lastIndex && (
          textWord.includes(queryWord) || 
          queryWord.includes(textWord) ||
          this.isAbbreviation(queryWord, textWord)
        )
      );
      
      if (found !== -1) {
        matchedWords++;
        lastIndex = found;
      }
    }
    
    if (queryWords.length === 0) return 0;
    
    const wordMatchRatio = matchedWords / queryWords.length;
    return wordMatchRatio * 0.8; // Score maximum de 0.8 pour correspondance partielle
  }

  /**
   * Vérifie si un mot peut être une abréviation d'un autre
   * @param short Mot potentiellement abrégé
   * @param full Mot complet
   * @returns true si c'est une abréviation valide
   */
  private static isAbbreviation(short: string, full: string): boolean {
    if (short.length >= full.length) return false;
    
    // Abréviations communes
    const commonAbbreviations: { [key: string]: string[] } = {
      'av': ['avenue'],
      'bd': ['boulevard'],
      'pl': ['place'],
      'r': ['rue'],
      'imp': ['impasse'],
      'all': ['allee', 'allée'],
      'ch': ['chemin'],
      'sq': ['square'],
      'crs': ['cours'],
      'qua': ['quartier'],
      'res': ['residence', 'résidence'],
      'lot': ['lotissement']
    };
    
    const shortLower = short.toLowerCase();
    const fullLower = full.toLowerCase();
    
    // Vérifier les abréviations communes
    if (commonAbbreviations[shortLower]) {
      return commonAbbreviations[shortLower].includes(fullLower);
    }
    
    // Vérifier si le mot court est le début du mot long
    return fullLower.startsWith(shortLower) && short.length >= 2;
  }
}