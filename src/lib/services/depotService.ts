import { db, type Depot, type NewDepot } from '../database';
import { depots } from '../database/schema';
import { eq } from 'drizzle-orm';

// Demo data for browser environment
const DEMO_DEPOTS: Depot[] = [
  {
    id: 'demo-depot-001',
    name: 'Dépôt Central Paris',
    address: '123 Rue de la République',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    contactPhone: '01 23 45 67 89',
    contactEmail: 'contact@depot-paris.fr',
    openingHours: JSON.stringify({ 
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '09:00', end: '16:00' },
      sunday: { closed: true }
    }),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-depot-002',
    name: 'Dépôt Lyon',
    address: '456 Avenue du Commerce',
    city: 'Lyon',
    postalCode: '69000',
    country: 'France',
    latitude: 45.7640,
    longitude: 4.8357,
    contactPhone: '04 78 90 12 34',
    contactEmail: 'contact@depot-lyon.fr',
    openingHours: JSON.stringify({ 
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { closed: true },
      sunday: { closed: true }
    }),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export class DepotService {
  // Créer un nouveau dépôt
  static async createDepot(data: Omit<NewDepot, 'id' | 'createdAt'>): Promise<Depot> {
    const newDepot: NewDepot = {
      id: crypto.randomUUID(),
      ...data,
    };

    const [createdDepot] = await db.insert(depots).values(newDepot).returning();
    return createdDepot;
  }

  // Obtenir tous les dépôts actifs
  static async getActiveDepots(): Promise<Depot[]> {
    if (isBrowser) {
      // Return demo data in browser environment
      return Promise.resolve(DEMO_DEPOTS.filter(depot => depot.isActive));
    }

    // Server environment - use database
    return await db.select()
      .from(depots)
      .where(eq(depots.isActive, true))
      .orderBy(depots.name);
  }

  // Obtenir un dépôt par ID
  static async getDepotById(id: string): Promise<Depot | null> {
    if (isBrowser) {
      // Return demo data in browser environment
      const depot = DEMO_DEPOTS.find(depot => depot.id === id);
      return Promise.resolve(depot || null);
    }

    // Server environment - use database
    const [depot] = await db.select()
      .from(depots)
      .where(eq(depots.id, id))
      .limit(1);

    return depot || null;
  }

  // Mettre à jour un dépôt
  static async updateDepot(id: string, data: Partial<Omit<Depot, 'id' | 'createdAt'>>): Promise<Depot> {
    const [updatedDepot] = await db.update(depots)
      .set(data)
      .where(eq(depots.id, id))
      .returning();

    return updatedDepot;
  }

  // Désactiver un dépôt
  static async deactivateDepot(id: string): Promise<void> {
    await db.update(depots)
      .set({ isActive: false })
      .where(eq(depots.id, id));
  }

  // Géocoder un dépôt
  static async geocodeDepot(id: string): Promise<void> {
    const depot = await this.getDepotById(id);
    if (!depot) throw new Error('Dépôt non trouvé');

    try {
      const address = `${depot.address}, ${depot.postalCode} ${depot.city}, ${depot.country}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data.length > 0) {
        await this.updateDepot(id, {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
    }
  }
}