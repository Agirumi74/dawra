import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Route, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Navigation,
  Camera,
  Settings
} from 'lucide-react';
import { BarcodeScanner } from '../BarcodeScanner';
import { PackageForm } from '../PackageForm';
import { EnhancedRouteView } from '../EnhancedRouteView';
import { TourProgressView } from '../TourProgressView';
import { usePackages } from '../../hooks/usePackages';

interface DriverDashboardProps {
  user: any;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'scan' | 'route' | 'history'>('today');
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [todayRoute, setTodayRoute] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState<string | undefined>(undefined);
  
  const { packages, addPackage, getPackagesByStatus } = usePackages();

  useEffect(() => {
    // Charger les données du chauffeur
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    // TODO: Implémenter le chargement des données
    // - Véhicule assigné
    // - Tournée du jour
    // - Statistiques
  };

  const handleBarcodeScanned = (barcode: string) => {
    setCurrentBarcode(barcode);
    setShowBarcodeScanner(false);
    setShowPackageForm(true);
  };

  const handlePackageSaved = (packageData: any) => {
    addPackage(packageData);
    setShowPackageForm(false);
    setCurrentBarcode(undefined);
    // Retourner à l'onglet scan pour continuer
    setActiveTab('scan');
  };

  const handleCancelScanning = () => {
    setShowBarcodeScanner(false);
    setShowPackageForm(false);
    setCurrentBarcode(undefined);
  };

  const startScanning = () => {
    setShowBarcodeScanner(true);
  };

  const startManualEntry = () => {
    setCurrentBarcode(undefined);
    setShowPackageForm(true);
  };

  // Statistiques des colis
  const pendingPackages = getPackagesByStatus('pending');
  const deliveredPackages = getPackagesByStatus('delivered');
  const failedPackages = getPackagesByStatus('failed');

  const renderTodayView = () => (
    <div className="space-y-6">
      {/* Véhicule assigné */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Truck size={24} className="text-blue-600" />
            <span>Mon véhicule</span>
          </h2>
          <span className="text-sm text-gray-500">Aujourd'hui</span>
        </div>
        
        {currentVehicle ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-lg">{currentVehicle.licensePlate}</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Assigné
              </span>
            </div>
            <p className="text-gray-600">{currentVehicle.brand} {currentVehicle.model}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kilométrage:</span>
                <span className="ml-2 font-medium">{currentVehicle.mileage?.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-gray-500">Carburant:</span>
                <span className="ml-2 font-medium">{currentVehicle.fuelType}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Truck size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun véhicule assigné</p>
            <p className="text-sm">Contactez votre responsable</p>
          </div>
        )}
      </div>

      {/* Tournée du jour */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Route size={24} className="text-green-600" />
            <span>Tournée du jour</span>
          </h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Voir détails
          </button>
        </div>
        
        {todayRoute ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{todayRoute.totalPackages}</div>
                <div className="text-sm text-gray-600">Colis total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{todayRoute.delivered}</div>
                <div className="text-sm text-gray-600">Livrés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{todayRoute.remaining}</div>
                <div className="text-sm text-gray-600">Restants</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(todayRoute.delivered / todayRoute.totalPackages) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progression: {Math.round((todayRoute.delivered / todayRoute.totalPackages) * 100)}%</span>
              <span>Temps estimé: {todayRoute.estimatedTime}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Route size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucune tournée planifiée</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Créer une tournée
            </button>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('scan')}
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center space-y-3"
        >
          <Camera size={32} />
          <span className="font-semibold">Scanner un colis</span>
        </button>
        
        <button
          onClick={() => setActiveTab('route')}
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center space-y-3"
        >
          <Navigation size={32} />
          <span className="font-semibold">Lancer navigation</span>
        </button>
      </div>

      {/* Alertes et notifications */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle size={20} className="text-amber-600" />
          <span className="font-medium text-amber-800">Rappels</span>
        </div>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Vérification du véhicule avant départ</li>
          <li>• 3 colis prioritaires à livrer avant 12h</li>
          <li>• Maintenance programmée vendredi</li>
        </ul>
      </div>
    </div>
  );

  const renderScanView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Scanner des colis</h2>
        <p className="text-gray-600 mb-8">
          Utilisez votre caméra pour scanner les codes-barres et capturer les adresses
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <button 
            onClick={startScanning}
            className="w-full bg-blue-600 text-white py-6 px-6 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3"
          >
            <Camera size={32} />
            <span>Démarrer le scan</span>
          </button>
          
          <div className="text-center">
            <p className="text-gray-500 mb-4">ou</p>
          </div>

          <button 
            onClick={startManualEntry}
            className="w-full bg-gray-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Saisie manuelle
          </button>
        </div>
      </div>

      {/* Statistiques de scan */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Colis scannés aujourd'hui</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{packages.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{deliveredPackages.length}</div>
            <div className="text-sm text-gray-600">Livrés</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{failedPackages.length}</div>
            <div className="text-sm text-gray-600">Échecs</div>
          </div>
        </div>
      </div>

      {/* Liste des colis récents */}
      {packages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Colis récents</h3>
          <div className="space-y-3">
            {packages.slice(-5).reverse().map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{pkg.address.full_address}</p>
                  <p className="text-xs text-gray-600">{pkg.location}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {pkg.status === 'pending' ? 'En attente' :
                   pkg.status === 'delivered' ? 'Livré' : 'Échec'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodayView();
      case 'scan':
        return renderScanView();
      case 'route':
        return <EnhancedRouteView />;
      case 'history':
        return <div className="text-center py-8 text-gray-500">Historique en développement</div>;
      default:
        return renderTodayView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onCancel={handleCancelScanning}
          isActive={showBarcodeScanner}
        />
      )}

      {showPackageForm && (
        <PackageForm
          barcode={currentBarcode}
          onSave={handlePackageSaved}
          onCancel={handleCancelScanning}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Truck size={24} className="text-green-600" />
              <div>
                <h1 className="text-xl font-semibold">Tableau de bord chauffeur</h1>
                <p className="text-sm text-gray-600">
                  Bonjour {user.firstName} ! Bonne journée de livraison.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings size={20} />
              </button>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Truck size={16} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'today', label: 'Aujourd\'hui', icon: Clock },
              { id: 'scan', label: 'Scanner', icon: Camera },
              { id: 'route', label: 'Navigation', icon: Navigation },
              { id: 'history', label: 'Historique', icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};