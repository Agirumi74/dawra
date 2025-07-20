import { DeliveryPoint, UserPosition } from '../types';

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  coordinates: [number, number];
}

export interface RouteDirections {
  fromPoint: string;
  toPoint: string;
  totalDistance: number;
  totalDuration: number;
  steps: RouteStep[];
  polyline: { lat: number; lng: number }[];
}

export class RouteDirectionsService {
  private static readonly OSRM_SERVER = 'https://router.project-osrm.org';

  /**
   * Obtenir les directions détaillées entre deux points
   */
  static async getDirections(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<RouteDirections | null> {
    const url = `${this.OSRM_SERVER}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?steps=true&geometries=geojson&overview=full`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('OSRM API error');
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const steps: RouteStep[] = [];

      // Traiter chaque étape de la route
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          steps.push({
            instruction: this.formatInstruction(step.maneuver),
            distance: step.distance,
            duration: step.duration,
            maneuver: step.maneuver.type,
            coordinates: [step.maneuver.location[1], step.maneuver.location[0]] // lat, lng
          });
        }
      }

      // Extraire la polyline
      const polyline = route.geometry.coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      return {
        fromPoint: `${from.lat.toFixed(6)}, ${from.lng.toFixed(6)}`,
        toPoint: `${to.lat.toFixed(6)}, ${to.lng.toFixed(6)}`,
        totalDistance: route.distance,
        totalDuration: route.duration,
        steps,
        polyline
      };
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }

  /**
   * Obtenir les directions pour toute une tournée
   */
  static async getTourDirections(
    startPosition: UserPosition,
    deliveryPoints: DeliveryPoint[]
  ): Promise<RouteDirections[]> {
    const directions: RouteDirections[] = [];
    let currentPosition = startPosition;

    for (const point of deliveryPoints) {
      if (!point.address.coordinates) continue;

      const stepDirections = await this.getDirections(currentPosition, point.address.coordinates);
      if (stepDirections) {
        directions.push(stepDirections);
        currentPosition = point.address.coordinates;
      }
    }

    return directions;
  }

  /**
   * Formatter les instructions de navigation
   */
  private static formatInstruction(maneuver: any): string {
    const type = maneuver.type;
    const modifier = maneuver.modifier;
    
    switch (type) {
      case 'depart':
        return 'Départ';
      case 'arrive':
        return 'Arrivée à destination';
      case 'turn':
        switch (modifier) {
          case 'left':
            return 'Tourner à gauche';
          case 'right':
            return 'Tourner à droite';
          case 'slight left':
            return 'Tourner légèrement à gauche';
          case 'slight right':
            return 'Tourner légèrement à droite';
          case 'sharp left':
            return 'Tourner fortement à gauche';
          case 'sharp right':
            return 'Tourner fortement à droite';
          default:
            return 'Tourner';
        }
      case 'new name':
        return 'Continuer tout droit';
      case 'continue':
        return 'Continuer tout droit';
      case 'merge':
        return modifier === 'left' ? 'Se rabattre à gauche' : 'Se rabattre à droite';
      case 'on ramp':
        return 'Prendre la bretelle d\'accès';
      case 'off ramp':
        return 'Prendre la sortie';
      case 'fork':
        return modifier === 'left' ? 'Prendre à gauche à la bifurcation' : 'Prendre à droite à la bifurcation';
      case 'roundabout':
        return 'Entrer dans le rond-point';
      case 'roundabout turn':
        const exitNumber = maneuver.exit ? ` et prendre la ${maneuver.exit}ème sortie` : '';
        return `Dans le rond-point${exitNumber}`;
      case 'notification':
        return 'Attention';
      default:
        return 'Continuer';
    }
  }

  /**
   * Calculer la distance et le temps formatés
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  /**
   * Obtenir les instructions vocales simplifiées
   */
  static getVoiceInstruction(step: RouteStep): string {
    const distance = this.formatDistance(step.distance);
    
    switch (step.maneuver) {
      case 'turn':
        return `Dans ${distance}, ${step.instruction.toLowerCase()}`;
      case 'roundabout':
      case 'roundabout turn':
        return `Dans ${distance}, ${step.instruction.toLowerCase()}`;
      case 'arrive':
        return 'Vous êtes arrivé à destination';
      default:
        return `Dans ${distance}, ${step.instruction.toLowerCase()}`;
    }
  }
}