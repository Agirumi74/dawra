import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Route as RouteIcon, 
  Clock, 
  Plus, 
  Settings,
  Smartphone,
  Upload,
  Download,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  AlertTriangle,
  Timer,
  Star,
  Building,
  Home,
  Truck,
  Target
} from 'lucide-react';
import { usePackages } from '../hooks/usePackages';
import { Package, DeliveryPoint, UserPosition } from '../types';
import { RouteOptimizer } from '../services/routeOptimization';
import { RouteExportService } from '../services/routeExport';
import { geocodeAddress } from '../services/geocoding';
import { GPSNavigation } from './GPSNavigation';
import { PackageForm } from './PackageForm';

interface EnhancedGPSManagerProps {
  onBack?: () => void;
}

type ViewMode = 'setup' | 'route' | 'navigation' | 'export';

export const EnhancedGPSManager: React.FC<EnhancedGPSManagerProps> = ({ onBack }) => {
  const { packages, addPackage, updatePackage, removePackage } = usePackages();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [routeSettings, setRouteSettings] = useState({
    startTime: '08:00',
    stopTimeMinutes: 15,
    averageSpeedKmh: 30,
    useConstraints: true,
    returnToDepot: true
  });

  // Stats calculées
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered');
  const failedPackages = packages.filter(pkg => pkg.status === 'failed');
  const completedPoints = deliveryPoints.filter(point => point.status === 'completed').length;

  useEffect(() => {
    loadUserPosition();
  }, []);

  const loadUserPosition = async () => {
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
    }
  };

  const optimizeRoute = async () => {
    if (pendingPackages.length === 0) {
      alert('Aucun colis en attente de livraison');
      return;
    }

    if (!userPosition) {
      alert('Position non disponible');
      return;
    }

    setIsOptimizing(true);

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
      let optimizedRoute: DeliveryPoint[];

      if (routeSettings.useConstraints) {
        optimizedRoute = RouteOptimizer.optimizeWithConstraints(
          geocodedPoints, 
          userPosition, 
          distanceMatrix, 
          {},
          routeSettings.startTime,
          routeSettings.stopTimeMinutes,
          routeSettings.averageSpeedKmh
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
      setViewMode('route');

    } catch (error) {
      console.error('Erreur d\'optimisation:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'optimisation');
    } finally {
      setIsOptimizing(false);
    }
  };

  const addPackageToRoute = async (newPackage: Package) => {
    if (deliveryPoints.length === 0) {
      addPackage(newPackage);
      return;
    }

    // Ajouter le package et recalculer la route
    addPackage(newPackage);
    
    if (!userPosition) return;

    try {
      const newPoint: DeliveryPoint = {
        id: `point-${newPackage.id}`,
        address: newPackage.address,
        packages: [newPackage],
        status: 'pending',
        order: 1,
        distance: 0,
        priority: newPackage.priority || 'standard'
      };

      // Géocoder la nouvelle adresse
      const coordinates = await geocodeAddress(newPackage.address.full_address);
      if (coordinates) {
        newPoint.address.coordinates = coordinates;
        
        // Recalculer la tournée avec le nouveau point
        const updatedTour = await RouteOptimizer.addAddressesToTour(
          deliveryPoints,
          [newPoint],
          userPosition,
          currentPointIndex
        );
        
        setDeliveryPoints(updatedTour);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du colis:', error);
    }
  };

  const removePackageFromRoute = (packageId: string) => {
    removePackage(packageId);
    
    // Mettre à jour les points de livraison
    const updatedPoints = deliveryPoints.map(point => ({
      ...point,
      packages: point.packages.filter(pkg => pkg.id !== packageId)
    })).filter(point => point.packages.length > 0);

    // Recalculer les numéros d'ordre
    updatedPoints.forEach((point, index) => {
      point.order = index + 1;
    });

    setDeliveryPoints(updatedPoints);
  };

  const exportToExternalGPS = (format: 'google' | 'waze' | 'apple') => {
    if (deliveryPoints.length === 0) {
      alert('Aucune tournée à exporter');
      return;
    }

    const validPoints = deliveryPoints.filter(point => point.address.coordinates);
    if (validPoints.length === 0) {
      alert('Aucun point avec coordonnées valides');
      return;
    }

    const waypoints = validPoints.slice(1).map(point => {
      const { lat, lng } = point.address.coordinates!;
      return `${lat},${lng}`;
    }).join('|');

    const firstPoint = validPoints[0];
    const destination = `${firstPoint.address.coordinates!.lat},${firstPoint.address.coordinates!.lng}`;

    let url: string;

    switch (format) {
      case 'google':
        url = waypoints.length > 0 
          ? `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        break;
      
      case 'waze':
        // Waze ne supporte qu'une destination à la fois
        url = `https://waze.com/ul?ll=${destination}&navigate=yes`;
        break;
      
      case 'apple':
        url = `maps://maps.apple.com/?daddr=${destination}&dirflg=d`;
        break;
      
      default:
        return;
    }

    window.open(url, '_blank');
  };

  const startNavigation = () => {
    if (deliveryPoints.length === 0) {
      alert('Aucune tournée planifiée');
      return;
    }
    setCurrentPointIndex(0);
    setViewMode('navigation');
  };

  const handleDeliveryComplete = (pointId: string) => {
    const point = deliveryPoints.find(p => p.id === pointId);
    if (!point) return;

    // Marquer tous les colis du point comme livrés
    point.packages.forEach(pkg => {
      updatePackage(pkg.id, { status: 'delivered', deliveredAt: new Date() });
    });

    // Mettre à jour le statut du point
    setDeliveryPoints(points => 
      points.map(p => p.id === pointId ? { ...p, status: 'completed' as const } : p)
    );

    // Passer au point suivant
    const nextIndex = currentPointIndex + 1;
    if (nextIndex < deliveryPoints.length) {
      setCurrentPointIndex(nextIndex);
    } else {
      alert('Tournée terminée ! Toutes les livraisons ont été effectuées.');
      setViewMode('export');
    }
  };

  const generateRouteExport = () => {
    const totalDistance = deliveryPoints.reduce((sum, point) => sum + (point.distance || 0), 0);
    const tourStats = RouteOptimizer.calculateTotalTourTime(
      deliveryPoints,
      routeSettings.startTime,
      routeSettings.stopTimeMinutes,
      routeSettings.averageSpeedKmh,
      routeSettings.returnToDepot
    );

    const exportData = {
      tourDate: new Date().toLocaleDateString('fr-FR'),
      driverName: 'Chauffeur',
      vehicleInfo: 'Véhicule de livraison',
      startTime: routeSettings.startTime,
      settings: routeSettings,
      deliveryPoints,
      totalDistance: tourStats.totalDistance,
      totalTime: tourStats.totalTime,
      endTime: tourStats.endTime
    };

    return exportData;
  };

  const renderSetupView = () => (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <RouteIcon size={24} className="text-blue-600" />
            <span>Configuration GPS</span>
          </h2>
          <button
            onClick={() => setShowPackageForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Ajouter colis</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{packages.length}</div>
            <div className="text-sm text-gray-600">Colis total</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingPackages.length}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{deliveredPackages.length}</div>
            <div className="text-sm text-gray-600">Livrés</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedPackages.length}</div>
            <div className="text-sm text-gray-600">Échecs</div>
          </div>
        </div>

        {/* Paramètres de route */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
            <Settings size={20} className="text-gray-600" />
            <span>Paramètres de tournée</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de départ
              </label>
              <input
                type="time"
                value={routeSettings.startTime}
                onChange={(e) => setRouteSettings(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps d'arrêt (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={routeSettings.stopTimeMinutes}
                onChange={(e) => setRouteSettings(prev => ({ ...prev, stopTimeMinutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vitesse moyenne (km/h)
              </label>
              <input
                type="number"
                min="20"
                max="80"
                value={routeSettings.averageSpeedKmh}
                onChange={(e) => setRouteSettings(prev => ({ ...prev, averageSpeedKmh: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={routeSettings.useConstraints}
                  onChange={(e) => setRouteSettings(prev => ({ ...prev, useConstraints: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Contraintes temporelles</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={routeSettings.returnToDepot}
                  onChange={(e) => setRouteSettings(prev => ({ ...prev, returnToDepot: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Retour dépôt</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div className="border-t pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || pendingPackages.length === 0 || !userPosition}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isOptimizing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Optimisation...</span>
              </>
            ) : (
              <>
                <Target size={20} />
                <span>Optimiser la tournée</span>
              </>
            )}
          </button>
          
          {deliveryPoints.length > 0 && (
            <button
              onClick={startNavigation}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <Play size={20} />
              <span>Commencer navigation</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des colis */}
      {packages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Colis scannés ({packages.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  pkg.status === 'delivered' ? 'bg-green-50 border-green-200' :
                  pkg.status === 'failed' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center space-x-1">
                      {pkg.type === 'entreprise' ? <Building size={14} /> : <Home size={14} />}
                      {pkg.priority === 'premier' && <Star size={14} className="text-red-500" fill="currentColor" />}
                      {pkg.priority === 'express_midi' && <Timer size={14} className="text-orange-500" />}
                    </div>
                    <span className="font-medium text-sm truncate">{pkg.address.full_address}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{pkg.location}</span>
                    {pkg.barcode && <span>Code: {pkg.barcode}</span>}
                    {pkg.notes && <span>{pkg.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {pkg.status === 'pending' ? 'En attente' :
                     pkg.status === 'delivered' ? 'Livré' : 'Échec'}
                  </div>
                  <button
                    onClick={() => removePackageFromRoute(pkg.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRouteView = () => (
    <div className="space-y-6">
      {/* En-tête de la route */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <RouteIcon size={24} className="text-green-600" />
            <span>Tournée optimisée</span>
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode('setup')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={startNavigation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Play size={20} />
              <span>Démarrer</span>
            </button>
          </div>
        </div>

        {/* Statistiques de la tournée */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{deliveryPoints.length}</div>
            <div className="text-xs text-gray-600">Arrêts</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {deliveryPoints.reduce((sum, point) => sum + point.packages.length, 0)}
            </div>
            <div className="text-xs text-gray-600">Colis</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">
              {deliveryPoints.reduce((sum, point) => sum + (point.distance || 0), 0).toFixed(1)} km
            </div>
            <div className="text-xs text-gray-600">Distance</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {RouteOptimizer.calculateTotalTourTime(deliveryPoints, routeSettings.startTime).totalTime}
            </div>
            <div className="text-xs text-gray-600">Durée</div>
          </div>
        </div>

        {/* Export vers GPS externes */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Exporter vers GPS externe</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportToExternalGPS('google')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => exportToExternalGPS('waze')}
              className="flex items-center space-x-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Waze</span>
            </button>
            <button
              onClick={() => exportToExternalGPS('apple')}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Plans (iOS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Points de livraison */}
      <div className="space-y-3">
        {deliveryPoints.map((point, index) => (
          <div
            key={point.id}
            className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
              point.status === 'completed' ? 'border-green-500 bg-green-50' :
              point.status === 'partial' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {point.order}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{point.address.full_address}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        {point.packages[0].type === 'entreprise' ? 
                          <Building size={14} /> : <Home size={14} />
                        }
                        <span>{point.packages[0].type === 'entreprise' ? 'Entreprise' : 'Particulier'}</span>
                      </div>
                      {point.estimatedTime && (
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{point.estimatedTime}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <RouteIcon size={14} />
                        <span>{(point.distance || 0).toFixed(1)} km</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {point.packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="text-sm font-medium">{pkg.location}</span>
                        {pkg.notes && <span className="text-xs text-gray-500">({pkg.notes})</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {pkg.priority === 'premier' && <Star size={14} className="text-red-500" fill="currentColor" />}
                        {pkg.priority === 'express_midi' && <Timer size={14} className="text-orange-500" />}
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {pkg.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setCurrentPointIndex(index);
                  setViewMode('navigation');
                }}
                className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Navigation size={16} />
                <span>Naviguer</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExportView = () => {
    const exportData = generateRouteExport();
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournée terminée !</h2>
            <p className="text-gray-600">Exporter les données de livraison</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedPoints}</div>
              <div className="text-sm text-gray-600">Points livrés</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{deliveredPackages.length}</div>
              <div className="text-sm text-gray-600">Colis livrés</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedPackages.length}</div>
              <div className="text-sm text-gray-600">Échecs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{exportData.totalDistance} km</div>
              <div className="text-sm text-gray-600">Distance</div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => RouteExportService.exportToPDF(exportData)}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download size={20} />
              <span>Exporter PDF</span>
            </button>
            <button
              onClick={() => RouteExportService.exportToCSV(exportData)}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={() => RouteExportService.exportPackageList(exportData)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              <span>Liste des colis</span>
            </button>
          </div>

          <div className="border-t pt-6 mt-6">
            <button
              onClick={() => {
                setViewMode('setup');
                setDeliveryPoints([]);
                setCurrentPointIndex(0);
              }}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Nouvelle tournée
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Truck size={24} className="text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">GPS Manager</h1>
                <p className="text-sm text-gray-600">
                  {viewMode === 'setup' && 'Configuration de la tournée'}
                  {viewMode === 'route' && 'Tournée optimisée'}
                  {viewMode === 'navigation' && 'Navigation en cours'}
                  {viewMode === 'export' && 'Export des données'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {viewMode !== 'setup' && (
                <button
                  onClick={() => setViewMode('setup')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'setup' && renderSetupView()}
        {viewMode === 'route' && renderRouteView()}
        {viewMode === 'navigation' && (
          <GPSNavigation
            deliveryPoints={deliveryPoints}
            currentPointIndex={currentPointIndex}
            userPosition={userPosition}
            onDeliveryComplete={handleDeliveryComplete}
            onAddAddress={() => setShowPackageForm(true)}
            onRecalculateRoute={optimizeRoute}
            onBack={() => setViewMode('route')}
            updatePackage={updatePackage}
            setCurrentPointIndex={setCurrentPointIndex}
          />
        )}
        {viewMode === 'export' && renderExportView()}
      </div>

      {/* Package form modal */}
      {showPackageForm && (
        <PackageForm
          onSave={(packageData) => {
            addPackageToRoute(packageData);
            setShowPackageForm(false);
          }}
          onCancel={() => setShowPackageForm(false)}
        />
      )}
    </div>
  );
};