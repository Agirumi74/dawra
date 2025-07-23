import React from 'react';
import { Target } from 'lucide-react';

interface GPSOptimizationSectionProps {
  onGPSManagerClick: () => void;
}

export const GPSOptimizationSection: React.FC<GPSOptimizationSectionProps> = ({ onGPSManagerClick }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Target size={24} className="text-purple-600" />
          <div>
            <h3 className="font-semibold text-purple-900">Optimisation GPS</h3>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={onGPSManagerClick}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Target size={16} />
          <span>Optimiser tournée</span>
        </button>
      </div>
    </div>
  );
};