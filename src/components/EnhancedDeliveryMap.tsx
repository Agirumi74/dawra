import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DeliveryPoint, UserPosition } from '../types';
import { 
  Navigation, 
  Package, 
  MapPin, 
  ArrowLeft, 
  Home, 
  Building,
  CheckCircle,
  X,
  AlertTriangle,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { DEFAULT_DEPOT_ADDRESS, UPS_DEPOT_ADDRESS } from '../constants/depot';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EnhancedDeliveryMapProps {
  points: DeliveryPoint[];
  currentPointIndex: number;
  userPosition: UserPosition | null;
  onPointComplete: (pointId: string, status: 'delivered' | 'failed', deliveryStatus?: string, reason?: string) => void;
  onNext: () => void;
  onBack: () => void;
  showFullRoute?: boolean;
}

const RouteController: React.FC<{ 
  points: DeliveryPoint[], 
  currentPointIndex: number,
  userPosition: UserPosition | null,
  showFullRoute: boolean
}> = ({ points, currentPointIndex, userPosition, showFullRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (showFullRoute && points.length > 0) {
      // Show full route with all points
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
      
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (!showFullRoute && points[currentPointIndex]?.address.coordinates) {
      // Focus on current point
      const currentPoint = points[currentPointIndex];
      map.setView([currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng], 16);
    } else if (userPosition) {
      map.setView([userPosition.lat, userPosition.lng], 13);
    }
  }, [currentPointIndex, userPosition, map, showFullRoute, points]);

  return null;
};

export const EnhancedDeliveryMap: React.FC<EnhancedDeliveryMapProps> = ({
  points,
  currentPointIndex,
  userPosition,
  onPointComplete,
  onNext,
  onBack,
  showFullRoute = false
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.9097, 6.1588]); // Default depot
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<string>('delivered');
  const [failureReason, setFailureReason] = useState<string>('');

  const currentPoint = points[currentPointIndex];

  useEffect(() => {
    if (currentPoint?.address.coordinates) {
      setMapCenter([currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng]);
    } else if (userPosition) {
      setMapCenter([userPosition.lat, userPosition.lng]);
    }
  }, [currentPoint, userPosition]);

  const createCustomIcon = (color: string, symbol: string, isActive: boolean = false) => {
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
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        ">
          ${symbol}
          ${isActive ? '<div style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid white;"></div>' : ''}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const getPointColor = (point: DeliveryPoint, index: number) => {
    if (point.status === 'completed') return '#10b981'; // green
    if (point.status === 'partial') return '#f59e0b'; // amber
    if (index === currentPointIndex) return '#3b82f6'; // blue
    if (index < currentPointIndex) return '#6b7280'; // gray (passed)
    return '#9ca3af'; // light gray (future)
  };

  const generateRoutePolyline = () => {
    const routePoints: [number, number][] = [];
    
    // Start at depot
    routePoints.push([DEFAULT_DEPOT_ADDRESS.coordinates!.lat, DEFAULT_DEPOT_ADDRESS.coordinates!.lng]);
    
    // Add all delivery points
    points.forEach(point => {
      if (point.address.coordinates) {
        routePoints.push([point.address.coordinates.lat, point.address.coordinates.lng]);
      }
    });
    
    // End at UPS depot
    routePoints.push([UPS_DEPOT_ADDRESS.coordinates!.lat, UPS_DEPOT_ADDRESS.coordinates!.lng]);
    
    return routePoints;
  };

  const handleDeliveryAction = (action: 'complete' | 'failed') => {
    if (action === 'complete') {
      setSelectedDeliveryStatus('delivered');
      setShowDeliveryModal(true);
    } else {
      setSelectedDeliveryStatus('absent');
      setShowDeliveryModal(true);
    }
  };

  const confirmDelivery = () => {
    if (currentPoint) {
      const status = selectedDeliveryStatus === 'delivered' ? 'delivered' : 'failed';
      onPointComplete(currentPoint.id, status, selectedDeliveryStatus, failureReason);
      setShowDeliveryModal(false);
      setFailureReason('');
      onNext();
    }
  };

  const deliveryStatusOptions = [
    { value: 'delivered', label: 'Livré avec succès', icon: CheckCircle, color: 'text-green-600' },
    { value: 'absent', label: 'Destinataire absent', icon: Home, color: 'text-orange-600' },
    { value: 'refused', label: 'Livraison refusée', icon: X, color: 'text-red-600' },
    { value: 'ups_relay', label: 'Dépôt point relais UPS', icon: Building, color: 'text-blue-600' },
    { value: 'address_incorrect', label: 'Adresse incorrecte', icon: MapPin, color: 'text-purple-600' },
    { value: 'access_denied', label: 'Accès refusé', icon: AlertTriangle, color: 'text-yellow-600' },
    { value: 'damaged', label: 'Colis endommagé', icon: Package, color: 'text-red-500' },
    { value: 'other', label: 'Autre raison', icon: AlertTriangle, color: 'text-gray-600' },
  ];

  const mapContainerClass = isFullscreen 
    ? "fixed inset-0 z-50" 
    : "h-64 md:h-96 relative";

  const routePolyline = generateRoutePolyline();

  return (
    <div className="flex flex-col h-full">
      {/* Delivery Status Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Statut de livraison</h3>
              <p className="text-sm text-gray-600">{currentPoint?.address.full_address}</p>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {deliveryStatusOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      checked={selectedDeliveryStatus === option.value}
                      onChange={(e) => setSelectedDeliveryStatus(e.target.value)}
                      className="text-blue-600"
                    />
                    <option.icon size={20} className={option.color} />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              
              {(selectedDeliveryStatus === 'other' || ['absent', 'refused', 'access_denied'].includes(selectedDeliveryStatus)) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Détails supplémentaires
                  </label>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="Précisez la raison..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelivery}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Header */}
      <div className="bg-white p-4 shadow-md z-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h2 className="text-lg font-semibold">Navigation - Point {currentPointIndex + 1}</h2>
            {currentPoint && (
              <p className="text-sm text-gray-600">
                {currentPoint.estimatedTime && (
                  <span className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>Arrivée: {currentPoint.estimatedTime}</span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={mapContainerClass}>
        <MapContainer
          center={mapCenter}
          zoom={showFullRoute ? 12 : 16}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RouteController 
            points={points} 
            currentPointIndex={currentPointIndex}
            userPosition={userPosition}
            showFullRoute={showFullRoute}
          />

          {/* Route Polyline */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
              dashArray="5, 10"
            />
          )}

          {/* Starting Depot */}
          <Marker 
            position={[DEFAULT_DEPOT_ADDRESS.coordinates!.lat, DEFAULT_DEPOT_ADDRESS.coordinates!.lng]}
            icon={createCustomIcon('#22c55e', '🏠')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-green-600">Dépôt de départ</h3>
                <p className="text-sm">{DEFAULT_DEPOT_ADDRESS.full_address}</p>
              </div>
            </Popup>
          </Marker>

          {/* UPS Depot */}
          <Marker 
            position={[UPS_DEPOT_ADDRESS.coordinates!.lat, UPS_DEPOT_ADDRESS.coordinates!.lng]}
            icon={createCustomIcon('#8b5cf6', '🏢')}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-purple-600">Dépôt UPS</h3>
                <p className="text-sm">{UPS_DEPOT_ADDRESS.full_address}</p>
              </div>
            </Popup>
          </Marker>

          {/* User position */}
          {userPosition && (
            <Marker 
              position={[userPosition.lat, userPosition.lng]}
              icon={createCustomIcon('#ef4444', '📍', true)}
            >
              <Popup>Votre position</Popup>
            </Marker>
          )}

          {/* Delivery points */}
          {points.map((point, index) => {
            if (!point.address.coordinates) return null;
            
            return (
              <Marker
                key={point.id}
                position={[point.address.coordinates.lat, point.address.coordinates.lng]}
                icon={createCustomIcon(
                  getPointColor(point, index), 
                  point.order.toString(),
                  index === currentPointIndex
                )}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Point {point.order}</h3>
                    <p className="text-sm">{point.address.full_address}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {point.packages.length} colis
                    </p>
                    {point.estimatedTime && (
                      <p className="text-xs text-blue-600 mt-1">
                        Arrivée prévue: {point.estimatedTime}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Current point info (only in non-fullscreen mode) */}
      {!isFullscreen && currentPoint && (
        <div className="bg-white p-4 shadow-lg border-t">
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    {currentPoint.address.full_address}
                  </div>
                  {currentPoint.distance && (
                    <div className="text-sm text-blue-700 mt-1">
                      Distance: {currentPoint.distance.toFixed(1)} km
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {currentPoint.packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {pkg.type === 'entreprise' ? 
                      <Building size={16} className="text-gray-500" /> : 
                      <Home size={16} className="text-gray-500" />
                    }
                    <span className="text-sm font-medium">{pkg.location}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDeliveryAction('complete')}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle size={20} />
                <span>Livrer</span>
              </button>
              <button
                onClick={() => handleDeliveryAction('failed')}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <X size={20} />
                <span>Échec</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};