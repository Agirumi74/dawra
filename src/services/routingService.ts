import { Package, DeliveryPoint, UserPosition } from '../types';
import { AddressService } from './addressService';

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function groupPackagesByAddress(packages: Package[]): DeliveryPoint[] {
  const addressGroups = new Map<string, Package[]>();
  packages.forEach(pkg => {
    const addressKey = AddressService.formatAddress(pkg.address);
    if (!addressGroups.has(addressKey)) {
      addressGroups.set(addressKey, []);
    }
    addressGroups.get(addressKey)!.push(pkg);
  });
  const points: DeliveryPoint[] = [];
  let order = 1;
  addressGroups.forEach((pkgs, addressKey) => {
    const firstPkg = pkgs[0];
    const allDelivered = pkgs.every(p => p.status === 'delivered');
    const someDelivered = pkgs.some(p => p.status === 'delivered');
    let status: 'pending' | 'completed' | 'partial' = 'pending';
    if (allDelivered) status = 'completed';
    else if (someDelivered) status = 'partial';
    points.push({
      id: `point-${addressKey.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '')}`,
      address: firstPkg.address,
      packages: pkgs,
      status,
      order: order++,
      distance: 0
    });
  });
  return points;
}

export async function optimizeRoute(packages: Package[], userPosition: UserPosition): Promise<DeliveryPoint[]> {
  const points = groupPackagesByAddress(packages.filter(p => p.status === 'pending'));
  if (points.length === 0) return [];
  // Ensure all addresses have coordinates
  const geocodedPoints = await Promise.all(
    points.map(async (point) => {
      if (!point.address.coordinates) {
        const coords = await AddressService.geocodeAddress(point.address);
        if (coords) {
          point.address.coordinates = coords;
          point.packages.forEach(pkg => {
            pkg.address.coordinates = coords;
          });
        }
      }
      return point;
    })
  );
  const validPoints: DeliveryPoint[] = geocodedPoints.filter(point => point.address.coordinates);
  console.log('Optimisation tournée - points:', validPoints.map(p => ({
    id: p.id,
    address: p.address.full_address,
    coords: p.address.coordinates,
    packages: p.packages.map(pkg => pkg.id)
  })));
  if (validPoints.length === 0) return [];
  const optimized: DeliveryPoint[] = [];
  const unvisited: DeliveryPoint[] = [...validPoints];
  let currentPos: { lat: number; lng: number } = { lat: userPosition.lat, lng: userPosition.lng };
  let order = 1;
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const point = unvisited[i];
      if (point.address.coordinates) {
        const distance = calculateDistance(
          currentPos.lat,
          currentPos.lng,
          point.address.coordinates.lat,
          point.address.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
    }
    const nearestPoint: DeliveryPoint = unvisited.splice(nearestIndex, 1)[0];
    nearestPoint.order = order++;
    nearestPoint.distance = minDistance;
    optimized.push(nearestPoint);
    if (nearestPoint.address.coordinates) {
      currentPos = {
        lat: nearestPoint.address.coordinates.lat,
        lng: nearestPoint.address.coordinates.lng
      };
    }
    console.log(`Étape ${nearestPoint.order}: ${nearestPoint.address.full_address} (distance: ${minDistance.toFixed(2)} km)`);
  }
  console.log('Ordre optimisé:', optimized.map(p => ({
    order: p.order,
    address: p.address.full_address,
    distance: p.distance
  })));
  return optimized;
}

export async function getCurrentPosition(): Promise<UserPosition | null> {
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