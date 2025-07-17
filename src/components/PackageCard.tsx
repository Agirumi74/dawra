import React from 'react';
import { 
  Home, 
  Building2, 
  Truck, 
  Check, 
  X, 
  Trash2, 
  Navigation,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Star,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Package } from '../types';

interface PackageCardProps {
  package: Package;
  onUpdateStatus: (id: string, status: Package['status']) => void;
  onRemove: (id: string) => void;
  onNavigate?: (address: string) => void;
  showOrder?: number;
  showDistance?: number;
  isInRoute?: boolean;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onUpdateStatus,
  onRemove,
  onNavigate,
  showOrder,
  showDistance,
  isInRoute = false
}) => {
  const getStatusColor = () => {
    switch (pkg.status) {
      case 'delivered':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (pkg.status) {
      case 'delivered':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'failed':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-amber-600" />;
    }
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(pkg.address.full_address);
    }
  };

  const getPriorityIcon = () => {
    switch (pkg.priority) {
      case 'premier':
        return <Star size={16} className="text-red-600" />;
      case 'express_midi':
        return <Zap size={16} className="text-orange-600" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = () => {
    switch (pkg.priority) {
      case 'premier':
        return 'PREMIER';
      case 'express_midi':
        return 'AVANT MIDI';
      default:
        return null;
    }
  };
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${getStatusColor()} ${
      pkg.status === 'delivered' ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Order number for route view */}
          {showOrder && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {showOrder}
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Arrêt #{showOrder}
              </div>
              {getPriorityIcon() && (
                <div className="flex items-center space-x-1">
                  {getPriorityIcon()}
                  <span className="text-xs font-medium">{getPriorityLabel()}</span>
                </div>
              )}
            </div>
          )}

          {/* Address */}
          <div className="flex items-start space-x-2 mb-2">
            {pkg.type === 'particulier' ? (
              <Home size={16} className="text-blue-600 mt-1 flex-shrink-0" />
            ) : (
              <Building2 size={16} className="text-purple-600 mt-1 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900 leading-tight">{pkg.address.full_address}</p>
              {pkg.type === 'entreprise' && (
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-1">
                  Entreprise
                </span>
              )}
            </div>
          </div>

          {/* Priority indicator */}
          {getPriorityIcon() && (
            <div className="flex items-center space-x-2 mb-2">
              {getPriorityIcon()}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                pkg.priority === 'premier' ? 'bg-red-100 text-red-800' :
                pkg.priority === 'express_midi' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {getPriorityLabel()}
              </span>
            </div>
          )}

          {/* Location in truck */}
          <div className="flex items-center space-x-2 mb-2">
            <Truck size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">{pkg.location}</span>
          </div>

          {/* Notes */}
          {pkg.notes && (
            <div className="bg-gray-50 rounded-md p-2 mb-2">
              <p className="text-sm text-gray-700">{pkg.notes}</p>
            </div>
          )}

          {/* Distance for route view */}
          {showDistance && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <MapPin size={14} />
              <span>Distance: {showDistance.toFixed(1)} km</span>
            </div>
          )}

          {/* Barcode info */}
          {pkg.barcode && pkg.barcode !== 'MANUAL_ENTRY' && (
            <div className="text-xs text-gray-500 mt-2">
              Code: {pkg.barcode.substring(0, 20)}...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 ml-4">
          {/* Status indicator */}
          <div className="flex items-center justify-center">
            {getStatusIcon()}
          </div>

          {/* Navigation button for route view */}
          {isInRoute && pkg.status === 'pending' && onNavigate && (
            <button
              onClick={handleNavigate}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
            >
              <Navigation size={14} />
              <span>GPS</span>
            </button>
          )}

          {/* Status change buttons */}
          {pkg.status === 'pending' && (
            <div className="flex space-x-1">
              <button
                onClick={() => onUpdateStatus(pkg.id, 'delivered')}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Marquer comme livré"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(pkg.id, 'failed')}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Marquer comme échec"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Reset button for completed packages */}
          {pkg.status !== 'pending' && (
            <button
              onClick={() => onUpdateStatus(pkg.id, 'pending')}
              className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs"
              title="Remettre en attente"
            >
              <Clock size={14} />
            </button>
          )}

          {/* Remove button */}
          <button
            onClick={() => onRemove(pkg.id)}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Supprimer le colis"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};