import { Package, RouteStop, UserPosition } from '../types';

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

export function optimizeRoute(packages: Package[], userPosition: UserPosition): RouteStop[] {
  if (packages.length === 0) return [];

  const unvisited = packages.filter(pkg => pkg.coordinates && pkg.status === 'pending');
  const route: RouteStop[] = [];
  let currentPos = userPosition;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const pkg = unvisited[i];
      if (pkg.coordinates) {
        const distance = calculateDistance(
          currentPos.lat,
          currentPos.lng,
          pkg.coordinates.lat,
          pkg.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
    }

    const nearestPackage = unvisited.splice(nearestIndex, 1)[0];
    route.push({
      package: nearestPackage,
      order: route.length + 1,
      distance: minDistance,
    });

    if (nearestPackage.coordinates) {
      currentPos = nearestPackage.coordinates;
    }
  }

  return route;
}