import { TruckLocation } from '../types';

export const DEFAULT_TRUCK_LOCATIONS: TruckLocation[] = [
  { id: 'front-left', name: 'Avant Gauche', color: '#ef4444' },
  { id: 'front-right', name: 'Avant Droite', color: '#f97316' },
  { id: 'middle-left', name: 'Milieu Gauche', color: '#eab308' },
  { id: 'middle-right', name: 'Milieu Droite', color: '#22c55e' },
  { id: 'back-left', name: 'Arrière Gauche', color: '#06b6d4' },
  { id: 'back-right', name: 'Arrière Droite', color: '#8b5cf6' },
  { id: 'floor', name: 'Sol', color: '#64748b' },
  { id: 'cab', name: 'Cabine', color: '#f59e0b' },
];