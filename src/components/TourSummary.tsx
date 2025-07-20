import React from 'react';
import { 
  CheckCircle, 
  X, 
  Home, 
  Building, 
  MapPin, 
  AlertTriangle, 
  Package as PackageIcon,
  Clock,
  TrendingUp,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { DeliverySummary, Package } from '../types';

interface TourSummaryProps {
  summary: DeliverySummary;
  packages: Package[];
  onBack: () => void;
  onExportReport?: () => void;
}

export const TourSummary: React.FC<TourSummaryProps> = ({
  summary,
  packages,
  onBack,
  onExportReport
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} className="text-green-600" />;
      case 'absent': return <Home size={16} className="text-orange-600" />;
      case 'refused': return <X size={16} className="text-red-600" />;
      case 'ups_relay': return <Building size={16} className="text-blue-600" />;
      case 'address_incorrect': return <MapPin size={16} className="text-purple-600" />;
      case 'access_denied': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'damaged': return <PackageIcon size={16} className="text-red-500" />;
      default: return <AlertTriangle size={16} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      delivered: 'Livré avec succès',
      absent: 'Destinataire absent',
      refused: 'Livraison refusée',
      ups_relay: 'Dépôt point relais UPS',
      address_incorrect: 'Adresse incorrecte',
      access_denied: 'Accès refusé',
      damaged: 'Colis endommagé',
      other: 'Autre raison'
    };
    return labels[status] || status;
  };

  const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered');
  const failedPackages = packages.filter(pkg => pkg.status === 'failed');

  const successRate = summary.totalPackages > 0 
    ? Math.round((summary.deliveredPackages / summary.totalPackages) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Récapitulatif de tournée</h1>
                <p className="text-sm text-gray-600">
                  Terminée à {summary.endTime} • Durée: {summary.tourDuration}
                </p>
              </div>
            </div>
            
            {onExportReport && (
              <button
                onClick={onExportReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FileText size={16} />
                <span>Exporter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Performance Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp size={20} className="text-blue-600" />
            <span>Performance de la tournée</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.totalPackages}</div>
              <div className="text-sm text-gray-600">Colis total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.deliveredPackages}</div>
              <div className="text-sm text-gray-600">Livrés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{summary.failedPackages}</div>
              <div className="text-sm text-gray-600">Échecs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{successRate}%</div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${successRate}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Distance totale:</span>
              <span className="font-medium">{summary.totalDistance} km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Durée totale:</span>
              <span className="font-medium">{summary.tourDuration}</span>
            </div>
          </div>
        </div>

        {/* Failure Breakdown */}
        {summary.failedPackages > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <AlertTriangle size={20} className="text-orange-600" />
              <span>Détail des échecs de livraison</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(summary.failureReasons).map(([reason, count]) => {
                if (count === 0) return null;
                
                return (
                  <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(reason)}
                      <span className="text-sm font-medium">{getStatusLabel(reason)}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivered Packages */}
        {deliveredPackages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-600" />
              <span>Colis livrés ({deliveredPackages.length})</span>
            </h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deliveredPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {pkg.type === 'entreprise' ? 
                        <Building size={14} className="text-gray-500" /> : 
                        <Home size={14} className="text-gray-500" />
                      }
                      <span className="text-sm font-medium truncate">{pkg.location}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{pkg.address.full_address}</p>
                  </div>
                  <div className="text-right ml-4">
                    {pkg.deliveredAt && (
                      <div className="text-xs text-green-700 flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{new Date(pkg.deliveredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Packages */}
        {failedPackages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <X size={20} className="text-red-600" />
              <span>Colis non livrés ({failedPackages.length})</span>
            </h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {failedPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {pkg.type === 'entreprise' ? 
                        <Building size={14} className="text-gray-500" /> : 
                        <Home size={14} className="text-gray-500" />
                      }
                      <span className="text-sm font-medium truncate">{pkg.location}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{pkg.address.full_address}</p>
                    {pkg.failureReason && (
                      <p className="text-xs text-red-600 mt-1">{pkg.failureReason}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(pkg.deliveryStatus || 'other')}
                      <span className="text-xs text-red-700 font-medium">
                        {getStatusLabel(pkg.deliveryStatus || 'other')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
          {onExportReport && (
            <button
              onClick={onExportReport}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText size={20} />
              <span>Exporter le rapport</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};