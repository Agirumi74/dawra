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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-0 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-md sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <Navigation size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Choisir le mode de navigation
          </h2>
          <p className="text-gray-600">
            Comment souhaitez-vous naviguer pour votre tournée de {deliveryPoints.length} arrêts ?
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Maps Option */}
          <button
            onClick={handleLaunchGoogleMaps}
            className="w-full bg-green-600 text-white p-5 rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors flex items-center space-x-4 touch-manipulation"
          >
            <ExternalLink size={28} />
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Google Maps</div>
              <div className="text-sm opacity-90">Route complète avec tous les arrêts</div>
            </div>
          </button>

          {/* Waze Option */}
          <button
            onClick={handleLaunchWaze}
            className="w-full bg-blue-600 text-white p-5 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center space-x-4 touch-manipulation"
          >
            <Smartphone size={28} />
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Waze</div>
              <div className="text-sm opacity-90">Navigation intelligente et trafic en temps réel</div>
            </div>
          </button>

          {/* Dawra Internal Option */}
          <button
            onClick={handleUseDawra}
            className="w-full bg-purple-600 text-white p-5 rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-colors flex items-center space-x-4 touch-manipulation"
          >
            <MapPin size={28} />
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Navigation Dawra</div>
              <div className="text-sm opacity-90">Interface intégrée avec suivi des livraisons</div>
            </div>
          </button>
        </div>

        <div className="mt-8">
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-700 py-4 px-4 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium touch-manipulation"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};