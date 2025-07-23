import { TruckLocation } from '../types';

export const DEFAULT_TRUCK_LOCATIONS: TruckLocation[] = [
  { id: 'front-left', name: 'Avant Gauche', color: '#ef4444', isDefault: true, isCustom: false },
  { id: 'front-right', name: 'Avant Droite', color: '#f97316', isDefault: true, isCustom: false },
  { id: 'middle-left', name: 'Milieu Gauche', color: '#eab308', isDefault: true, isCustom: false },
  { id: 'middle-right', name: 'Milieu Droite', color: '#22c55e', isDefault: true, isCustom: false },
  { id: 'back-left', name: 'Arrière Gauche', color: '#06b6d4', isDefault: true, isCustom: false },
  { id: 'back-right', name: 'Arrière Droite', color: '#8b5cf6', isDefault: true, isCustom: false },
  { id: 'floor', name: 'Sol', color: '#64748b', isDefault: true, isCustom: false },
  { id: 'cab', name: 'Cabine', color: '#f59e0b', isDefault: true, isCustom: false },
];