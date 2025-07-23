import React from 'react';
import { Target } from 'lucide-react';

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
        <h2 className="text-xl font-bold mb-3">GPS Manager</h2>
        <p className="text-gray-600 mb-6 px-4">
          Optimisation intelligente des tournées
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{packages.length}</div>
                <div className="text-sm text-gray-600">Colis scannés</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
                <div className="text-sm text-gray-600">Livrés</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onLaunchGPSManager}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg font-semibold"
          >
            <Target size={20} />
            <span>Lancer GPS Manager</span>
          </button>
        </div>
      </div>
    </div>
  );
};