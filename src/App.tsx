import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Package as PackageIcon, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Truck, 
  Home, 
  Building2,
  ScanLine,
  Route,
  Trash2,
  ArrowLeft,
  Loader2,
  Wifi,
  WifiOff,
  Edit3,
  Save,
  Map,
  Play
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { usePackages } from './hooks/usePackages';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppView, TruckLocation, DeliveryPoint, Address } from './types';
import { DEFAULT_TRUCK_LOCATIONS } from './constants/locations';
import { geminiOCR } from './services/geminiOCR';
import { offlineStorage } from './services/offlineStorage';
import { RouteOptimizer, OptimizationMode } from './services/routeOptimization';
import { BANService } from './services/banService';
import { CameraCapture } from './components/CameraCapture';
import { PackageCard } from './components/PackageCard';
import { StatsPanel } from './components/StatsPanel';
import { SmartAddressForm } from './components/SmartAddressForm';
import { DeliveryMap } from './components/DeliveryMap';
import { GPSNavigation } from './components/GPSNavigation';
import { AddressDatabaseService } from './services/addressDatabase';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [isAddressCapture, setIsAddressCapture] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [capturedAddress, setCapturedAddress] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>({ type: 'simple' });
  const [showOptimizationSettings, setShowOptimizationSettings] = useState(false);
  const [customLocations, setCustomLocations] = useLocalStorage<TruckLocation[]>('custom-locations', []);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationColor, setNewLocationColor] = useState('#3b82f6');
  const [showSmartAddressForm, setShowSmartAddressForm] = useState(false);
  
  const { packages, addPackage, updatePackage, removePackage, clearAllPackages, getPackagesByStatus } = usePackages();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const allLocations = [...DEFAULT_TRUCK_LOCATIONS, ...customLocations];

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    // Initialize offline storage
    offlineStorage.initialize();

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update delivery points when packages change
  useEffect(() => {
    const points = RouteOptimizer.groupPackagesByAddress(packages);
    setDeliveryPoints(points);
  }, [packages, setDeliveryPoints]);

  const startBarcodeScanning = async () => {
    try {
      setIsScanning(true);
      codeReader.current = new BrowserMultiFormatReader();

      const videoElement = videoRef.current;
      if (!videoElement) return;

      await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoElement,
        (scanResult) => {
          if (scanResult) {
            setScanResult(scanResult.getText());
            stopScanning();
            setIsAddressCapture(true);
          }
        }
      );
    } catch (error) {
      console.error('Barcode scanning error:', error);
      stopScanning();
      alert('Erreur lors du scan. Veuillez réessayer ou utiliser la saisie manuelle.');
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      (codeReader.current as any).reset();
      codeReader.current = null;
    }
    setIsScanning(false);
  };

  const handleAddressCapture = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      const result = await geminiOCR.extractAddressFromImage(imageData);
      
      if (result.address === "ERREUR_LECTURE") {
        alert('Impossible de lire l\'adresse. Veuillez saisir manuellement.');
        setCapturedAddress('');
        setOcrConfidence(0);
        setShowSmartAddressForm(true);
      } else {
        setCapturedAddress(result.address);
        setOcrConfidence(result.confidence);
        setShowSmartAddressForm(true);
      }
      
      setIsAddressCapture(false);
    } catch (error) {
      console.error('Erreur lors de la capture d\'adresse:', error);
      alert('Erreur lors de l\'analyse de l\'image. Veuillez saisir manuellement.');
      setCapturedAddress('');
      setOcrConfidence(0);
      setIsAddressCapture(false);
      setShowSmartAddressForm(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const addCustomLocation = () => {
    if (!newLocationName.trim()) return;
    
    const newLocation: TruckLocation = {
      id: `custom-${Date.now()}`,
      name: newLocationName.trim(),
      color: newLocationColor
    };
    
    setCustomLocations([...customLocations, newLocation]);
    setNewLocationName('');
    setNewLocationColor('#3b82f6');
    setShowAddLocation(false);
  };

  const PackageForm = () => {
    const [formData, setFormData] = useState({
      location: '',
      notes: '',
      type: 'particulier' as 'particulier' | 'entreprise',
      photo: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAddress || !formData.location) {
        alert('Veuillez sélectionner une adresse et un emplacement.');
        return;
      }

      const packageData = {
        barcode: scanResult || 'MANUAL_ENTRY',
        address: selectedAddress,
        location: formData.location,
        notes: formData.notes.trim(),
        type: formData.type as 'particulier' | 'entreprise',
        status: 'pending',
        photo: formData.photo
      };

      addPackage(packageData);

      // Reset form
      setFormData({
        location: '',
        notes: '',
        type: 'particulier',
      });
      setScanResult('');
      setCapturedAddress('');
      setSelectedAddress(null);
      setOcrConfidence(0);
      setShowAddressForm(false);
      
      alert('Colis enregistré ! Prêt pour le suivant.');
    };

    const handleCancel = () => {
      setFormData({
        location: '',
        notes: '',
        type: 'particulier',
        photo: '',
      });
      setScanResult('');
      setCapturedAddress('');
      setSelectedAddress(null);
      setOcrConfidence(0);
      setShowSmartAddressForm(false);
      setCurrentView('home');
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Informations du colis</h2>
          {scanResult && scanResult !== 'MANUAL_ENTRY' && (
            <p className="text-sm text-gray-600">Code-barres: {scanResult.substring(0, 20)}...</p>
          )}
        </div>

        {selectedAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Check size={16} className="text-green-600" />
              <span className="font-medium text-green-800">Adresse sélectionnée</span>
            </div>
            <p className="text-green-700">{selectedAddress.full_address}</p>
            {ocrConfidence > 0 && (
              <p className="text-sm text-green-600 mt-1">
                Confiance OCR: {Math.round(ocrConfidence * 100)}%
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Emplacement dans le camion *</label>
              <button
                type="button"
                onClick={() => setShowAddLocation(!showAddLocation)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {showAddLocation && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3">Ajouter un emplacement</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Nom de l'emplacement"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newLocationColor}
                      onChange={(e) => setNewLocationColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={addCustomLocation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {allLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setFormData({...formData, location: location.name})}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.location === location.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: location.color }}
                    />
                    <span className="font-medium text-sm">{location.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type de livraison</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'particulier'})}
                className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                  formData.type === 'particulier'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Home size={20} className="text-blue-600" />
                <span className="font-medium">Particulier</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'entreprise'})}
                className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                  formData.type === 'entreprise'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Building2 size={20} className="text-purple-600" />
                <span className="font-medium">Entreprise</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Ex: Fragile, Code portail 1234B, Étage 3..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={20} />
              <span>Enregistrer et scanner le suivant</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-4 border-2 border-gray-300 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ScanView = () => {
    // Smart address form after OCR or manual entry
    if (showSmartAddressForm) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Sélectionner l'adresse</h2>
            {capturedAddress && (
              <p className="text-sm text-gray-600">Adresse détectée: {capturedAddress}</p>
            )}
          </div>
          
          <SmartAddressForm
            onPackageComplete={(packageData, duplicateCount = 1) => {
              // Créer les colis (avec duplication si nécessaire)
              for (let i = 0; i < duplicateCount; i++) {
                addPackage(packageData);
              }
              
              setShowSmartAddressForm(false);
              setScanResult('');
              setCapturedAddress('');
              setCurrentView('home');
              
              const message = duplicateCount > 1 
                ? `${duplicateCount} colis enregistrés !` 
                : 'Colis enregistré !';
              alert(message + ' Prêt pour le suivant.');
            }}
            onCancel={() => {
              setShowSmartAddressForm(false);
              setCapturedAddress('');
              setScanResult('');
              setCurrentView('home');
            }}
            defaultPostcode="74"
            currentUser="Chauffeur"
            scannedBarcode={scanResult}
          />
        </div>
      );
    }

    // Address capture camera
    if (isAddressCapture) {
      return (
        <CameraCapture
          title="Capturer l'adresse"
          subtitle="Cadrez l'adresse sur l'étiquette et appuyez sur capturer"
          onCapture={handleAddressCapture}
          onCancel={() => {
            setIsAddressCapture(false);
            setShowSmartAddressForm(true);
          }}
          isProcessing={isProcessing}
        />
      );
    }

    // Package form after address selection
    if (selectedAddress) {
      return <PackageForm />;
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Scanner un colis</h2>
          <p className="text-gray-600 mb-6">
            {isScanning ? 'Pointez vers le code-barres' : 'Choisissez votre méthode de saisie'}
          </p>
        </div>

        {!isScanning ? (
          <div className="space-y-4">
            <button
              onClick={startBarcodeScanning}
              className="w-full bg-blue-600 text-white py-6 px-6 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3"
            >
              <ScanLine size={32} />
              <span>Scanner le code-barres</span>
            </button>
            
            <div className="text-center">
              <p className="text-gray-500 mb-4">ou</p>
            </div>

            <button
              onClick={() => {
                setScanResult('MANUAL_ENTRY');
                setShowSmartAddressForm(true);
              }}
              className="w-full bg-gray-600 text-white py-6 px-6 rounded-lg text-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-3"
            >
              <Edit3 size={24} />
              <span>Saisie manuelle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 w-64 h-32 rounded-lg opacity-75"></div>
              </div>
            </div>
            
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Arrêter le scan
            </button>
          </div>
        )}

        <button
          onClick={() => setCurrentView('home')}
          className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>
      </div>
    );
  };

  const generateRoute = async () => {
    const pendingPackages = getPackagesByStatus('pending');
    if (pendingPackages.length === 0) {
      alert('Aucun colis en attente pour créer une tournée.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const userPosition = await RouteOptimizer.getCurrentPosition();
      if (!userPosition) {
        alert('Impossible d\'obtenir votre position. Vérifiez les permissions de géolocalisation.');
        setIsProcessing(false);
        return;
      }

      // Grouper les colis par adresse
      const points = RouteOptimizer.groupPackagesByAddress(pendingPackages);
      
      // Géocoder toutes les adresses
      const geocodedPoints = await Promise.all(
        points.map(async (point) => {
          if (!point.address.coordinates) {
            const coords = await BANService.geocodeAddress(point.address);
            if (coords) {
              point.address.coordinates = coords;
              // Mettre à jour les colis avec les coordonnées
              point.packages.forEach(pkg => {
                pkg.address.coordinates = coords;
              });
            }
          }
          return point;
        })
      );

      const validPoints = geocodedPoints.filter(point => point.address.coordinates);
      
      if (validPoints.length === 0) {
        alert('Impossible de géocoder les adresses. Vérifiez votre connexion internet.');
        setIsProcessing(false);
        return;
      }

      // Calculer la matrice de distances
      const coordinates = validPoints.map(p => p.address.coordinates!);
      const distanceMatrix = await RouteOptimizer.getDistanceMatrix(coordinates);

      // Optimiser selon le mode choisi
      let optimizedPoints: DeliveryPoint[];
      if (optimizationMode.type === 'constrained' && optimizationMode.constraints) {
        optimizedPoints = RouteOptimizer.optimizeWithConstraints(
          validPoints,
          userPosition,
          distanceMatrix,
          optimizationMode.constraints
        );
      } else {
        optimizedPoints = RouteOptimizer.optimizeSimple(validPoints, userPosition, distanceMatrix);
      }

      // Améliorer avec 2-opt si plus de 4 points
      if (optimizedPoints.length > 4) {
        optimizedPoints = RouteOptimizer.improve2Opt(optimizedPoints, distanceMatrix);
      }

      setDeliveryPoints(optimizedPoints);
      setCurrentView('route');
      
      alert(`Tournée optimisée créée avec ${optimizedPoints.length} points de livraison !`);
    } catch (error) {
      console.error('Route generation error:', error);
      alert('Erreur lors de la génération de la tournée. Vérifiez votre connexion internet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startDeliveryTour = async () => {
    if (deliveryPoints.length === 0) {
      alert('Aucune tournée générée. Créez d\'abord votre tournée.');
      return;
    }

    setCurrentPointIndex(0);
    setCurrentView('map');
  };

  const handlePointComplete = (pointId: string) => {
    const point = deliveryPoints.find(p => p.id === pointId);
    if (!point) return;

    // Mark all packages in this point as delivered
    point.packages.forEach(pkg => {
      updatePackage(pkg.id, { status: 'delivered' });
      // Ajouter à l'historique de livraison
      AddressDatabaseService.addDeliveryHistory(pkg.address.id, true, 'Chauffeur');
    });

    // Move to next point
    const nextIndex = currentPointIndex + 1;
    if (nextIndex < deliveryPoints.length) {
      setCurrentPointIndex(nextIndex);
    } else {
      alert('Tournée terminée ! Félicitations !');
      setCurrentView('home');
    }
  };

  const handleAddAddressTour = async () => {
    // Logique pour ajouter une adresse pendant la tournée
    setCurrentView('scan');
  };

  const handleRecalculateRoute = async () => {
    if (deliveryPoints.length === 0) return;

    setIsProcessing(true);
    try {
      const userPosition = await RouteOptimizer.getCurrentPosition();
      if (!userPosition) {
        alert('Impossible d\'obtenir votre position.');
        setIsProcessing(false);
        return;
      }

      // Recalculer à partir du point actuel
      const remainingPoints = deliveryPoints.slice(currentPointIndex);
      const coordinates = remainingPoints
        .filter(p => p.address.coordinates)
        .map(p => p.address.coordinates!);

      if (coordinates.length > 0) {
        const distanceMatrix = await RouteOptimizer.getDistanceMatrix(coordinates);
        const optimized = RouteOptimizer.optimizeSimple(remainingPoints, userPosition, distanceMatrix);
        
        // Réajuster les ordres
        optimized.forEach((point, index) => {
          point.order = currentPointIndex + index + 1;
        });

        const newDeliveryPoints = [
          ...deliveryPoints.slice(0, currentPointIndex),
          ...optimized
        ];

        setDeliveryPoints(newDeliveryPoints);
        alert('Itinéraire recalculé !');
      }
    } catch (error) {
      console.error('Recalculation error:', error);
      alert('Erreur lors du recalcul de l\'itinéraire.');
    } finally {
      setIsProcessing(false);
    }
  };

  const HomeView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Tournée Facile</h1>
          {isOnline ? (
            <Wifi size={20} className="text-green-600" />
          ) : (
            <WifiOff size={20} className="text-red-600" />
          )}
        </div>
        <p className="text-gray-600">
          Assistant de livraison intelligent
          {!isOnline && (
            <span className="block text-sm text-amber-600 mt-1">
              Mode hors-ligne - Optimisation limitée
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setCurrentView('scan')}
          className="bg-blue-600 text-white py-6 px-6 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3"
        >
          <Camera size={32} />
          <span>Scanner un colis</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={generateRoute}
            disabled={getPackagesByStatus('pending').length === 0 || isProcessing || !isOnline}
            className="bg-green-600 text-white py-4 px-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Calcul...</span>
              </>
            ) : (
              <>
                <Route size={20} />
                <span>Préparer Tournée</span>
              </>
            )}
          </button>

          <button
            onClick={() => setCurrentView('gps')}
            disabled={deliveryPoints.length === 0}
            className="bg-purple-600 text-white py-4 px-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play size={20} />
            <span>Lancer Tournée</span>
          </button>
        </div>

        <button
          onClick={() => setShowOptimizationSettings(!showOptimizationSettings)}
          className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Settings size={20} />
          <span>Mode d'optimisation</span>
        </button>

        {showOptimizationSettings && (
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
            <h3 className="text-lg font-semibold mb-4">Paramètres d'optimisation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mode d'optimisation</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={optimizationMode.type === 'simple'}
                      onChange={() => setOptimizationMode({ type: 'simple' })}
                      className="text-blue-600"
                    />
                    <span>Simple (distance minimale)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={optimizationMode.type === 'constrained'}
                      onChange={() => setOptimizationMode({ 
                        type: 'constrained',
                        constraints: {
                          priorities: {},
                          timeWindows: {}
                        }
                      })}
                      className="text-blue-600"
                    />
                    <span>Avec contraintes (priorités, horaires)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCurrentView('settings')}
          className="bg-gray-600 text-white py-4 px-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </button>
      </div>

      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <WifiOff size={20} className="text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Mode hors-ligne</p>
              <p className="text-sm text-amber-600">
                L'optimisation de tournée nécessite une connexion internet
              </p>
            </div>
          </div>
        </div>
      )}

      <StatsPanel packages={packages} />

      {/* Delivery Points Summary */}
      {deliveryPoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Points de livraison ({deliveryPoints.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {deliveryPoints.map((point) => (
              <div key={point.id} className={`p-4 rounded-lg border-2 ${
                point.status === 'completed' ? 'bg-green-50 border-green-200' :
                point.status === 'partial' ? 'bg-amber-50 border-amber-200' :
                'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Point {point.order}</span>
                  <span className="text-sm text-gray-600">{point.packages.length} colis</span>
                </div>
                <p className="text-sm text-gray-700">{point.address.full_address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Colis scannés ({packages.length})</h2>
          {packages.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer tous les colis ?')) {
                  clearAllPackages();
                  setDeliveryPoints([]);
                }
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        
        {packages.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onUpdateStatus={(id, status) => updatePackage(id, { status })}
                onRemove={removePackage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PackageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun colis scanné</p>
            <p className="text-sm">Commencez par scanner votre premier colis</p>
          </div>
        )}
      </div>
    </div>
  );

  const RouteView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournée optimisée</h2>
        <div className="flex space-x-2">
          <button
            onClick={startDeliveryTour}
            disabled={deliveryPoints.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            <Map size={16} />
            <span>Carte</span>
          </button>
          <button
            onClick={() => setCurrentView('home')}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {deliveryPoints.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              {deliveryPoints.length} points de livraison dans votre tournée optimisée
            </p>
            <p className="text-sm text-blue-600">
              Cliquez sur "Carte" pour lancer la navigation
            </p>
          </div>
          
          {deliveryPoints.map((point) => (
            <div key={point.id} className={`p-4 rounded-lg border-2 ${
              point.status === 'completed' ? 'bg-green-50 border-green-200 opacity-75' :
              point.status === 'partial' ? 'bg-amber-50 border-amber-200' :
              'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {point.order}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      Point #{point.order} - {point.packages.length} colis
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{point.address.full_address}</p>
                    {point.distance && (
                      <p className="text-sm text-gray-600">Distance: {point.distance.toFixed(1)} km</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {point.packages.map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Truck size={14} className="text-gray-500" />
                          <span className="text-sm font-medium">{pkg.location}</span>
                          {pkg.type === 'entreprise' && (
                            <Building2 size={14} className="text-purple-600" />
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          pkg.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.status === 'delivered' ? 'Livré' :
                           pkg.status === 'failed' ? 'Échec' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Route size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucune tournée générée</p>
          <p className="text-sm">Scannez des colis puis cliquez sur "Préparer Tournée"</p>
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Gestion des données</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-800">Terminer la journée</p>
              <p className="text-sm text-red-600">Efface tous les colis et la tournée</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir effacer toutes les données de la journée ?')) {
                  clearAllPackages();
                  setDeliveryPoints([]);
                  offlineStorage.clearAllData();
                  alert('Données effacées avec succès ! Prêt pour une nouvelle journée.');
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Terminer la journée</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Emplacements personnalisés</h3>
        
        {customLocations.length > 0 ? (
          <div className="space-y-2 mb-4">
            {customLocations.map((location) => (
              <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: location.color }}
                  />
                  <span className="font-medium">{location.name}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer l'emplacement "${location.name}" ?`)) {
                      setCustomLocations(customLocations.filter(l => l.id !== location.id));
                    }
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">Aucun emplacement personnalisé</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">À propos</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Tournée Facile</strong> v2.0</p>
          <p>Assistant de livraison pour chauffeurs professionnels</p>
          <p>✅ Gestion par points de livraison</p>
          <p>✅ Autocomplétion d'adresses</p>
          <p>✅ Carte intégrée avec navigation</p>
          <p>✅ Optimisation de tournée intelligente</p>
          <p>✅ Fonctionnement hors-ligne</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'scan':
        return <ScanView />;
      case 'route':
        return <RouteView />;
      case 'map':
        return (
          <GPSNavigation
            deliveryPoints={deliveryPoints}
            currentPointIndex={currentPointIndex}
            userPosition={userPosition}
            onDeliveryComplete={handlePointComplete}
            onAddAddress={handleAddAddressTour}
            onRecalculateRoute={handleRecalculateRoute}
            onBack={() => setCurrentView('route')}
          />
        );
      case 'gps':
        return (
          <GPSNavigation
            points={deliveryPoints}
            currentPointIndex={currentPointIndex}
            userPosition={userPosition}
            onPointComplete={handlePointComplete}
            onAddAddress={handleAddAddressTour}
            onRecalculateRoute={handleRecalculateRoute}
            onBack={() => setCurrentView('route')}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen">
        <div className="p-6">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
}

export default App;