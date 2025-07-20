import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryPoint, UserPosition } from '../types';
import { 
  ArrowLeft, 
  Home, 
  Building,
  CheckCircle,
  Clock,
  Navigation,
  Play
} from 'lucide-react';
import { DEFAULT_DEPOT_ADDRESS, UPS_DEPOT_ADDRESS } from '../constants/depot';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FullRouteMapViewProps {
  points: DeliveryPoint[];
  userPosition: UserPosition | null;
  onBack: () => void;
  onStartNavigation: () => void;
}

const RouteOverviewController: React.FC<{ 
  points: DeliveryPoint[],
  userPosition: UserPosition | null 
}> = ({ points, userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds([]);
      
      // Add depot
      bounds.extend([DEFAULT_DEPOT_ADDRESS.coordinates!.lat, DEFAULT_DEPOT_ADDRESS.coordinates!.lng]);
      
      // Add all delivery points
      points.forEach(point => {
        if (point.address.coordinates) {
          bounds.extend([point.address.coordinates.lat, point.address.coordinates.lng]);
        }
      });
      
      // Add UPS depot
      bounds.extend([UPS_DEPOT_ADDRESS.coordinates!.lat, UPS_DEPOT_ADDRESS.coordinates!.lng]);
      
      // Add user position if available
      if (userPosition) {
        bounds.extend([userPosition.lat, userPosition.lng]);
      }
      
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, userPosition, map]);

  return null;
};

export const FullRouteMapView: React.FC<FullRouteMapViewProps> = ({
  points,
  userPosition,
  onBack,
  onStartNavigation
}) => {
  const [mapCenter] = useState<[number, number]>([45.9097, 6.1588]); // Default depot

  const createCustomIcon = (color: string, symbol: string, size: number = 30) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: ${size <= 30 ? '12px' : '14px'};
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        ">
          ${symbol}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  };

  const getPointColor = (point: DeliveryPoint) => {
    if (point.status === 'completed') return '#10b981'; // green
    if (point.status === 'partial') return '#f59e0b'; // amber
    if (point.priority === 'premier') return '#ef4444'; // red for premier
    if (point.priority === 'express_midi') return '#f97316'; // orange for express
    return '#3b82f6'; // blue for standard
  };

  const generateRoutePolyline = () => {
    const routePoints: [number, number][] = [];
    
    // Start at depot
    routePoints.push([DEFAULT_DEPOT_ADDRESS.coordinates!.lat, DEFAULT_DEPOT_ADDRESS.coordinates!.lng]);
    
    // Add all delivery points in order
    points
      .sort((a, b) => a.order - b.order)
      .forEach(point => {
        if (point.address.coordinates) {
          routePoints.push([point.address.coordinates.lat, point.address.coordinates.lng]);
        }
      });
    
    // End at UPS depot
    routePoints.push([UPS_DEPOT_ADDRESS.coordinates!.lat, UPS_DEPOT_ADDRESS.coordinates!.lng]);
    
    return routePoints;
  };

  const routePolyline = generateRoutePolyline();
  const totalPoints = points.length;
  const completedPoints = points.filter(p => p.status === 'completed').length;
  const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-md z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <h2 className="text-lg font-semibold">Vue d'ensemble de la tournée</h2>
              <p className="text-sm text-gray-600">
                {completedPoints} / {totalPoints} livraisons • {progressPercentage}% terminé
              </p>
            </div>
          </div>

          <button
            onClick={onStartNavigation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Play size={16} />
            <span>Commencer</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RouteOverviewController 
            points={points}
            userPosition={userPosition}
          />

          {/* Complete Route Polyline */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              color="#3b82f6"
              weight={5}
              opacity={0.8}
            />
          )}

          {/* Completed route section (different color) */}
          {completedPoints > 0 && (
            <Polyline
              positions={routePolyline.slice(0, completedPoints + 2)} // +2 for depot + completed points
              color="#10b981"
              weight={7}
              opacity={0.9}
            />
          )}

          {/* Starting Depot */}
          <Marker 
            position={[DEFAULT_DEPOT_ADDRESS.coordinates!.lat, DEFAULT_DEPOT_ADDRESS.coordinates!.lng]}
            icon={createCustomIcon('#22c55e', '🏠', 40)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-green-600">Dépôt de départ</h3>
                <p className="text-sm">{DEFAULT_DEPOT_ADDRESS.full_address}</p>
                <p className="text-xs text-green-600 mt-1">Point de départ de la tournée</p>
              </div>
            </Popup>
          </Marker>

          {/* UPS Depot */}
          <Marker 
            position={[UPS_DEPOT_ADDRESS.coordinates!.lat, UPS_DEPOT_ADDRESS.coordinates!.lng]}
            icon={createCustomIcon('#8b5cf6', '🏢', 40)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-purple-600">Dépôt UPS</h3>
                <p className="text-sm">{UPS_DEPOT_ADDRESS.full_address}</p>
                <p className="text-xs text-purple-600 mt-1">Point final de la tournée</p>
              </div>
            </Popup>
          </Marker>

          {/* User position */}
          {userPosition && (
            <Marker 
              position={[userPosition.lat, userPosition.lng]}
              icon={createCustomIcon('#ef4444', '📍', 35)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-red-600">Votre position</h3>
                  <p className="text-xs text-gray-600">Position actuelle du véhicule</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Delivery points */}
          {points.map((point) => {
            if (!point.address.coordinates) return null;
            
            return (
              <Marker
                key={point.id}
                position={[point.address.coordinates.lat, point.address.coordinates.lng]}
                icon={createCustomIcon(
                  getPointColor(point), 
                  point.order.toString(),
                  35
                )}
              >
                <Popup>
                  <div className="p-3 min-w-48">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Point {point.order}</h3>
                      {point.status === 'completed' && (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                    </div>
                    
                    <p className="text-sm mb-2">{point.address.full_address}</p>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>Arrivée: {point.estimatedTime}</span>
                      </div>
                      <div>Distance: {(point.distance || 0).toFixed(1)} km</div>
                      <div>{point.packages.length} colis</div>
                    </div>

                    {point.priority !== 'standard' && (
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          point.priority === 'premier' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {point.priority === 'premier' ? 'Prioritaire' : 'Express'}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 space-y-1">
                      {point.packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center space-x-1 text-xs">
                          {pkg.type === 'entreprise' ? 
                            <Building size={12} className="text-gray-500" /> : 
                            <Home size={12} className="text-gray-500" />
                          }
                          <span>{pkg.location}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Route Summary */}
      <div className="bg-white p-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{totalPoints}</div>
            <div className="text-xs text-gray-600">Points total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{completedPoints}</div>
            <div className="text-xs text-gray-600">Terminés</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{totalPoints - completedPoints}</div>
            <div className="text-xs text-gray-600">Restants</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {points.reduce((total, point) => total + (point.distance || 0), 0).toFixed(1)} km
            </div>
            <div className="text-xs text-gray-600">Distance totale</div>
          </div>
        </div>
      </div>
    </div>
  );
};