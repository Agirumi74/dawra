import { db, type Vehicle, type NewVehicle, type VehicleLocation, type NewVehicleLocation } from '../database';
import { vehicles, vehicleLocations } from '../database/schema';
import { eq, and } from 'drizzle-orm';

export class VehicleService {
  // Créer un nouveau véhicule
  static async createVehicle(data: Omit<NewVehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
    const newVehicle: NewVehicle = {
      id: crypto.randomUUID(),
      ...data,
    };

    const [createdVehicle] = await db.insert(vehicles).values(newVehicle).returning();
    
    // Créer les emplacements par défaut
    await this.createDefaultLocations(createdVehicle.id);
    
    return createdVehicle;
  }

  // Créer les emplacements par défaut pour un véhicule
  static async createDefaultLocations(vehicleId: string): Promise<void> {
    const defaultLocations = [
      { name: 'Avant Gauche', color: '#ef4444', position: JSON.stringify({x: 0, y: 0, z: 0}) },
      { name: 'Avant Droite', color: '#f97316', position: JSON.stringify({x: 1, y: 0, z: 0}) },
      { name: 'Milieu Gauche', color: '#eab308', position: JSON.stringify({x: 0, y: 1, z: 0}) },
      { name: 'Milieu Droite', color: '#22c55e', position: JSON.stringify({x: 1, y: 1, z: 0}) },
      { name: 'Arrière Gauche', color: '#06b6d4', position: JSON.stringify({x: 0, y: 2, z: 0}) },
      { name: 'Arrière Droite', color: '#8b5cf6', position: JSON.stringify({x: 1, y: 2, z: 0}) },
      { name: 'Sol', color: '#64748b', position: JSON.stringify({x: 0.5, y: 1, z: -1}) },
      { name: 'Cabine', color: '#f59e0b', position: JSON.stringify({x: 0.5, y: -0.5, z: 0}) },
    ];

    for (const location of defaultLocations) {
      await db.insert(vehicleLocations).values({
        id: crypto.randomUUID(),
        vehicleId,
        ...location,
        isDefault: true,
      });
    }
  }

  // Obtenir tous les véhicules actifs
  static async getActiveVehicles(): Promise<Vehicle[]> {
    return await db.select()
      .from(vehicles)
      .where(eq(vehicles.isActive, true))
      .orderBy(vehicles.licensePlate);
  }

  // Obtenir un véhicule par ID
  static async getVehicleById(id: string): Promise<Vehicle | null> {
    const [vehicle] = await db.select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    return vehicle || null;
  }

  // Obtenir les véhicules d'un dépôt
  static async getVehiclesByDepot(depotId: string): Promise<Vehicle[]> {
    return await db.select()
      .from(vehicles)
      .where(and(
        eq(vehicles.depotId, depotId),
        eq(vehicles.isActive, true)
      ))
      .orderBy(vehicles.licensePlate);
  }

  // Obtenir les emplacements d'un véhicule
  static async getVehicleLocations(vehicleId: string): Promise<VehicleLocation[]> {
    return await db.select()
      .from(vehicleLocations)
      .where(eq(vehicleLocations.vehicleId, vehicleId))
      .orderBy(vehicleLocations.name);
  }

  // Ajouter un emplacement personnalisé
  static async addCustomLocation(vehicleId: string, data: Omit<NewVehicleLocation, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleLocation> {
    const newLocation: NewVehicleLocation = {
      id: crypto.randomUUID(),
      vehicleId,
      ...data,
      isDefault: false,
    };

    const [createdLocation] = await db.insert(vehicleLocations).values(newLocation).returning();
    return createdLocation;
  }

  // Assigner un chauffeur à un véhicule
  static async assignDriver(vehicleId: string, driverId: string): Promise<Vehicle> {
    const [updatedVehicle] = await db.update(vehicles)
      .set({ currentDriverId: driverId })
      .where(eq(vehicles.id, vehicleId))
      .returning();

    return updatedVehicle;
  }

  // Mettre à jour le kilométrage
  static async updateMileage(vehicleId: string, mileage: number): Promise<void> {
    await db.update(vehicles)
      .set({ mileage })
      .where(eq(vehicles.id, vehicleId));
  }

  // Programmer une maintenance
  static async scheduleMaintenance(vehicleId: string, nextMaintenanceDate: string): Promise<void> {
    await db.update(vehicles)
      .set({ 
        nextMaintenanceDate,
        lastMaintenanceDate: new Date().toISOString().split('T')[0]
      })
      .where(eq(vehicles.id, vehicleId));
  }
}