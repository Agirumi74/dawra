export interface Address {
  id: string;
  street_number: string;
  street_name: string;
  postal_code: string;
  city: string;
  country: string;
  full_address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Package {
  id: string;
  barcode?: string;
  address: Address;
  location: string;
  notes: string;
  type: 'particulier' | 'entreprise';
  priority?: 'standard' | 'express_midi' | 'premier';
  status: 'pending' | 'delivered' | 'failed';
  photo?: string;
  createdAt: Date;
  timeWindow?: {
    start?: string; // Format HH:MM
    end?: string;   // Format HH:MM
  };
}

export interface DeliveryPoint {
  id: string;
  address: Address;
  packages: Package[];
  status: 'pending' | 'completed' | 'partial';
  order: number;
  distance?: number;
  priority: 'standard' | 'express_midi' | 'premier';
  estimatedTime?: string; // Format HH:MM
}

export interface TruckLocation {
  id: string;
  name: string;
  color: string;
}

export type AppView = 'home' | 'scan' | 'route' | 'map' | 'gps' | 'settings';

export interface UserPosition {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    country?: string;
  };
}

export interface BANSuggestion {
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    postcode: string;
    city: string;
    context: string;
    type: string;
    importance: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface RouteConstraints {
  timeWindows?: { [addressId: string]: { start: string; end: string } };
  priorities?: { [addressId: string]: number }; // 1 = highest priority
  maxDeliveryTime?: number; // minutes
}

export interface OptimizationMode {
  type: 'simple' | 'constrained';
  constraints?: RouteConstraints;
}