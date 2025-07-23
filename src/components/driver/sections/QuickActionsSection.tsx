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
        className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 active:scale-98 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl"
      >
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Camera size={28} />
        </div>
        <span className="font-semibold text-lg">Scanner un colis</span>
        <span className="text-blue-100 text-sm">Capturer l'adresse et le code-barre</span>
      </button>
      
      <button
        onClick={onGPSManagerClick}
        className="group bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-2xl hover:from-green-700 hover:to-green-800 active:scale-98 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl"
      >
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Navigation size={28} />
        </div>
        <span className="font-semibold text-lg">GPS Manager</span>
        <span className="text-green-100 text-sm">Navigation et optimisation</span>
      </button>
    </div>
  );
};