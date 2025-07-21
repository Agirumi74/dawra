import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryPoint, UserPosition } from '../types';
import { Navigation, Package, ArrowLeft } from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryMapProps {
  points: DeliveryPoint[];
  currentPoint: DeliveryPoint | null;
  userPosition: UserPosition | null;
  onPointComplete: (pointId: string) => void;
  onBack: () => void;
}

const RouteController: React.FC<{ 
  points: DeliveryPoint[], 
  currentPoint: DeliveryPoint | null,
  userPosition: UserPosition | null 
}> = ({ points, currentPoint, userPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (currentPoint?.address.coordinates) {
      map.setView([currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng], 16);
    } else if (userPosition) {
      map.setView([userPosition.lat, userPosition.lng], 13);
    }
  }, [currentPoint, userPosition, map]);

  return null;
};

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  points,
  currentPoint,
  userPosition,
  onPointComplete,
  onBack
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris default

  useEffect(() => {
    if (currentPoint?.address.coordinates) {
      setMapCenter([currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng]);
    } else if (userPosition) {
      setMapCenter([userPosition.lat, userPosition.lng]);
    }
  }, [currentPoint, userPosition]);

  const createCustomIcon = (color: string, isActive: boolean = false) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid ${isActive ? '#fff' : '#333'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${isActive ? '📍' : '📦'}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const getPointColor = (point: DeliveryPoint) => {
    if (point.status === 'completed') return '#10b981'; // green
    if (point.status === 'partial') return '#f59e0b'; // amber
    if (currentPoint?.id === point.id) return '#3b82f6'; // blue
    return '#6b7280'; // gray
  };

  const handleCompletePoint = () => {
    if (currentPoint) {
      onPointComplete(currentPoint.id);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-md z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">Navigation</h2>
            {currentPoint && (
              <p className="text-sm text-gray-600">
                Point {currentPoint.order} sur {points.length}
              </p>
            )}
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RouteController 
            points={points} 
            currentPoint={currentPoint} 
            userPosition={userPosition}
          />

          {/* User position */}
          {userPosition && (
            <Marker 
              position={[userPosition.lat, userPosition.lng]}
              icon={createCustomIcon('#ef4444', true)}
            >
              <Popup>Votre position</Popup>
            </Marker>
          )}

          {/* Delivery points */}
          {points.map((point) => {
            if (!point.address.coordinates) return null;
            
            return (
              <Marker
                key={point.id}
                position={[point.address.coordinates.lat, point.address.coordinates.lng]}
                icon={createCustomIcon(getPointColor(point), currentPoint?.id === point.id)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Point {point.order}</h3>
                    <p className="text-sm">{point.address.full_address}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {point.packages.length} colis
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Current point info */}
      {currentPoint && (
        <div className="bg-white p-4 shadow-lg border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Point {currentPoint.order}</h3>
              <span className="text-sm text-gray-600">
                {currentPoint.packages.length} colis
              </span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{currentPoint.address.full_address}</p>
            </div>

            <div className="space-y-2">
              {currentPoint.packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">{pkg.location}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    pkg.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pkg.status === 'delivered' ? 'Livré' :
                     pkg.status === 'failed' ? 'Échec' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCompletePoint}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Navigation size={20} />
              <span>Marquer comme livré</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};