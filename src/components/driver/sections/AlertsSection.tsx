import React from 'react';
import { AlertCircle, Clock, Wrench } from 'lucide-react';

export const AlertsSection: React.FC = () => {
  const alerts = [
    {
      icon: Clock,
      text: '3 colis prioritaires avant 12h',
      type: 'priority' as const
    },
    {
      icon: Wrench,
      text: 'Maintenance vendredi',
      type: 'info' as const
    }
  ];

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertCircle size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900">Priorités du jour</h3>
          <p className="text-sm text-amber-600">Points d'attention importants</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
            <alert.icon size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800 font-medium">{alert.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};