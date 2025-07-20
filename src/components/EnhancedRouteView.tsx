import React, { useState, useEffect } from 'react';
import { 
  Route, 
  MapPin, 
  Navigation, 
  Clock, 
  Loader2, 
  Settings,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Timer,
  Home,
  Building,
  Package as PackageIcon,
  RefreshCw,
  Map,
  Download,
  FileText,
  Table
} from 'lucide-react';
import { Package, DeliveryPoint, UserPosition } from '../types';
import { usePackages } from '../hooks/usePackages';
import { useRouteSettings } from '../hooks/useRouteSettings';
import { RouteOptimizer } from '../services/routeOptimization';
import { geocodeAddress } from '../services/geocoding';
import { DEFAULT_DEPOT_ADDRESS, UPS_DEPOT_ADDRESS } from '../constants/depot';
import { TourProgressView } from './TourProgressView';
import { NavigationModeSelector } from './NavigationModeSelector';
import { RouteExportService } from '../services/routeExport';
import { FullRouteMapView } from './FullRouteMapView';

interface EnhancedRouteViewProps {
  onNavigate?: (address: string) => void;
}

export const EnhancedRouteView: React.FC<EnhancedRouteViewProps> = ({ onNavigate }) => {
  const { packages, updatePackage, removePackage } = usePackages();
  const { settings, updateSetting } = useRouteSettings();
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNavigationSelector, setShowNavigationSelector] = useState(false);
  const [showTourProgress, setShowTourProgress] = useState(false);
  const [showFullRouteMap, setShowFullRouteMap] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [tourStats, setTourStats] = useState<{
    totalTime: string;
    endTime: string;
    totalDistance: number;
  }>({ totalTime: '00:00', endTime: settings.startTime, totalDistance: 0 });

  // Calculer les statistiques
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const completedPackages = packages.filter(pkg => pkg.status === 'delivered');
  const totalPackages = packages.length;

  useEffect(() => {
    // Charger la position de l'utilisateur au montage
    loadUserPosition();
    
    // Fermer le menu export quand on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    // Recalculer les statistiques quand les points ou paramètres changent
    if (deliveryPoints.length > 0) {
      const stats = RouteOptimizer.calculateTotalTourTime(
        deliveryPoints,
        settings.startTime,
        settings.stopTimeMinutes,
        settings.averageSpeedKmh,
        settings.returnToDepot
      );
      setTourStats(stats);
    }
  }, [deliveryPoints, settings]);

  const loadUserPosition = async () => {
    try {
      const position = await RouteOptimizer.getCurrentPosition();
      if (position) {
        setUserPosition(position);
      } else {
        // Utiliser la position du dépôt par défaut
        setUserPosition(DEFAULT_DEPOT_ADDRESS.coordinates!);
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setUserPosition(DEFAULT_DEPOT_ADDRESS.coordinates!);
    }
  };

  const optimizeRoute = async () => {
    if (pendingPackages.length === 0) {
      setError('Aucun colis à optimiser');
      return;
    }

    setIsOptimizing(true);
    setError('');

    try {
      // Géocoder toutes les adresses qui n'ont pas de coordonnées
      const packagesWithCoords = await Promise.all(
        pendingPackages.map(async (pkg) => {
          if (!pkg.address.coordinates) {
            try {
              const coords = await geocodeAddress(pkg.address.full_address);
              return {
                ...pkg,
                address: { ...pkg.address, coordinates: coords }
              };
            } catch (err) {
              console.error(`Géocodage échoué pour ${pkg.address.full_address}:`, err);
              return pkg;
            }
          }
          return pkg;
        })
      );

      // Grouper par adresse
      const points = RouteOptimizer.groupPackagesByAddress(packagesWithCoords);
      
      // Préparer les coordonnées pour la matrice de distances
      // Inclure: dépôt de départ, tous les points de livraison, dépôt UPS
      const allCoordinates = [
        DEFAULT_DEPOT_ADDRESS.coordinates!, // Index 0: dépôt de départ
        ...points
          .filter(p => p.address.coordinates)
          .map(p => p.address.coordinates!), // Index 1 à n: points de livraison
        UPS_DEPOT_ADDRESS.coordinates! // Index n+1: dépôt UPS
      ];

      if (allCoordinates.length < 3) { // Au moins dépôt + 1 point + UPS dépôt
        throw new Error('Pas assez de points géocodés pour optimiser la route');
      }

      const distanceMatrix = await RouteOptimizer.getDistanceMatrix(allCoordinates);

      // Optimiser avec les deux dépôts
      const hasConstraints = points.some(p => p.priority !== 'standard');
      let optimized: DeliveryPoint[];

      if (hasConstraints) {
        optimized = RouteOptimizer.optimizeWithConstraints(
          points, 
          DEFAULT_DEPOT_ADDRESS.coordinates!, // Commencer au dépôt principal
          distanceMatrix, 
          {},
          settings.startTime,
          settings.stopTimeMinutes,
          settings.averageSpeedKmh
        );
      } else {
        optimized = RouteOptimizer.optimizeSimple(
          points, 
          DEFAULT_DEPOT_ADDRESS.coordinates!, // Commencer au dépôt principal
          distanceMatrix
        );
        
        // Ajouter les temps estimés pour l'optimisation simple
        let cumulativeDistance = 0;
        optimized.forEach(point => {
          cumulativeDistance += point.distance || 0;
          point.estimatedTime = RouteOptimizer.calculateEstimatedTime(
            point.order,
            settings.startTime,
            settings.stopTimeMinutes,
            cumulativeDistance,
            settings.averageSpeedKmh
          );
        });
      }

      // Ajouter le point de fin au dépôt UPS si returnToDepot est activé
      if (settings.returnToDepot && optimized.length > 0) {
        // Calculer la distance du dernier point vers le dépôt UPS
        const lastPoint = optimized[optimized.length - 1];
        if (lastPoint.address.coordinates) {
          const lastToUpsDistance = RouteOptimizer.calculateHaversineDistance(
            lastPoint.address.coordinates,
            UPS_DEPOT_ADDRESS.coordinates!
          );
          
          // Créer un point virtuel pour le dépôt UPS
          const upsDepotPoint: DeliveryPoint = {
            id: 'ups-depot-final',
            address: UPS_DEPOT_ADDRESS,
            packages: [],
            status: 'pending',
            order: optimized.length + 1,
            distance: lastToUpsDistance,
            priority: 'standard',
            estimatedTime: RouteOptimizer.calculateEstimatedTime(
              optimized.length + 1,
              settings.startTime,
              settings.stopTimeMinutes,
              optimized.reduce((total, point) => total + (point.distance || 0), 0) + lastToUpsDistance,
              settings.averageSpeedKmh
            )
          };
          
          // Ne pas l'ajouter comme point de livraison mais l'utiliser pour les calculs
          // optimized.push(upsDepotPoint);
        }
      }

      setDeliveryPoints(optimized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'optimisation');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePackageStatusChange = (packageId: string, status: Package['status']) => {
    updatePackage(packageId, { status });
  };

  const removePackageFromRoute = async (packageId: string) => {
    // Supprimer le colis
    removePackage(packageId);
    
    // Re-optimiser automatiquement si il y a encore des colis
    const remainingPackages = packages.filter(pkg => pkg.id !== packageId && pkg.status === 'pending');
    if (remainingPackages.length > 0) {
      setTimeout(() => optimizeRoute(), 100);
    } else {
      setDeliveryPoints([]);
    }
  };

  const navigateToPoint = (point: DeliveryPoint) => {
    if (onNavigate) {
      onNavigate(point.address.full_address);
    } else {
      // Show navigation mode selector for this specific point
      setShowNavigationSelector(true);
    }
  };

  const startTourNavigation = () => {
    if (deliveryPoints.length === 0) {
      setError('Aucun point de livraison disponible');
      return;
    }
    setShowTourProgress(true);
  };

  const handleNavigationModeSelect = (mode: 'dawra' | 'google' | 'waze') => {
    setShowNavigationSelector(false);
    
    if (mode === 'dawra') {
      // Use internal navigation
      startTourNavigation();
    }
    // External apps are already launched by the selector
  };

  const handleTourDeliveryComplete = (pointId: string, status: 'delivered' | 'failed', deliveryStatus?: string, reason?: string) => {
    const point = deliveryPoints.find(p => p.id === pointId);
    if (point) {
      point.packages.forEach(pkg => {
        updatePackage(pkg.id, { 
          status,
          deliveryStatus,
          failureReason: reason,
          deliveredAt: status === 'delivered' ? new Date() : undefined
        });
      });
    }
  };

  const handleTourDeliveryFailed = (pointId: string) => {
    const point = deliveryPoints.find(p => p.id === pointId);
    if (point) {
      point.packages.forEach(pkg => {
        handlePackageStatusChange(pkg.id, 'failed');
      });
    }
  };

  const exportRoute = async (format: 'pdf' | 'csv' | 'packages') => {
    if (deliveryPoints.length === 0) {
      setError('Aucune tournée à exporter');
      return;
    }

    const exportData = {
      tourDate: new Date().toLocaleDateString('fr-FR'),
      driverName: '', // Peut être récupéré du contexte utilisateur
      vehicleInfo: '',
      startTime: settings.startTime,
      settings,
      deliveryPoints,
      totalDistance: tourStats.totalDistance,
      totalTime: tourStats.totalTime,
      endTime: tourStats.endTime
    };

    try {
      switch (format) {
        case 'pdf':
          await RouteExportService.exportToPDF(exportData);
          break;
        case 'csv':
          RouteExportService.exportToCSV(exportData);
          break;
        case 'packages':
          RouteExportService.exportPackageList(exportData);
          break;
      }
      setShowExportMenu(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur d\'export');
    }
  };

  const getStepStatus = (point: DeliveryPoint) => {
    const allDelivered = point.packages.every(pkg => pkg.status === 'delivered');
    const someDelivered = point.packages.some(pkg => pkg.status === 'delivered');
    
    if (allDelivered) return 'completed';
    if (someDelivered) return 'partial';
    return 'pending';
  };

  if (packages.length === 0) {
    return (
      <div className="p-6 text-center">
        <PackageIcon size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Aucun colis scanné. Scannez vos colis pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Mode Selector */}
      {showNavigationSelector && (
        <NavigationModeSelector
          deliveryPoints={deliveryPoints}
          onModeSelect={handleNavigationModeSelect}
          onCancel={() => setShowNavigationSelector(false)}
        />
      )}

      {/* Full Route Map View */}
      {showFullRouteMap && (
        <FullRouteMapView
          points={deliveryPoints}
          userPosition={userPosition}
          onBack={() => setShowFullRouteMap(false)}
          onStartNavigation={() => {
            setShowFullRouteMap(false);
            setShowTourProgress(true);
          }}
        />
      )}

      {/* Tour Progress View */}
      {showTourProgress && (
        <TourProgressView
          deliveryPoints={deliveryPoints}
          currentPointIndex={0}
          userPosition={userPosition}
          onDeliveryComplete={handleTourDeliveryComplete}
          onDeliveryFailed={handleTourDeliveryFailed}
          onNext={() => {}}
          onBack={() => setShowTourProgress(false)}
          packages={packages}
        />
      )}

      {/* En-tête avec statistiques */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Optimisation de Tournée</h2>
          <div className="flex space-x-2">
            {deliveryPoints.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Exporter la tournée"
                >
                  <Download size={20} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                    <button
                      onClick={() => exportRoute('pdf')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FileText size={16} />
                      <span>Feuille de route PDF</span>
                    </button>
                    <button
                      onClick={() => exportRoute('csv')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Table size={16} />
                      <span>Tournée CSV</span>
                    </button>
                    <button
                      onClick={() => exportRoute('packages')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <PackageIcon size={16} />
                      <span>Liste colis CSV</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPackages}</div>
            <div className="text-sm text-gray-600">Colis Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedPackages.length}</div>
            <div className="text-sm text-gray-600">Livrés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{tourStats.totalTime}</div>
            <div className="text-sm text-gray-600">Temps Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{tourStats.totalDistance} km</div>
            <div className="text-sm text-gray-600">Distance</div>
          </div>
        </div>

        {/* Panneau de paramètres */}
        {showSettings && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-3">Paramètres de Tournée</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temps d'arrêt (minutes)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateSetting('stopTimeMinutes', Math.max(1, settings.stopTimeMinutes - 1))}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-3 py-1 bg-white border rounded font-medium">
                    {settings.stopTimeMinutes}
                  </span>
                  <button
                    onClick={() => updateSetting('stopTimeMinutes', settings.stopTimeMinutes + 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => updateSetting('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vitesse moyenne (km/h)
                </label>
                <input
                  type="number"
                  value={settings.averageSpeedKmh}
                  onChange={(e) => updateSetting('averageSpeedKmh', Number(e.target.value))}
                  min="10"
                  max="90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="returnToDepot"
                  checked={settings.returnToDepot}
                  onChange={(e) => updateSetting('returnToDepot', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="returnToDepot" className="text-sm font-medium text-gray-700">
                  Retour au dépôt
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'optimisation et de navigation */}
        <div className="flex space-x-2">
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || pendingPackages.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isOptimizing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Optimisation...</span>
              </>
            ) : (
              <>
                <Route size={20} />
                <span>Optimiser la Tournée</span>
              </>
            )}
          </button>
          
          {deliveryPoints.length > 0 && (
            <>
              <button
                onClick={() => setShowNavigationSelector(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Navigation size={20} />
                <span>Démarrer Navigation</span>
              </button>
              
              <button
                onClick={() => {
                  // Show full route overview with both depots
                  setShowFullRouteMap(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Map size={20} />
                <span>Vue d'ensemble</span>
              </button>
              
              <button
                onClick={() => {
                  setDeliveryPoints([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw size={20} />
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Liste des points de livraison */}
      <div className="flex-1 overflow-y-auto">
        {deliveryPoints.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Route size={48} className="mx-auto text-gray-400 mb-4" />
            <p>Cliquez sur "Optimiser la Tournée" pour planifier votre itinéraire</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {/* Point de départ - Dépôt principal */}
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  🏠
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-800">Point de départ</div>
                  <div className="text-sm text-green-700">{DEFAULT_DEPOT_ADDRESS.full_address}</div>
                  <div className="text-xs text-green-600 mt-1">
                    Heure de départ: {settings.startTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Points de livraison */}
            {deliveryPoints.map((point, index) => {
              const status = getStepStatus(point);
              
              return (
                <div key={point.id}>
                  <div
                    className={`border rounded-lg p-4 ${
                      status === 'completed' ? 'border-green-200 bg-green-50' : 
                      status === 'partial' ? 'border-orange-200 bg-orange-50' : 
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            status === 'completed' ? 'bg-green-600 text-white' :
                            status === 'partial' ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {point.order}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {point.priority === 'premier' && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Premier</span>
                            )}
                            {point.priority === 'express_midi' && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Express Midi</span>
                            )}
                            
                            <Clock size={16} className="text-gray-500" />
                            <span className="text-sm font-medium">{point.estimatedTime}</span>
                          </div>
                        </div>

                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {point.address.full_address}
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          Distance: {(point.distance || 0).toFixed(1)} km
                        </div>

                        {/* Colis de ce point */}
                        <div className="space-y-1">
                          {point.packages.map(pkg => (
                            <div key={pkg.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                              <div className="flex items-center space-x-2">
                                {pkg.type === 'entreprise' ? <Building size={14} /> : <Home size={14} />}
                                <span>{pkg.barcode || pkg.id}</span>
                                <span className="text-gray-500">({pkg.location})</span>
                                {pkg.status === 'delivered' && <CheckCircle size={14} className="text-green-600" />}
                                {pkg.status === 'failed' && <AlertTriangle size={14} className="text-red-600" />}
                              </div>
                              
                              <div className="flex space-x-1">
                                {pkg.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handlePackageStatusChange(pkg.id, 'delivered')}
                                      className="text-green-600 hover:bg-green-100 p-1 rounded"
                                      title="Marquer comme livré"
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                    <button
                                      onClick={() => handlePackageStatusChange(pkg.id, 'failed')}
                                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                                      title="Marquer comme échec"
                                    >
                                      <AlertTriangle size={14} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => removePackageFromRoute(pkg.id)}
                                  className="text-gray-500 hover:bg-gray-200 p-1 rounded"
                                  title="Supprimer de la tournée"
                                >
                                  <Minus size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => navigateToPoint(point)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center"
                        >
                          <Map size={16} className="mr-1" />
                          Guide
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.address.full_address)}`;
                            window.open(url, '_blank');
                          }}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
                        >
                          <Navigation size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flèche de connexion */}
                  {index < deliveryPoints.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight size={20} className="text-blue-500" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Point d'arrivée - Dépôt UPS */}
            {settings.returnToDepot && deliveryPoints.length > 0 && (
              <>
                <div className="flex justify-center py-2">
                  <ArrowRight size={20} className="text-blue-500" />
                </div>
                <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      🏢
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-purple-800">Point de fin - Dépôt UPS</div>
                      <div className="text-sm text-purple-700">{UPS_DEPOT_ADDRESS.full_address}</div>
                      <div className="text-xs text-purple-600 mt-1">
                        Fin prévue: {tourStats.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Résumé en bas */}
      {deliveryPoints.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium">Fin prévue: {tourStats.endTime}</span>
              {settings.returnToDepot && (
                <span className="text-gray-500 ml-2">(retour au dépôt inclus)</span>
              )}
            </div>
            <div className="text-right">
              <div>Temps total: {tourStats.totalTime}</div>
              <div className="text-gray-500">{tourStats.totalDistance} km</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};