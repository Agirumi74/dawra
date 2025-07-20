import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Route as RouteIcon, 
  CheckCircle,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { DeliveryPoint, UserPosition, Package } from '../types';
import { RouteOptimizer } from '../services/routeOptimization';
import { AddressDatabaseService } from '../services/addressDatabase';

// Fix for default markers
delete (L.Icon.Default.prototype as unknown)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPSNavigationProps {
  deliveryPoints: DeliveryPoint[];
  currentPointIndex: number;
  userPosition: UserPosition | null;
  onDeliveryComplete: (pointId: string) => void;
  onAddAddress: () => void;
  onRecalculateRoute: () => void;
  onBack: () => void;
  updatePackage?: (id: string, updates: Partial<Package>) => void;
  setCurrentPointIndex?: (index: number) => void;
}

const MapController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

export const GPSNavigation: React.FC<GPSNavigationProps> = ({
  deliveryPoints,
  currentPointIndex,
  userPosition,
  onDeliveryComplete,
  onAddAddress,
  onRecalculateRoute,
  onBack,
  updatePackage,
  setCurrentPointIndex
}) => {
  const [routePolyline, setRoutePolyline] = useState<{ lat: number; lng: number }[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapZoom, setMapZoom] = useState(13);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const currentPoint = deliveryPoints[currentPointIndex];
  const nextPoint = deliveryPoints[currentPointIndex + 1];

  // Mettre à jour la carte quand la position change
  useEffect(() => {
    if (currentPoint?.address.coordinates) {
      setMapCenter([currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng]);
      setMapZoom(16);
    } else if (userPosition) {
      setMapCenter([userPosition.lat, userPosition.lng]);
      setMapZoom(13);
    }
  }, [currentPoint, userPosition]);

  // Calculer l'itinéraire vers le point actuel
  useEffect(() => {
    const calculateRoute = async () => {
      if (!userPosition || !currentPoint?.address.coordinates) {
        setRoutePolyline([]);
        return;
      }

      setIsLoadingRoute(true);
      try {
        const polyline = await RouteOptimizer.getRoutePolyline(
          userPosition,
          currentPoint.address.coordinates
        );
        setRoutePolyline(polyline);

        // Calculer la distance et le temps estimé
        const dist = RouteOptimizer.calculateHaversineDistance(userPosition, currentPoint.address.coordinates);
        setDistance(dist);
        setEstimatedTime(Math.round((dist / 50) * 60)); // Estimation: 50 km/h moyenne
      } catch (error) {
        console.error('Erreur calcul itinéraire:', error);
        setRoutePolyline([]);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    calculateRoute();
  }, [userPosition, currentPoint]);

  const handleDeliveryComplete = () => {
    if (currentPoint) {
      onDeliveryComplete(currentPoint.id);
    }
  };

  const handleFailedDelivery = () => {
    if (currentPoint) {
      // Mark packages as failed instead of delivered
      currentPoint.packages.forEach(pkg => {
        if (updatePackage) {
          updatePackage(pkg.id, { status: 'failed' });
        }
        AddressDatabaseService.addDeliveryHistory(pkg.address.id, false, 'Chauffeur');
      });
      
      // Move to next point
      const nextIndex = currentPointIndex + 1;
      if (nextIndex < deliveryPoints.length) {
        if (setCurrentPointIndex) {
          setCurrentPointIndex(nextIndex);
        }
      } else {
        alert('Tournée terminée !');
        onBack();
      }
    }
  };

  const openInGPS = () => {
    if (!currentPoint?.address.coordinates) return;

    const { lat, lng } = currentPoint.address.coordinates;

    // Détecter le système et ouvrir l'app GPS appropriée
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Apple Maps
      window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`);
    } else if (isAndroid) {
      // Android: Google Maps
      window.open(`google.navigation:q=${lat},${lng}`);
    } else {
      // Web: Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    }
  };

  const createCustomIcon = (color: string, text: string) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${text}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const getUserIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background-color: #ef4444;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -5px;
            left: -5px;
            width: 30px;
            height: 30px;
            border: 2px solid #ef4444;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        </style>
      `,
      className: 'user-location-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  if (!currentPoint) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournée terminée !</h2>
          <p className="text-gray-600 mb-6">Toutes les livraisons ont été effectuées</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header avec informations de navigation */}
      <div className="bg-white shadow-md p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {currentPoint.order}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Point {currentPoint.order} sur {deliveryPoints.length}
              </h2>
              <p className="text-sm text-gray-600">
                {currentPoint.packages.length} colis
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onAddAddress}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              title="Ajouter une adresse"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={onRecalculateRoute}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Recalculer l'itinéraire"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Informations de distance et temps */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {distance && (
              <div className="flex items-center space-x-1 text-blue-600">
                <RouteIcon size={16} />
                <span>{distance.toFixed(1)} km</span>
              </div>
            )}
            {estimatedTime && (
              <div className="flex items-center space-x-1 text-green-600">
                <Clock size={16} />
                <span>{estimatedTime} min</span>
              </div>
            )}
          </div>
          
          {isLoadingRoute && (
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw size={16} className="animate-spin" />
              <span>Calcul...</span>
            </div>
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Position utilisateur */}
          {userPosition && (
            <Marker 
              position={[userPosition.lat, userPosition.lng]}
              icon={getUserIcon()}
            />
          )}

          {/* Point de livraison actuel */}
          {currentPoint.address.coordinates && (
            <Marker
              position={[currentPoint.address.coordinates.lat, currentPoint.address.coordinates.lng]}
              icon={createCustomIcon('#3b82f6', currentPoint.order.toString())}
            />
          )}

          {/* Points suivants (aperçu) */}
          {deliveryPoints.slice(currentPointIndex + 1, currentPointIndex + 4).map((point) => {
            if (!point.address.coordinates) return null;
            return (
              <Marker
                key={point.id}
                position={[point.address.coordinates.lat, point.address.coordinates.lng]}
                icon={createCustomIcon('#6b7280', point.order.toString())}
              />
            );
          })}

          {/* Itinéraire */}
          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline.map(p => [p.lat, p.lng])}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Contrôles de zoom */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          <button
            onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))}
            className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => setMapZoom(Math.max(mapZoom - 1, 1))}
            className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl font-bold">−</span>
          </button>
        </div>
      </div>

      {/* Informations du point actuel */}
      <div className="bg-white border-t shadow-lg p-4">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {currentPoint.address.full_address}
              </h3>
              {nextPoint && (
                <p className="text-sm text-gray-600">
                  Suivant: {nextPoint.address.full_address}
                </p>
              )}
            </div>
          </div>

          {/* Colis à livrer */}
          <div className="space-y-2">
            {currentPoint.packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-blue-600" />
                  <span className="text-sm font-medium">{pkg.location}</span>
                  {pkg.notes && (
                    <span className="text-xs text-gray-500">({pkg.notes})</span>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {pkg.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={openInGPS}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Navigation size={20} />
            <span>Ouvrir GPS</span>
          </button>
          
          <button
            onClick={handleDeliveryComplete}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle size={20} />
            <span>Colis livré</span>
          </button>
          
          <button
            onClick={handleFailedDelivery}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <X size={20} />
            <span>Échec</span>
          </button>
        </div>

        {/* Progression */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span>{currentPointIndex + 1}/{deliveryPoints.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPointIndex + 1) / deliveryPoints.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};