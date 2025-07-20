import { db, type Depot, type NewDepot } from '../database';
import { depots } from '../database/schema';
import { eq } from 'drizzle-orm';

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
    return await db.select()
      .from(depots)
      .where(eq(depots.isActive, true))
      .orderBy(depots.name);
  }

  // Obtenir un dépôt par ID
  static async getDepotById(id: string): Promise<Depot | null> {
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