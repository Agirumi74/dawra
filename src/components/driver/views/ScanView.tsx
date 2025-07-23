import React from 'react';
import { Camera, Edit3 } from 'lucide-react';
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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Scanner des colis</h2>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Utilisez votre caméra pour scanner les codes-barres et capturer les adresses
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-5">
          <button 
            onClick={onStartScanning}
            className="group w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-6 px-6 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-4 touch-manipulation shadow-lg hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Camera size={28} />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Démarrer le scan</div>
              <div className="text-sm text-blue-100 font-normal">Scanner les codes-barres</div>
            </div>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">ou</span>
            </div>
          </div>

          <button 
            onClick={onStartManualEntry}
            className="group w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-2xl text-lg font-semibold active:scale-98 transition-all duration-200 touch-manipulation flex items-center justify-center space-x-3 border border-gray-200"
          >
            <Edit3 size={20} />
            <span>Saisie manuelle</span>
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