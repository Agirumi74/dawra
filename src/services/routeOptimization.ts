import { Package, DeliveryPoint, UserPosition } from '../types';
import { AddressService } from './addressService';

export interface RouteConstraints {
  timeWindows?: { [addressId: string]: { start: string; end: string } };
  priorities?: { [addressId: string]: number }; // 1 = highest priority
  maxDeliveryTime?: number; // minutes
}

export interface OptimizationMode {
  type: 'simple' | 'constrained';
  constraints?: RouteConstraints;
}

export class RouteOptimizer {
  private static readonly OSRM_SERVER = 'https://router.project-osrm.org';

  // Calculer la matrice de distances avec OSRM
  static async getDistanceMatrix(points: { lat: number; lng: number }[]): Promise<number[][]> {
    if (points.length < 2) return [];

    const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${this.OSRM_SERVER}/table/v1/driving/${coordinates}?annotations=distance,duration`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('OSRM API error');
      
      const data = await response.json();
      return data.distances; // Matrice en mètres
    } catch (error) {
      console.error('Distance matrix error:', error);
      // Fallback: calcul de distance à vol d'oiseau
      return this.calculateHaversineMatrix(points);
    }
  }

  // Fallback: matrice de distances à vol d'oiseau
  private static calculateHaversineMatrix(points: { lat: number; lng: number }[]): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < points.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.calculateHaversineDistance(points[i], points[j]) * 1000; // en mètres
        }
      }
    }
    
    return matrix;
  }

  static calculateHaversineDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Obtenir l'itinéraire GPS entre deux points
  static async getRoutePolyline(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ lat: number; lng: number }[]> {
    const url = `${this.OSRM_SERVER}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('OSRM Route API error');
      
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
      }
      
      return [from, to]; // Fallback: ligne droite
    } catch (error) {
      console.error('Route polyline error:', error);
      return [from, to]; // Fallback: ligne droite
    }
  }

  // Grouper les colis par adresse et calculer la priorité du point
  static groupPackagesByAddress(packages: Package[]): DeliveryPoint[] {
    const addressGroups = new Map<string, Package[]>();
    
    packages.forEach(pkg => {
      const addressKey = pkg.address.full_address;
      if (!addressGroups.has(addressKey)) {
        addressGroups.set(addressKey, []);
      }
      addressGroups.get(addressKey)!.push(pkg);
    });

    const points: DeliveryPoint[] = [];
    let order = 1;

    addressGroups.forEach((pkgs, addressKey) => {
      const firstPkg = pkgs[0];
      
      // Déterminer le statut du point
      const allDelivered = pkgs.every(p => p.status === 'delivered');
      const someDelivered = pkgs.some(p => p.status === 'delivered');
      let status: 'pending' | 'completed' | 'partial' = 'pending';
      if (allDelivered) status = 'completed';
      else if (someDelivered) status = 'partial';

      // Déterminer la priorité du point (la plus haute parmi les colis)
      const priorities = pkgs.map(p => p.priority);
      let pointPriority: 'standard' | 'express_midi' | 'premier' = 'standard';
      
      if (priorities.includes('premier')) {
        pointPriority = 'premier';
      } else if (priorities.includes('express_midi')) {
        pointPriority = 'express_midi';
      }

      points.push({
        id: `point-${addressKey.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '')}`,
        address: firstPkg.address,
        packages: pkgs,
        status,
        order: order++,
        distance: 0,
        priority: pointPriority
      });
    });

    return points;
  }

  // Optimisation simple (Nearest Neighbor)
  static optimizeSimple(points: DeliveryPoint[], userPosition: UserPosition, distanceMatrix: number[][]): DeliveryPoint[] {
    if (points.length === 0) return [];

    const unvisited = new Set(points.map((_, i) => i));
    const optimized: DeliveryPoint[] = [];
    let currentIndex = -1; // Position utilisateur (index virtuel)
    let order = 1;

    while (unvisited.size > 0) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (const index of unvisited) {
        let distance: number;
        
        if (currentIndex === -1) {
          // Distance depuis la position utilisateur
          const point = points[index];
          if (point.address.coordinates) {
            distance = this.calculateHaversineDistance(userPosition, point.address.coordinates) * 1000;
          } else {
            distance = Infinity;
          }
        } else {
          // Distance depuis le point précédent
          distance = distanceMatrix[currentIndex][index];
        }

        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      }

      if (nearestIndex !== -1) {
        unvisited.delete(nearestIndex);
        const point = { ...points[nearestIndex] };
        point.order = order++;
        point.distance = minDistance / 1000; // Convertir en km
        optimized.push(point);
        currentIndex = nearestIndex;
      } else {
        break;
      }
    }

    return optimized;
  }

  // Optimisation avec contraintes (priorités et fenêtres temporelles)
  static optimizeWithConstraints(
    points: DeliveryPoint[], 
    userPosition: UserPosition, 
    distanceMatrix: number[][], 
    constraints: RouteConstraints
  ): DeliveryPoint[] {
    if (points.length === 0) return [];

    // Séparer par priorité
    const premierPoints = points.filter(p => p.priority === 'premier');
    const expressMidiPoints = points.filter(p => p.priority === 'express_midi');
    const standardPoints = points.filter(p => p.priority === 'standard');

    let optimized: DeliveryPoint[] = [];
    let currentPosition = userPosition;
    let order = 1;

    // 1. Traiter les points "premier" en premier
    if (premierPoints.length > 0) {
      const premierOptimized = this.optimizeSimple(premierPoints, currentPosition, distanceMatrix);
      premierOptimized.forEach(point => {
        point.order = order++;
        optimized.push(point);
      });
      
      // Mettre à jour la position actuelle
      const lastPoint = premierOptimized[premierOptimized.length - 1];
      if (lastPoint.address.coordinates) {
        currentPosition = lastPoint.address.coordinates;
      }
    }

    // 2. Traiter les points "express_midi" avant midi
    if (expressMidiPoints.length > 0) {
      const expressOptimized = this.optimizeSimple(expressMidiPoints, currentPosition, distanceMatrix);
      expressOptimized.forEach(point => {
        point.order = order++;
        point.estimatedTime = this.calculateEstimatedTime(point.order, 8); // Départ à 8h
        optimized.push(point);
      });
      
      // Mettre à jour la position actuelle
      const lastPoint = expressOptimized[expressOptimized.length - 1];
      if (lastPoint.address.coordinates) {
        currentPosition = lastPoint.address.coordinates;
      }
    }

    // 3. Traiter les points standard
    if (standardPoints.length > 0) {
      const standardOptimized = this.optimizeSimple(standardPoints, currentPosition, distanceMatrix);
      standardOptimized.forEach(point => {
        point.order = order++;
        point.estimatedTime = this.calculateEstimatedTime(point.order, 8); // Départ à 8h
        optimized.push(point);
      });
    }

    return optimized;
  }

  // Calculer l'heure estimée d'arrivée
  private static calculateEstimatedTime(order: number, startHour: number): string {
    const minutesPerStop = 15; // 15 minutes par arrêt en moyenne
    const totalMinutes = startHour * 60 + (order - 1) * minutesPerStop;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Ajouter dynamiquement des adresses à une tournée existante
  static async addAddressesToTour(
    existingTour: DeliveryPoint[],
    newAddresses: DeliveryPoint[],
    userPosition: UserPosition,
    currentIndex: number = 0
  ): Promise<DeliveryPoint[]> {
    if (newAddresses.length === 0) return existingTour;

    // Créer une liste des points restants (non livrés)
    const remainingPoints = existingTour.slice(currentIndex);
    const completedPoints = existingTour.slice(0, currentIndex);

    // Combiner les points restants avec les nouvelles adresses
    const allPoints = [...remainingPoints, ...newAddresses];

    // Recalculer la matrice de distances
    const coordinates = allPoints
      .filter(p => p.address.coordinates)
      .map(p => p.address.coordinates!);

    if (coordinates.length === 0) return existingTour;

    const distanceMatrix = await this.getDistanceMatrix(coordinates);

    // Optimiser la nouvelle tournée en tenant compte des priorités
    const hasConstraints = allPoints.some(p => p.priority !== 'standard');
    let optimized: DeliveryPoint[];

    if (hasConstraints) {
      optimized = this.optimizeWithConstraints(allPoints, userPosition, distanceMatrix, {});
    } else {
      optimized = this.optimizeSimple(allPoints, userPosition, distanceMatrix);
    }

    // Ajuster les numéros d'ordre
    optimized.forEach((point, index) => {
      point.order = completedPoints.length + index + 1;
    });

    return [...completedPoints, ...optimized];
  }

  // Amélioration 2-opt pour optimiser davantage
  static improve2Opt(tour: DeliveryPoint[], distanceMatrix: number[][]): DeliveryPoint[] {
    if (tour.length < 4) return tour;

    let improved = true;
    let currentTour = [...tour];

    while (improved) {
      improved = false;

      for (let i = 1; i < currentTour.length - 2; i++) {
        for (let j = i + 1; j < currentTour.length; j++) {
          if (j - i === 1) continue; // Skip adjacent edges

          const currentDistance = 
            distanceMatrix[i - 1][i] + distanceMatrix[j - 1][j];
          const newDistance = 
            distanceMatrix[i - 1][j - 1] + distanceMatrix[i][j];

          if (newDistance < currentDistance) {
            // Reverse the segment between i and j-1
            const newTour = [
              ...currentTour.slice(0, i),
              ...currentTour.slice(i, j).reverse(),
              ...currentTour.slice(j)
            ];

            currentTour = newTour;
            improved = true;
          }
        }
      }
    }

    // Réajuster les numéros d'ordre
    currentTour.forEach((point, index) => {
      point.order = index + 1;
    });

    return currentTour;
  }

  // Obtenir la position actuelle de l'utilisateur
  static async getCurrentPosition(): Promise<UserPosition | null> {
    return new Promise<UserPosition | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
}