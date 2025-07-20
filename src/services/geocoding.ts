import { UserPosition } from '../types';

// Simulated geocoding data for development
const SIMULATED_ADDRESSES = new Map<string, { lat: number; lng: number }>([
  ['123 Rue de la Paix, 75001 Paris', { lat: 48.8566, lng: 2.3522 }],
  ['45 Avenue des Champs-Élysées, 75008 Paris', { lat: 48.8698, lng: 2.3076 }],
  ['78 Boulevard Saint-Germain, 75005 Paris', { lat: 48.8534, lng: 2.3488 }],
  ['12 Place Vendôme, 75001 Paris', { lat: 48.8673, lng: 2.3299 }],
  ['156 Rue de la République, 69002 Lyon', { lat: 45.7640, lng: 4.8357 }],
  ['89 Cours Mirabeau, 13100 Aix-en-Provence', { lat: 43.5263, lng: 5.4497 }],
  ['34 Rue Nationale, 59000 Lille', { lat: 50.6292, lng: 3.0573 }],
  ['67 Place Bellecour, 69002 Lyon', { lat: 45.7578, lng: 4.8320 }]
]);

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Check if we have simulated data for this address
    const simulated = SIMULATED_ADDRESSES.get(address);
    if (simulated) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return simulated;
    }

    // Try to use real geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    
    // Fallback: generate coordinates based on address hash for consistency
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const baseLat = 48.8566; // Paris center
    const baseLng = 2.3522;
    const offsetLat = (hash % 200) / 10000; // Small random offset
    const offsetLng = (hash % 300) / 10000;
    
    return {
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback: generate coordinates based on address hash for consistency
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const baseLat = 48.8566; // Paris center
    const baseLng = 2.3522;
    const offsetLat = (hash % 200) / 10000; // Small random offset
    const offsetLng = (hash % 300) / 10000;
    
    return {
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng
    };
  }
}

export async function getCurrentPosition(): Promise<UserPosition | null> {
  return new Promise((resolve) => {
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