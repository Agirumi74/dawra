import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AlertsSection: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle size={20} className="text-amber-600" />
        <span className="font-medium text-amber-800">Priorités du jour</span>
      </div>
      <ul className="text-sm text-amber-700 space-y-1">
        <li>• 3 colis prioritaires avant 12h</li>
        <li>• Maintenance vendredi</li>
      </ul>
    </div>
  );
};