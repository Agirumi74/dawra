import { Address } from '../types';

export interface AddressNote {
  id: string;
  addressId: string;
  note: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  isGlobal: boolean; // Note visible par tous les utilisateurs
}

export interface EnhancedAddress extends Address {
  notes: AddressNote[];
  deliveryHistory: {
    date: Date;
    success: boolean;
    driver: string;
    notes?: string;
  }[];
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  alternativeNames: string[];
  accessInstructions?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    contactPerson?: string;
  };
}

export class AddressDatabaseService {
  private static readonly STORAGE_KEY = 'address-database';
  private static readonly NOTES_KEY = 'address-notes';

  // Charger la base d'adresses
  static loadAddressDatabase(): EnhancedAddress[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading address database:', error);
      return [];
    }
  }

  // Sauvegarder la base d'adresses
  static saveAddressDatabase(addresses: EnhancedAddress[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error saving address database:', error);
    }
  }

  // Rechercher une adresse dans la base
  static findAddress(searchAddress: Address): EnhancedAddress | null {
    const database = this.loadAddressDatabase();
    
    // Recherche exacte d'abord
    let found = database.find(addr => 
      this.normalizeAddress(addr.full_address) === this.normalizeAddress(searchAddress.full_address)
    );

    if (found) return found;

    // Recherche approximative
    found = database.find(addr => {
      const similarity = this.calculateAddressSimilarity(addr, searchAddress);
      return similarity > 0.8; // 80% de similarité
    });

    return found || null;
  }

  // Ajouter ou mettre à jour une adresse
  static addOrUpdateAddress(address: Address, additionalInfo?: Partial<EnhancedAddress>): EnhancedAddress {
    const database = this.loadAddressDatabase();
    const existing = this.findAddress(address);

    if (existing) {
      // Mettre à jour l'adresse existante
      const updated: EnhancedAddress = {
        ...existing,
        ...address,
        ...additionalInfo,
        updatedAt: new Date()
      };
      
      const index = database.findIndex(addr => addr.id === existing.id);
      database[index] = updated;
      this.saveAddressDatabase(database);
      return updated;
    } else {
      // Créer une nouvelle adresse
      const newAddress: EnhancedAddress = {
        ...address,
        notes: [],
        deliveryHistory: [],
        isVerified: false,
        alternativeNames: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalInfo
      };
      
      database.push(newAddress);
      this.saveAddressDatabase(database);
      return newAddress;
    }
  }

  // Ajouter une note à une adresse
  static addNoteToAddress(addressId: string, note: string, author: string, isGlobal: boolean = true): AddressNote {
    const database = this.loadAddressDatabase();
    const address = database.find(addr => addr.id === addressId);

    if (!address) {
      throw new Error('Adresse non trouvée');
    }

    const newNote: AddressNote = {
      id: Date.now().toString(),
      addressId,
      note,
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
      isGlobal
    };

    address.notes.push(newNote);
    this.saveAddressDatabase(database);
    return newNote;
  }

  // Modifier une note
  static updateNote(noteId: string, newNote: string, author: string): void {
    const database = this.loadAddressDatabase();
    
    for (const address of database) {
      const note = address.notes.find(n => n.id === noteId);
      if (note) {
        note.note = newNote;
        note.author = author; // Track who updated the note
        note.updatedAt = new Date();
        this.saveAddressDatabase(database);
        return;
      }
    }
    
    throw new Error('Note non trouvée');
  }

  // Supprimer une note
  static deleteNote(noteId: string): void {
    const database = this.loadAddressDatabase();
    
    for (const address of database) {
      const noteIndex = address.notes.findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        address.notes.splice(noteIndex, 1);
        this.saveAddressDatabase(database);
        return;
      }
    }
    
    throw new Error('Note non trouvée');
  }

  // Vérifier une adresse
  static verifyAddress(addressId: string, verifiedBy: string): void {
    const database = this.loadAddressDatabase();
    const address = database.find(addr => addr.id === addressId);

    if (address) {
      address.isVerified = true;
      address.verifiedBy = verifiedBy;
      address.verifiedAt = new Date();
      this.saveAddressDatabase(database);
    }
  }

  // Ajouter un historique de livraison
  static addDeliveryHistory(addressId: string, success: boolean, driver: string, notes?: string): void {
    const database = this.loadAddressDatabase();
    const address = database.find(addr => addr.id === addressId);

    if (address) {
      address.deliveryHistory.push({
        date: new Date(),
        success,
        driver,
        notes
      });
      this.saveAddressDatabase(database);
    }
  }

  // Rechercher des adresses par texte
  static searchAddresses(query: string): EnhancedAddress[] {
    const database = this.loadAddressDatabase();
    const normalizedQuery = this.normalizeAddress(query);

    return database.filter(address => {
      const addressText = this.normalizeAddress(address.full_address);
      const alternativeNames = address.alternativeNames.map(name => this.normalizeAddress(name));
      
      return addressText.includes(normalizedQuery) || 
             alternativeNames.some(name => name.includes(normalizedQuery)) ||
             address.notes.some(note => this.normalizeAddress(note.note).includes(normalizedQuery));
    });
  }

  // Obtenir les statistiques d'une adresse
  static getAddressStats(addressId: string): {
    totalDeliveries: number;
    successRate: number;
    lastDelivery?: Date;
    averageNotes: number;
  } {
    const database = this.loadAddressDatabase();
    const address = database.find(addr => addr.id === addressId);

    if (!address) {
      return { totalDeliveries: 0, successRate: 0, averageNotes: 0 };
    }

    const totalDeliveries = address.deliveryHistory.length;
    const successfulDeliveries = address.deliveryHistory.filter(h => h.success).length;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
    const lastDelivery = address.deliveryHistory.length > 0 
      ? address.deliveryHistory[address.deliveryHistory.length - 1].date 
      : undefined;

    return {
      totalDeliveries,
      successRate,
      lastDelivery,
      averageNotes: address.notes.length
    };
  }

  // Normaliser une adresse pour la comparaison
  private static normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Calculer la similarité entre deux adresses
  private static calculateAddressSimilarity(addr1: Address, addr2: Address): number {
    const text1 = this.normalizeAddress(addr1.full_address);
    const text2 = this.normalizeAddress(addr2.full_address);

    // Algorithme de Levenshtein simplifié
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(text1, text2);
    return 1 - (distance / maxLength);
  }

  // Distance de Levenshtein
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Exporter la base d'adresses
  static exportDatabase(): string {
    const database = this.loadAddressDatabase();
    return JSON.stringify(database, null, 2);
  }

  // Importer une base d'adresses
  static importDatabase(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData) as EnhancedAddress[];
      const existing = this.loadAddressDatabase();
      
      // Fusionner les bases de données
      const merged = [...existing];
      
      for (const importedAddr of imported) {
        const existingIndex = merged.findIndex(addr => addr.id === importedAddr.id);
        if (existingIndex !== -1) {
          // Fusionner les données
          merged[existingIndex] = {
            ...merged[existingIndex],
            ...importedAddr,
            notes: [...merged[existingIndex].notes, ...importedAddr.notes],
            deliveryHistory: [...merged[existingIndex].deliveryHistory, ...importedAddr.deliveryHistory]
          };
        } else {
          merged.push(importedAddr);
        }
      }
      
      this.saveAddressDatabase(merged);
    } catch {
      throw new Error('Format de données invalide');
    }
  }
}