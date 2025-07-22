import React from 'react';
import { Route } from 'lucide-react';

interface RouteSectionProps {
  todayRoute: any;
}

export const RouteSection: React.FC<RouteSectionProps> = ({ todayRoute }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold flex items-center space-x-2">
          <Route size={24} className="text-green-600" />
          <span>Tournée du jour</span>
        </h2>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <Route size={48} className="mx-auto mb-4 opacity-50" />
        <p>Aucune tournée planifiée</p>
        <p className="text-sm mt-2">Scannez vos colis pour commencer</p>
      </div>
    </div>
  );
};