import React from 'react';
import { 
  Navigation, 
  MapPin, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { DeliveryPoint } from '../types';

interface NavigationModeSelectorProps {
  deliveryPoints: DeliveryPoint[];
  onModeSelect: (mode: 'dawra' | 'google' | 'waze') => void;
  onCancel: () => void;
}

export const NavigationModeSelector: React.FC<NavigationModeSelectorProps> = ({
  deliveryPoints,
  onModeSelect,
  onCancel
}) => {
  const handleLaunchGoogleMaps = () => {
    // Create a URL with multiple waypoints for the entire route
    const waypoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .map(point => {
        const { lat, lng } = point.address.coordinates!;
        return `${lat},${lng}`;
      })
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
    onModeSelect('google');
  };

  const handleLaunchWaze = () => {
    // Waze doesn't support multiple waypoints in URL, so we'll launch to first destination
    // and the user can navigate through the route in Waze
    const firstPoint = deliveryPoints.find(point => point.address.coordinates);
    if (firstPoint) {
      const { lat, lng } = firstPoint.address.coordinates!;
      const url = `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;
      window.open(url, '_blank');
      onModeSelect('waze');
    }
  };

  const handleUseDawra = () => {
    onModeSelect('dawra');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <Navigation size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Choisir le mode de navigation
          </h2>
          <p className="text-gray-600">
            Comment souhaitez-vous naviguer pour votre tournée de {deliveryPoints.length} arrêts ?
          </p>
        </div>

        <div className="space-y-3">
          {/* Google Maps Option */}
          <button
            onClick={handleLaunchGoogleMaps}
            className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-3"
          >
            <ExternalLink size={24} />
            <div className="text-left">
              <div className="font-semibold">Google Maps</div>
              <div className="text-sm opacity-90">Route complète avec tous les arrêts</div>
            </div>
          </button>

          {/* Waze Option */}
          <button
            onClick={handleLaunchWaze}
            className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-3"
          >
            <Smartphone size={24} />
            <div className="text-left">
              <div className="font-semibold">Waze</div>
              <div className="text-sm opacity-90">Navigation intelligente et trafic en temps réel</div>
            </div>
          </button>

          {/* Dawra Internal Option */}
          <button
            onClick={handleUseDawra}
            className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-3"
          >
            <MapPin size={24} />
            <div className="text-left">
              <div className="font-semibold">Navigation Dawra</div>
              <div className="text-sm opacity-90">Interface intégrée avec suivi des livraisons</div>
            </div>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};