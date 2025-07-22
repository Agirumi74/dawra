import React from 'react';
import { Camera } from 'lucide-react';
import { PackageStatsSection } from '../sections/PackageStatsSection';
import { RecentPackagesSection } from '../sections/RecentPackagesSection';

interface Package {
  id: string;
  status: 'pending' | 'delivered' | 'failed';
  address: {
    full_address: string;
  };
  location: string;
}

interface ScanViewProps {
  packages: Package[];
  deliveredCount: number;
  failedCount: number;
  onStartScanning: () => void;
  onStartManualEntry: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  packages,
  deliveredCount,
  failedCount,
  onStartScanning,
  onStartManualEntry
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Scanner des colis</h2>
        <p className="text-gray-600 mb-8 px-4">
          Utilisez votre caméra pour scanner les codes-barres et capturer les adresses
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="space-y-4">
          <button 
            onClick={onStartScanning}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-6 rounded-xl text-lg md:text-xl font-semibold hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 flex items-center justify-center space-x-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Camera size={32} />
            <div className="text-left">
              <div>Démarrer le scan</div>
              <div className="text-sm text-blue-100 font-normal">Scanner les codes-barres</div>
            </div>
          </button>
          
          <div className="text-center">
            <p className="text-gray-500 mb-4">ou</p>
          </div>

          <button 
            onClick={onStartManualEntry}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-gray-700 hover:to-gray-800 active:from-gray-800 active:to-gray-900 transition-all duration-200 touch-manipulation shadow-lg hover:shadow-xl"
          >
            Saisie manuelle
          </button>
        </div>
      </div>

      <PackageStatsSection 
        packages={packages}
        deliveredCount={deliveredCount}
        failedCount={failedCount}
      />
      
      <RecentPackagesSection packages={packages} />
    </div>
  );
};