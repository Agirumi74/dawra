import { Package, DeliveryPoint, UserPosition } from '../types';

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
        id: `point-${addressKey.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`,
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
    constraints: RouteConstraints,
    startTime: string = '08:00',
    stopTimeMinutes: number = 15,
    averageSpeedKmh: number = 30
  ): DeliveryPoint[] {
    if (points.length === 0) return [];

    // Analyser les contraintes temporelles
    const timeConstrainedPoints = points.filter(p => 
      p.packages.some(pkg => pkg.timeWindow?.start || pkg.timeWindow?.end)
    );

    // Séparer par priorité
    const premierPoints = points.filter(p => p.priority === 'premier');
    const expressMidiPoints = points.filter(p => p.priority === 'express_midi');
    const standardPoints = points.filter(p => p.priority === 'standard');

    const optimized: DeliveryPoint[] = [];
    let currentPosition = userPosition;
    let order = 1;
    let currentTimeMinutes = this.timeToMinutes(startTime);

    // 1. Traiter les points "premier" en premier (contrainte absolue)
    if (premierPoints.length > 0) {
      const premierOptimized = this.optimizeSimpleWithTimeConstraints(
        premierPoints, 
        currentPosition, 
        distanceMatrix, 
        currentTimeMinutes, 
        stopTimeMinutes, 
        averageSpeedKmh
      );
      
      premierOptimized.forEach(point => {
        point.order = order++;
        optimized.push(point);
        
        // Mettre à jour le temps et la position
        currentTimeMinutes += stopTimeMinutes;
        if (point.distance) {
          currentTimeMinutes += (point.distance / averageSpeedKmh) * 60;
        }
        if (point.address.coordinates) {
          currentPosition = point.address.coordinates;
        }
      });
    }

    // 2. Traiter les points "express_midi" avec contrainte de midi
    if (expressMidiPoints.length > 0) {
      const midiConstraintMinutes = 12 * 60; // 12:00
      const availableTime = midiConstraintMinutes - currentTimeMinutes;
      
      // Filtrer les points express qui peuvent être livrés avant midi
      const feasibleExpressPoints = expressMidiPoints.filter(point => {
        const estimatedTravelTime = point.address.coordinates ? 
          (this.calculateHaversineDistance(currentPosition, point.address.coordinates) / averageSpeedKmh) * 60 : 30;
        return (estimatedTravelTime + stopTimeMinutes) <= availableTime;
      });

      if (feasibleExpressPoints.length > 0) {
        const expressOptimized = this.optimizeSimpleWithTimeConstraints(
          feasibleExpressPoints, 
          currentPosition, 
          distanceMatrix, 
          currentTimeMinutes, 
          stopTimeMinutes, 
          averageSpeedKmh
        );
        
        expressOptimized.forEach(point => {
          point.order = order++;
          optimized.push(point);
          
          // Mettre à jour le temps et la position
          currentTimeMinutes += stopTimeMinutes;
          if (point.distance) {
            currentTimeMinutes += (point.distance / averageSpeedKmh) * 60;
          }
          if (point.address.coordinates) {
            currentPosition = point.address.coordinates;
          }
        });
      }

      // Reclasser les points express non traités comme standard
      const remainingExpressPoints = expressMidiPoints.filter(p => 
        !feasibleExpressPoints.find(fp => fp.id === p.id)
      );
      standardPoints.push(...remainingExpressPoints);
    }

    // 3. Traiter les points avec fenêtres temporelles spécifiques
    const remainingTimeConstrainedPoints = timeConstrainedPoints.filter(p => 
      !optimized.find(op => op.id === p.id)
    );

    if (remainingTimeConstrainedPoints.length > 0) {
      const timeOptimized = this.optimizeWithTimeWindows(
        remainingTimeConstrainedPoints,
        currentPosition,
        distanceMatrix,
        currentTimeMinutes,
        stopTimeMinutes,
        averageSpeedKmh
      );

      timeOptimized.forEach(point => {
        point.order = order++;
        optimized.push(point);
        
        // Mettre à jour le temps et la position
        currentTimeMinutes += stopTimeMinutes;
        if (point.distance) {
          currentTimeMinutes += (point.distance / averageSpeedKmh) * 60;
        }
        if (point.address.coordinates) {
          currentPosition = point.address.coordinates;
        }
      });
    }

    // 4. Traiter les points standard restants
    const remainingStandardPoints = standardPoints.filter(p => 
      !optimized.find(op => op.id === p.id)
    );

    if (remainingStandardPoints.length > 0) {
      const standardOptimized = this.optimizeSimpleWithTimeConstraints(
        remainingStandardPoints, 
        currentPosition, 
        distanceMatrix, 
        currentTimeMinutes, 
        stopTimeMinutes, 
        averageSpeedKmh
      );
      
      standardOptimized.forEach(point => {
        point.order = order++;
        optimized.push(point);
      });
    }

    return optimized;
  }

  // Optimisation avec fenêtres temporelles
  private static optimizeWithTimeWindows(
    points: DeliveryPoint[],
    userPosition: UserPosition,
    distanceMatrix: number[][],
    currentTimeMinutes: number,
    stopTimeMinutes: number,
    averageSpeedKmh: number
  ): DeliveryPoint[] {
    const optimized: DeliveryPoint[] = [];
    const remaining = [...points];
    let currentPos = userPosition;

    while (remaining.length > 0) {
      let bestPoint: DeliveryPoint | null = null;
      let bestScore = -1;
      let bestIndex = -1;

      remaining.forEach((point, index) => {
        if (!point.address.coordinates) return;

        // Calculer le temps d'arrivée
        const travelTime = this.calculateHaversineDistance(currentPos, point.address.coordinates) / averageSpeedKmh * 60;
        const arrivalTime = currentTimeMinutes + travelTime;

        // Vérifier les contraintes de fenêtre temporelle
        let score = 0;
        let isValidWindow = true;

        point.packages.forEach(pkg => {
          if (pkg.timeWindow?.start) {
            const startMinutes = this.timeToMinutes(pkg.timeWindow.start);
            if (arrivalTime < startMinutes) {
              // Arrivée trop tôt - attendre
              score -= (startMinutes - arrivalTime) * 0.1;
            }
          }
          
          if (pkg.timeWindow?.end) {
            const endMinutes = this.timeToMinutes(pkg.timeWindow.end);
            if (arrivalTime > endMinutes) {
              // Arrivée trop tard - invalide
              isValidWindow = false;
            } else {
              // Bonus pour arriver dans la fenêtre
              score += 10;
            }
          }
        });

        if (isValidWindow) {
          // Bonus pour proximité
          score += Math.max(0, 10 - travelTime / 10);
          
          if (score > bestScore) {
            bestScore = score;
            bestPoint = point;
            bestIndex = index;
          }
        }
      });

      if (bestPoint && bestIndex !== -1) {
        optimized.push(bestPoint);
        remaining.splice(bestIndex, 1);
        
        if (bestPoint.address.coordinates) {
          currentPos = bestPoint.address.coordinates;
          const travelTime = this.calculateHaversineDistance(currentPos, bestPoint.address.coordinates) / averageSpeedKmh * 60;
          currentTimeMinutes += travelTime + stopTimeMinutes;
        }
      } else {
        // Aucun point valide trouvé, prendre le plus proche
        if (remaining.length > 0) {
          let closestPoint = remaining[0];
          let closestDistance = Infinity;
          let closestIndex = 0;

          remaining.forEach((point, index) => {
            if (point.address.coordinates) {
              const distance = this.calculateHaversineDistance(currentPos, point.address.coordinates);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
                closestIndex = index;
              }
            }
          });

          optimized.push(closestPoint);
          remaining.splice(closestIndex, 1);
          
          if (closestPoint.address.coordinates) {
            currentPos = closestPoint.address.coordinates;
            currentTimeMinutes += (closestDistance / averageSpeedKmh) * 60 + stopTimeMinutes;
          }
        }
      }
    }

    return optimized;
  }

  // Optimisation simple avec calcul des temps
  private static optimizeSimpleWithTimeConstraints(
    points: DeliveryPoint[], 
    userPosition: UserPosition, 
    distanceMatrix: number[][],
    currentTimeMinutes: number,
    stopTimeMinutes: number,
    averageSpeedKmh: number
  ): DeliveryPoint[] {
    const optimized = this.optimizeSimple(points, userPosition, distanceMatrix);
    let cumulativeTime = currentTimeMinutes;

    optimized.forEach(point => {
      if (point.distance) {
        cumulativeTime += (point.distance / averageSpeedKmh) * 60;
      }
      point.estimatedTime = this.minutesToTime(cumulativeTime);
      cumulativeTime += stopTimeMinutes;
    });

    return optimized;
  }

  // Utilitaires pour conversion temps
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Calculer l'heure estimée d'arrivée avec paramètres configurables
  static calculateEstimatedTime(
    order: number, 
    startTime: string, 
    stopTimeMinutes: number = 15,
    previousDistance: number = 0,
    averageSpeedKmh: number = 30
  ): string {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    // Temps de trajet pour arriver à ce point (en minutes)
    const travelTime = previousDistance > 0 ? (previousDistance / averageSpeedKmh) * 60 : 0;
    
    // Temps total = début + (arrêts précédents * temps d'arrêt) + temps de trajet
    const totalMinutes = startTotalMinutes + (order - 1) * stopTimeMinutes + travelTime;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Calculer le temps total de la tournée
  static calculateTotalTourTime(
    points: DeliveryPoint[],
    startTime: string,
    stopTimeMinutes: number = 15,
    averageSpeedKmh: number = 30,
    returnToDepot: boolean = true
  ): { totalTime: string; endTime: string; totalDistance: number } {
    if (points.length === 0) {
      return { totalTime: '00:00', endTime: startTime, totalDistance: 0 };
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    // Calculer le temps total de déplacement
    const totalDistance = points.reduce((sum, point) => sum + (point.distance || 0), 0);
    const travelTimeMinutes = (totalDistance / averageSpeedKmh) * 60;
    
    // Temps d'arrêt total
    const stopTimeTotal = points.length * stopTimeMinutes;
    
    // Temps de retour au dépôt si nécessaire
    let returnTime = 0;
    if (returnToDepot && points.length > 0) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.address.coordinates) {
        // Estimation du retour (on pourrait améliorer avec une vraie distance)
        const returnDistance = this.calculateHaversineDistance(
          lastPoint.address.coordinates,
          { lat: 45.9097, lng: 6.1588 } // Default depot
        );
        returnTime = (returnDistance / averageSpeedKmh) * 60;
      }
    }
    
    const totalMinutes = travelTimeMinutes + stopTimeTotal + returnTime;
    const endTotalMinutes = startTotalMinutes + totalMinutes;
    
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = Math.round(totalMinutes % 60);
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = Math.round(endTotalMinutes % 60);
    
    return {
      totalTime: `${totalHours.toString().padStart(2, '0')}:${totalMins.toString().padStart(2, '0')}`,
      endTime: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
      totalDistance: Math.round(totalDistance * 100) / 100
    };
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