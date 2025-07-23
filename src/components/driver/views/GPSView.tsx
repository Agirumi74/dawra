import React from 'react';
import { Target, Navigation, Clock, Route } from 'lucide-react';

interface Package {
  id: string;
  status: 'pending' | 'delivered' | 'failed';
  address: {
    full_address: string;
  };
  location: string;
}

interface GPSViewProps {
  packages: Package[];
  deliveredCount: number;
  onLaunchGPSManager: () => void;
}

export const GPSView: React.FC<GPSViewProps> = ({
  packages,
  deliveredCount,
  onLaunchGPSManager
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4">GPS Manager</h2>
        <p className="text-gray-600 mb-8 px-4">
          Optimisation intelligente des tournées avec export vers apps GPS
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Fonctionnalités principales</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Target size={16} className="text-blue-600" />
                <span>Algorithme TSP avec contraintes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation size={16} className="text-green-600" />
                <span>Export Google Maps, Waze, Plans</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-orange-600" />
                <span>Gestion priorités et fenêtres temporelles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Route size={16} className="text-purple-600" />
                <span>Optimisation temps réel</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-xl font-bold text-blue-600">{packages.length}</div>
                <div className="text-xs text-gray-600">Colis scannés</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-xl font-bold text-green-600">{deliveredCount}</div>
                <div className="text-xs text-gray-600">Livrés</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 mt-6">
          <div className="flex justify-center">
            <button
              onClick={onLaunchGPSManager}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Target size={20} />
              <span>Lancer GPS Manager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};