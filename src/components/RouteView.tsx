import React, { useState, useEffect } from 'react';
import { DeliveryPoint, UserPosition } from '../types';
import { usePackages } from '../hooks/usePackages';
import { RouteOptimizer } from '../services/routeOptimization';
import { geocodeAddress } from '../services/geocoding';
import { 
  Route, 
  MapPin, 
  Navigation, 
  Clock, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Package as PackageIcon,
  Home,
  Building,
  ArrowRight,
  Star,
  Timer
} from 'lucide-react';

interface RouteViewProps {
  onNavigate?: (address: string) => void;
}

export const RouteView: React.FC<RouteViewProps> = ({ onNavigate }) => {
  const { packages, updatePackage } = usePackages();
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);

  // Calculer les statistiques
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const totalPackages = packages.length;
  const completedDeliveries = deliveryPoints.filter(point => point.status === 'completed').length;

  useEffect(() => {
    // Charger la position de l'utilisateur au montage
    loadUserPosition();
  }, []);

  const loadUserPosition = async () => {
    setIsLoadingPosition(true);
    try {
      const position = await RouteOptimizer.getCurrentPosition();
      if (position) {
        setUserPosition(position);
      } else {
        // Position par défaut (Paris)
        setUserPosition({ lat: 48.8566, lng: 2.3522 });
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setUserPosition({ lat: 48.8566, lng: 2.3522 });
    } finally {
      setIsLoadingPosition(false);
    }
  };

  const optimizeRoute = async () => {
    if (pendingPackages.length === 0) {
      setError('Aucun colis en attente de livraison');
      return;
    }

    if (!userPosition) {
      setError('Position non disponible');
      return;
    }

    setIsOptimizing(true);
    setError('');

    try {
      // 1. Grouper les colis par adresse
      const groupedPoints = RouteOptimizer.groupPackagesByAddress(pendingPackages);
      
      // 2. Géocoder toutes les adresses
      const geocodedPoints: DeliveryPoint[] = [];
      
      for (const point of groupedPoints) {
        const coordinates = await geocodeAddress(point.address.full_address);
        if (coordinates) {
          const updatedAddress = {
            ...point.address,
            coordinates
          };
          geocodedPoints.push({
            ...point,
            address: updatedAddress
          });
        } else {
          console.warn(`Impossible de géocoder: ${point.address.full_address}`);
        }
      }

      if (geocodedPoints.length === 0) {
        throw new Error('Aucune adresse n\'a pu être géocodée');
      }

      // 3. Calculer la matrice de distances
      const coordinates = geocodedPoints.map(p => p.address.coordinates!);
      const distanceMatrix = await RouteOptimizer.getDistanceMatrix(coordinates);

      // 4. Optimiser la route selon les contraintes
      const hasConstraints = geocodedPoints.some(p => p.priority !== 'standard');
      let optimizedRoute: DeliveryPoint[];

      if (hasConstraints) {
        optimizedRoute = RouteOptimizer.optimizeWithConstraints(
          geocodedPoints, 
          userPosition, 
          distanceMatrix, 
          {}
        );
      } else {
        optimizedRoute = RouteOptimizer.optimizeSimple(
          geocodedPoints, 
          userPosition, 
          distanceMatrix
        );
      }

      // 5. Améliorer avec 2-opt si nécessaire
      if (optimizedRoute.length > 3) {
        optimizedRoute = RouteOptimizer.improve2Opt(optimizedRoute, distanceMatrix);
      }

      setDeliveryPoints(optimizedRoute);

    } catch (error) {
      console.error('Erreur d\'optimisation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'optimisation');
    } finally {
      setIsOptimizing(false);
    }
  };

  const markAsDelivered = (pointId: string, packageId: string) => {
    // Marquer le colis comme livré
    updatePackage(packageId, { status: 'delivered' });

    // Mettre à jour le statut du point de livraison
    setDeliveryPoints(points => 
      points.map(point => {
        if (point.id === pointId) {
          const deliveredPackages = point.packages.filter(pkg => 
            pkg.id === packageId || pkg.status === 'delivered'
          );
          const allDelivered = deliveredPackages.length === point.packages.length;
          
          return {
            ...point,
            status: allDelivered ? 'completed' : 'partial'
          };
        }
        return point;
      })
    );
  };

  const markAsFailed = (pointId: string, packageId: string) => {
    // Marquer le colis comme échec
    updatePackage(packageId, { status: 'failed' });

    // Le point reste en pending ou partial selon les autres colis
    setDeliveryPoints(points => 
      points.map(point => {
        if (point.id === pointId) {
          const completedPackages = point.packages.filter(pkg => 
            pkg.status === 'delivered'
          );
          const hasCompleted = completedPackages.length > 0;
          
          return {
            ...point,
            status: hasCompleted ? 'partial' : 'pending'
          };
        }
        return point;
      })
    );
  };

  const handleNavigate = (address: string) => {
    if (onNavigate) {
      onNavigate(address);
    } else {
      // Ouvrir dans l'app de navigation par défaut
      const encodedAddress = encodeURIComponent(address);
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Sur mobile, essayer d'ouvrir l'app native
        window.open(`geo:0,0?q=${encodedAddress}`, '_blank');
      } else {
        // Sur desktop, ouvrir Google Maps
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
      }
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'premier':
        return <Star size={16} className="text-red-500" fill="currentColor" />;
      case 'express_midi':
        return <Timer size={16} className="text-orange-500" />;
      default:
        return null;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'premier':
        return 'Prioritaire';
      case 'express_midi':
        return 'Express';
      default:
        return 'Standard';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'partial':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-white border-gray-300 text-gray-900';
    }
  };

  if (totalPackages === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <PackageIcon size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Aucun colis scanné
          </h2>
          <p className="text-gray-500">
            Scannez d'abord des colis pour pouvoir optimiser votre tournée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Route size={24} className="text-blue-600" />
            <span>Optimisation de tournée</span>
          </h2>
          {isLoadingPosition && (
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <Loader2 size={16} className="animate-spin" />
              <span>Localisation...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPackages}</div>
            <div className="text-sm text-gray-600">Colis total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedDeliveries}</div>
            <div className="text-sm text-gray-600">Points livrés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingPackages.length}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </div>

        {pendingPackages.length > 0 && (
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || !userPosition}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isOptimizing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Optimisation en cours...</span>
              </>
            ) : (
              <>
                <Route size={20} />
                <span>Optimiser la tournée</span>
              </>
            )}
          </button>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center space-x-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Liste des points de livraison optimisés */}
      {deliveryPoints.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Navigation size={20} className="text-green-600" />
            <span>Tournée optimisée</span>
          </h3>

          {deliveryPoints.map((point) => (
            <div
              key={point.id}
              className={`border-2 rounded-lg p-4 transition-colors ${getStatusColor(point.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {point.order}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin size={16} className="text-gray-500" />
                      <p className="font-semibold">{point.address.full_address}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        {point.packages[0].type === 'entreprise' ? 
                          <Building size={14} /> : <Home size={14} />
                        }
                        <span>{point.packages[0].type === 'entreprise' ? 'Entreprise' : 'Particulier'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(point.priority)}
                        <span>{getPriorityLabel(point.priority)}</span>
                      </div>
                      {point.distance && (
                        <div className="flex items-center space-x-1">
                          <ArrowRight size={14} />
                          <span>{point.distance.toFixed(1)} km</span>
                        </div>
                      )}
                      {point.estimatedTime && (
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{point.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate(point.address.full_address)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Navigation size={16} />
                  <span>Naviguer</span>
                </button>
              </div>

              {/* Liste des colis pour cette adresse */}
              <div className="space-y-2">
                {point.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`flex items-center justify-between p-3 rounded border ${
                      pkg.status === 'delivered' ? 'bg-green-50 border-green-200' :
                      pkg.status === 'failed' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <PackageIcon size={14} className="text-gray-500" />
                        <span className="text-sm font-medium">
                          {pkg.barcode ? `Code: ${pkg.barcode}` : 'Saisie manuelle'}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {pkg.location}
                        </span>
                      </div>
                      {pkg.notes && (
                        <p className="text-xs text-gray-600">{pkg.notes}</p>
                      )}
                    </div>

                    {pkg.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => markAsFailed(point.id, pkg.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          Échec
                        </button>
                        <button
                          onClick={() => markAsDelivered(point.id, pkg.id)}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle size={14} />
                          <span>Livré</span>
                        </button>
                      </div>
                    )}

                    {pkg.status === 'delivered' && (
                      <div className="text-green-600 text-sm flex items-center space-x-1">
                        <CheckCircle size={14} />
                        <span>Livré</span>
                      </div>
                    )}

                    {pkg.status === 'failed' && (
                      <div className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertTriangle size={14} />
                        <span>Échec</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};