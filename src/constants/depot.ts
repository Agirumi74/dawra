import { Address } from '../types';

export const DEFAULT_DEPOT_ADDRESS: Address = {
  id: 'default-depot',
  street_number: '10',
  street_name: 'rue du pré paillard',
  postal_code: '74940',
  city: 'Annecy-le-Vieux',
  country: 'France',
  full_address: '10 rue du pré paillard, 74940 Annecy-le-Vieux, France',
  coordinates: {
    lat: 45.9097,
    lng: 6.1588
  }
};

export const UPS_DEPOT_ADDRESS: Address = {
  id: 'ups-depot',
  street_number: '14',
  street_name: 'rue du pré de challes',
  postal_code: '74940',
  city: 'Annecy-le-Vieux',
  country: 'France',
  full_address: '14 rue du pré de challes, 74940 Annecy-le-Vieux, France',
  coordinates: {
    lat: 45.9123,
    lng: 6.1605
  }
};

export const DEFAULT_ROUTE_SETTINGS = {
  stopTimeMinutes: 5, // Temps d'arrêt par défaut en minutes
  startTime: '08:00', // Heure de départ par défaut
  averageSpeedKmh: 30, // Vitesse moyenne en ville
  returnToDepot: true, // Retour au dépôt en fin de tournée
};