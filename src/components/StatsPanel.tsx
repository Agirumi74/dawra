import React from 'react';
import { Clock, CheckCircle, XCircle, Package as PackageIcon, TrendingUp } from 'lucide-react';
import { Package } from '../types';

interface StatsPanelProps {
  packages: Package[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ packages }) => {
  const pendingCount = packages.filter(pkg => pkg.status === 'pending').length;
  const deliveredCount = packages.filter(pkg => pkg.status === 'delivered').length;
  const failedCount = packages.filter(pkg => pkg.status === 'failed').length;
  const totalCount = packages.length;

  const completionRate = totalCount > 0 ? Math.round(((deliveredCount) / totalCount) * 100) : 0;
  const successRate = (deliveredCount + failedCount) > 0 ? Math.round((deliveredCount / (deliveredCount + failedCount)) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Tableau de bord</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>{completionRate}% terminé</span>
        </div>
      </div>
      
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <PackageIcon size={20} className="text-gray-600" />
            <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
          </div>
          <p className="text-sm text-gray-600">Total colis</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp size={20} className="text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{successRate}%</span>
          </div>
          <p className="text-sm text-gray-600">Taux de réussite</p>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Clock size={18} className="text-amber-600" />
            <span className="text-xl font-bold text-amber-600">{pendingCount}</span>
          </div>
          <p className="text-xs text-gray-600">En attente</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CheckCircle size={18} className="text-green-600" />
            <span className="text-xl font-bold text-green-600">{deliveredCount}</span>
          </div>
          <p className="text-xs text-gray-600">Livrés</p>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <XCircle size={18} className="text-red-600" />
            <span className="text-xl font-bold text-red-600">{failedCount}</span>
          </div>
          <p className="text-xs text-gray-600">Échecs</p>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression de la journée</span>
            <span>{deliveredCount + failedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};