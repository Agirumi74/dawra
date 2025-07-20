import React, { useState, useEffect } from 'react';
import { 
  Play, 
  SkipForward, 
  Pause, 
  RotateCcw,
  CheckCircle,
  MapPin,
  Navigation,
  Clock,
  Package,
  Target,
  Smartphone,
  Route as RouteIcon,
  Settings,
  Download,
  Share,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Package as PackageType, DeliveryPoint, UserPosition, Address } from '../types';
import { RouteOptimizer } from '../services/routeOptimization';
import { EnhancedRouteExportService } from '../services/enhancedRouteExport';
import { geocodeAddress } from '../services/geocoding';

interface GPSDemoProps {
  onClose?: () => void;
}

type DemoStep = 'intro' | 'setup' | 'scanning' | 'optimization' | 'navigation' | 'export' | 'complete';

// Données de démonstration
const DEMO_PACKAGES: Omit<PackageType, 'id' | 'createdAt'>[] = [
  {
    barcode: 'PKG001',
    address: {
      id: 'addr1',
      street_number: '12',
      street_name: 'Rue de la Paix',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      full_address: '12 Rue de la Paix, 75001 Paris',
      coordinates: { lat: 48.8697, lng: 2.3313 }
    },
    location: 'Étagère Gauche Haut',
    notes: 'Fragile - Attention',
    type: 'particulier',
    priority: 'premier',
    status: 'pending',
    timeWindow: { start: '09:00', end: '11:00' }
  },
  {
    barcode: 'PKG002',
    address: {
      id: 'addr2',
      street_number: '25',
      street_name: 'Boulevard Saint-Germain',
      postal_code: '75006',
      city: 'Paris',
      country: 'France',
      full_address: '25 Boulevard Saint-Germain, 75006 Paris',
      coordinates: { lat: 48.8555, lng: 2.3397 }
    },
    location: 'Cul du camion',
    notes: 'Code porte: 1234A',
    type: 'entreprise',
    priority: 'express_midi',
    status: 'pending',
    timeWindow: { end: '12:00' }
  },
  {
    barcode: 'PKG003',
    address: {
      id: 'addr3',
      street_number: '88',
      street_name: 'Avenue des Champs-Élysées',
      postal_code: '75008',
      city: 'Paris',
      country: 'France',
      full_address: '88 Avenue des Champs-Élysées, 75008 Paris',
      coordinates: { lat: 48.8717, lng: 2.3006 }
    },
    location: 'Étagère Droite Milieu',
    notes: '',
    type: 'particulier',
    priority: 'standard',
    status: 'pending'
  },
  {
    barcode: 'PKG004',
    address: {
      id: 'addr4',
      street_number: '15',
      street_name: 'Place Vendôme',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      full_address: '15 Place Vendôme, 75001 Paris',
      coordinates: { lat: 48.8677, lng: 2.3281 }
    },
    location: 'Étagère Gauche Bas',
    notes: 'Livraison en main propre uniquement',
    type: 'entreprise',
    priority: 'standard',
    status: 'pending'
  },
  {
    barcode: 'PKG005',
    address: {
      id: 'addr5',
      street_number: '32',
      street_name: 'Rue du Faubourg Saint-Honoré',
      postal_code: '75008',
      city: 'Paris',
      country: 'France',
      full_address: '32 Rue du Faubourg Saint-Honoré, 75008 Paris',
      coordinates: { lat: 48.8706, lng: 2.3166 }
    },
    location: 'Étagère Droite Haut',
    notes: 'Attention chien',
    type: 'particulier',
    priority: 'standard',
    status: 'pending'
  }
];

export const GPSDemo: React.FC<GPSDemoProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoPackages, setDemoPackages] = useState<PackageType[]>([]);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [userPosition] = useState<UserPosition>({ lat: 48.8566, lng: 2.3522 }); // Position Paris centre
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const steps: { id: DemoStep; title: string; description: string; duration: number }[] = [
    {
      id: 'intro',
      title: 'Introduction GPS Manager',
      description: 'Découvrez la solution complète de gestion GPS pour la livraison',
      duration: 3000
    },
    {
      id: 'setup',
      title: 'Configuration initiale',
      description: 'Paramétrage des préférences de tournée et position du chauffeur',
      duration: 2000
    },
    {
      id: 'scanning',
      title: 'Scan des colis',
      description: 'Simulation du scan de codes-barres et capture d\'adresses',
      duration: 4000
    },
    {
      id: 'optimization',
      title: 'Optimisation TSP',
      description: 'Calcul de l\'itinéraire optimal avec contraintes',
      duration: 3000
    },
    {
      id: 'navigation',
      title: 'Navigation GPS',
      description: 'Mode navigation avec export vers apps externes',
      duration: 5000
    },
    {
      id: 'export',
      title: 'Export et partage',
      description: 'Export vers Google Maps, Waze, et autres formats',
      duration: 2000
    },
    {
      id: 'complete',
      title: 'Démonstration terminée',
      description: 'Résumé des fonctionnalités GPS',
      duration: 1000
    }
  ];

  const currentStepInfo = steps.find(s => s.id === currentStep) || steps[0];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setStepProgress(prev => {
          const newProgress = prev + 100;
          if (newProgress >= currentStepInfo.duration) {
            // Passer à l'étape suivante
            const nextStepIndex = currentStepIndex + 1;
            if (nextStepIndex < steps.length) {
              setCurrentStep(steps[nextStepIndex].id);
              setProgress((nextStepIndex / (steps.length - 1)) * 100);
              executeStepAction(steps[nextStepIndex].id);
              return 0;
            } else {
              setIsPlaying(false);
              return currentStepInfo.duration;
            }
          }
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, currentStepIndex, currentStepInfo.duration]);

  const executeStepAction = async (step: DemoStep) => {
    switch (step) {
      case 'scanning':
        // Ajouter progressivement les colis de démo
        for (let i = 0; i < DEMO_PACKAGES.length; i++) {
          setTimeout(() => {
            const pkg: PackageType = {
              ...DEMO_PACKAGES[i],
              id: `demo-pkg-${i + 1}`,
              createdAt: new Date()
            };
            setDemoPackages(prev => [...prev, pkg]);
          }, i * 800);
        }
        break;

      case 'optimization':
        // Simuler l'optimisation de route
        setTimeout(async () => {
          const groupedPoints = RouteOptimizer.groupPackagesByAddress(demoPackages);
          const coordinates = groupedPoints.map(p => p.address.coordinates!);
          const distanceMatrix = await RouteOptimizer.getDistanceMatrix(coordinates);
          
          const optimizedRoute = RouteOptimizer.optimizeWithConstraints(
            groupedPoints,
            userPosition,
            distanceMatrix,
            {},
            '08:00',
            15,
            30
          );

          setDeliveryPoints(optimizedRoute);
        }, 1000);
        break;

      case 'navigation':
        // Simuler des livraisons
        setTimeout(() => {
          setCurrentPointIndex(1);
          // Marquer le premier point comme livré
          if (deliveryPoints.length > 0) {
            setDemoPackages(prev => 
              prev.map(pkg => 
                deliveryPoints[0].packages.some(p => p.id === pkg.id) 
                  ? { ...pkg, status: 'delivered' as const }
                  : pkg
              )
            );
          }
        }, 2000);
        break;
    }
  };

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep('setup');
    setProgress(0);
    setStepProgress(0);
    executeStepAction('setup');
  };

  const pauseDemo = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep('intro');
    setProgress(0);
    setStepProgress(0);
    setDemoPackages([]);
    setDeliveryPoints([]);
    setCurrentPointIndex(0);
  };

  const nextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].id);
      setProgress((nextStepIndex / (steps.length - 1)) * 100);
      setStepProgress(0);
      executeStepAction(steps[nextStepIndex].id);
    }
  };

  const exportDemoToGPS = (format: 'google' | 'waze' | 'apple') => {
    if (deliveryPoints.length === 0) {
      alert('Aucune tournée générée pour la démonstration');
      return;
    }

    try {
      switch (format) {
        case 'google':
          EnhancedRouteExportService.exportToGoogleMaps(deliveryPoints);
          break;
        case 'waze':
          EnhancedRouteExportService.exportToWaze(deliveryPoints);
          break;
        case 'apple':
          EnhancedRouteExportService.exportToAppleMaps(deliveryPoints);
          break;
      }
    } catch (error) {
      console.error('Erreur export GPS:', error);
      alert('Erreur lors de l\'export: ' + (error as Error).message);
    }
  };

  const renderIntroStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <Navigation size={48} className="text-blue-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">GPS Manager</h2>
        <p className="text-lg text-gray-600 mb-6">
          Solution complète pour la gestion et l'optimisation des tournées de livraison
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">Optimisation TSP</div>
            <div className="text-gray-600">Algorithme du voyageur de commerce avec contraintes</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">Export GPS</div>
            <div className="text-gray-600">Google Maps, Waze, Plans natifs</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <RouteIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-semibold">Temps réel</div>
            <div className="text-gray-600">Gestion dynamique des colis</div>
          </div>
        </div>
      </div>
      <button
        onClick={startDemo}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
      >
        <Play size={20} />
        <span>Démarrer la démonstration</span>
      </button>
    </div>
  );

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Configuration GPS</h3>
        <p className="text-gray-600">Paramétrage initial de la tournée</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Paramètres de route</h4>
          <div className="space-y-2 text-sm">
            <div>🕐 Heure de départ: 08:00</div>
            <div>⏱️ Temps d'arrêt: 15 minutes</div>
            <div>🚗 Vitesse moyenne: 30 km/h</div>
            <div>📍 Position: Paris Centre</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Contraintes activées</h4>
          <div className="space-y-2 text-sm">
            <div>✅ Priorités (Premier, Express, Standard)</div>
            <div>✅ Fenêtres temporelles</div>
            <div>✅ Optimisation 2-opt</div>
            <div>✅ Géolocalisation temps réel</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScanningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Scan des colis</h3>
        <p className="text-gray-600">Simulation du scan de codes-barres</p>
      </div>
      
      <div className="space-y-3">
        {demoPackages.map((pkg, index) => (
          <div
            key={pkg.id}
            className="bg-white border rounded-lg p-4 animate-fade-in"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Package size={16} className="text-gray-500" />
                  <span className="font-medium">Code: {pkg.barcode}</span>
                  {pkg.priority === 'premier' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Premier</span>
                  )}
                  {pkg.priority === 'express_midi' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Express</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{pkg.address.full_address}</div>
                <div className="text-xs text-gray-500">{pkg.location}</div>
              </div>
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        ))}
      </div>
      
      {demoPackages.length === DEMO_PACKAGES.length && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="font-semibold text-green-800">
            {demoPackages.length} colis scannés avec succès
          </div>
        </div>
      )}
    </div>
  );

  const renderOptimizationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Optimisation TSP</h3>
        <p className="text-gray-600">Calcul de l'itinéraire optimal</p>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Algorithme utilisé</h4>
        <div className="space-y-2 text-sm">
          <div>🎯 TSP avec contraintes temporelles</div>
          <div>📊 Matrice de distances OSRM</div>
          <div>⭐ Priorisation: Premier → Express → Standard</div>
          <div>🔄 Amélioration 2-opt</div>
        </div>
      </div>
      
      {deliveryPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Tournée optimisée ({deliveryPoints.length} arrêts)</h4>
          {deliveryPoints.map((point, index) => (
            <div key={point.id} className="flex items-center space-x-3 p-3 bg-white rounded border">
              <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {point.order}
              </div>
              <div className="flex-1">
                <div className="font-medium">{point.address.full_address}</div>
                <div className="text-sm text-gray-600">
                  {point.estimatedTime && `${point.estimatedTime} • `}
                  {(point.distance || 0).toFixed(1)} km • {point.packages.length} colis
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-gray-100 rounded">
                {point.priority === 'premier' ? '🔴' : point.priority === 'express_midi' ? '🟠' : '⚪'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNavigationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Navigation className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Navigation GPS</h3>
        <p className="text-gray-600">Mode navigation avec intégration GPS externe</p>
      </div>
      
      {deliveryPoints.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Point actuel</h4>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {currentPointIndex + 1}
              </div>
              <div>
                <div className="font-medium">{deliveryPoints[currentPointIndex]?.address.full_address}</div>
                <div className="text-sm text-gray-600">
                  {deliveryPoints[currentPointIndex]?.packages.length} colis à livrer
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => exportDemoToGPS('google')}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => exportDemoToGPS('waze')}
              className="flex items-center justify-center space-x-2 bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Waze</span>
            </button>
            <button
              onClick={() => exportDemoToGPS('apple')}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Navigation size={16} />
              <span>Plans (iOS)</span>
            </button>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Fonctionnalités navigation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>✅ Deep linking vers apps GPS natives</div>
              <div>✅ Support waypoints multiples</div>
              <div>✅ Marquage livraison temps réel</div>
              <div>✅ Ajout/suppression colis dynamique</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExportStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Download className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Export et partage</h3>
        <p className="text-gray-600">Formats d'export multiples</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-semibold">Formats GPS</h4>
          <div className="space-y-2">
            <button className="w-full text-left p-3 bg-blue-50 rounded border hover:bg-blue-100 transition-colors">
              <div className="font-medium">Google Maps</div>
              <div className="text-sm text-gray-600">URL avec waypoints optimisés</div>
            </button>
            <button className="w-full text-left p-3 bg-cyan-50 rounded border hover:bg-cyan-100 transition-colors">
              <div className="font-medium">Waze</div>
              <div className="text-sm text-gray-600">Deep linking natif</div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
              <div className="font-medium">GPX / KML</div>
              <div className="text-sm text-gray-600">Compatible GPS professionnels</div>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold">Formats data</h4>
          <div className="space-y-2">
            <button className="w-full text-left p-3 bg-red-50 rounded border hover:bg-red-100 transition-colors">
              <div className="font-medium">PDF</div>
              <div className="text-sm text-gray-600">Feuille de route imprimable</div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 rounded border hover:bg-green-100 transition-colors">
              <div className="font-medium">CSV</div>
              <div className="text-sm text-gray-600">Données structured</div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 rounded border hover:bg-purple-100 transition-colors">
              <div className="font-medium">Partage</div>
              <div className="text-sm text-gray-600">Web Share API</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="w-24 h-24 text-green-600 mx-auto" />
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Démonstration terminée</h2>
        <p className="text-lg text-gray-600 mb-6">
          Vous avez découvert toutes les fonctionnalités GPS du système
        </p>
      </div>
      
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Récapitulatif des fonctionnalités</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>✅ Optimisation TSP avec contraintes</div>
            <div>✅ Gestion des priorités et fenêtres temporelles</div>
            <div>✅ Calcul de matrices de distances réelles</div>
            <div>✅ Amélioration 2-opt automatique</div>
          </div>
          <div className="space-y-2">
            <div>✅ Export vers tous les GPS populaires</div>
            <div>✅ Deep linking natif iOS/Android</div>
            <div>✅ Gestion temps réel des colis</div>
            <div>✅ Formats d'export multiples</div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
        <button
          onClick={resetDemo}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Relancer la démo</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'intro': return renderIntroStep();
      case 'setup': return renderSetupStep();
      case 'scanning': return renderScanningStep();
      case 'optimization': return renderOptimizationStep();
      case 'navigation': return renderNavigationStep();
      case 'export': return renderExportStep();
      case 'complete': return renderCompleteStep();
      default: return renderIntroStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Navigation size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Démonstration GPS</h1>
                <p className="text-sm text-gray-600">{currentStepInfo.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentStep !== 'intro' && currentStep !== 'complete' && (
                <>
                  {isPlaying ? (
                    <button
                      onClick={pauseDemo}
                      className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      title="Pause"
                    >
                      <Pause size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Reprendre"
                    >
                      <Play size={20} />
                    </button>
                  )}
                  
                  <button
                    onClick={nextStep}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Étape suivante"
                  >
                    <SkipForward size={20} />
                  </button>
                  
                  <button
                    onClick={resetDemo}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="Recommencer"
                  >
                    <RotateCcw size={20} />
                  </button>
                </>
              )}
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {currentStep !== 'intro' && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Étape {currentStepIndex + 1} sur {steps.length}</span>
              <span>{Math.round(progress)}% terminé</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Info banner */}
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <Info size={20} />
          <div className="flex-1">
            <div className="font-medium">{currentStepInfo.title}</div>
            <div className="text-sm opacity-90">{currentStepInfo.description}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};