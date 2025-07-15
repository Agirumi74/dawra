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
  status: 'pending' | 'delivered' | 'failed';
  createdAt: Date;
}

export interface DeliveryPoint {
  id: string;
  address: Address;
  packages: Package[];
  status: 'pending' | 'completed' | 'partial';
  order: number;
  distance?: number;
}

export interface TruckLocation {
  id: string;
  name: string;
  color: string;
}

export type AppView = 'home' | 'scan' | 'route' | 'map' | 'settings';

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