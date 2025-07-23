import React from 'react';
import { Route, Clock } from 'lucide-react';

interface RouteSectionProps {
  todayRoute: unknown;
}

export const RouteSection: React.FC<RouteSectionProps> = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Route size={20} className="text-green-600" />
          </div>
          <span>Tournée du jour</span>
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>En attente</span>
        </div>
      </div>
      
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Route size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune tournée planifiée</h3>
        <p className="text-gray-600">Scannez vos colis pour commencer votre tournée</p>
      </div>
    </div>
  );
};