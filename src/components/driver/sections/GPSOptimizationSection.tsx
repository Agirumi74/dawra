import React from 'react';
import { Target, MapPin } from 'lucide-react';

interface GPSOptimizationSectionProps {
  onGPSManagerClick: () => void;
}

export const GPSOptimizationSection: React.FC<GPSOptimizationSectionProps> = ({ onGPSManagerClick }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Optimisation GPS</h3>
            <p className="text-sm text-purple-600">Planifiez votre itinéraire optimal</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={onGPSManagerClick}
        className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 active:scale-98 transition-all duration-200 shadow-lg"
      >
        <MapPin size={20} />
        <span className="font-semibold">Optimiser tournée</span>
      </button>
    </div>
  );
};