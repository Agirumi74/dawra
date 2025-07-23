import React from 'react';
import { Camera, Navigation } from 'lucide-react';

interface QuickActionsSectionProps {
  onScanClick: () => void;
  onGPSManagerClick: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ 
  onScanClick, 
  onGPSManagerClick 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onScanClick}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        <Camera size={32} />
        <span className="font-semibold text-lg">Scanner un colis</span>
      </button>
      
      <button
        onClick={onGPSManagerClick}
        className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        <Navigation size={32} />
        <span className="font-semibold text-lg">GPS Manager</span>
      </button>
    </div>
  );
};