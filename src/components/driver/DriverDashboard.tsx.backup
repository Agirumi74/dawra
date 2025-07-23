import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Route, 
  Clock, 
  AlertTriangle,
  Camera,
  Settings,
  Navigation,
  Target,
  Plus
} from 'lucide-react';
import { BarcodeScanner } from '../BarcodeScanner';
import { PackageForm } from '../PackageForm';
import { EnhancedGPSManager } from '../EnhancedGPSManager';
import { SettingsPage } from '../SettingsPage';

import { usePackages } from '../../hooks/usePackages';

interface DriverDashboardProps {
  user?: any; // Optional for backwards compatibility
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'scan' | 'gps' | 'history'>('today');
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [todayRoute, setTodayRoute] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showGPSManager, setShowGPSManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false);
  const [lastSavedPackage, setLastSavedPackage] = useState<any>(null);

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
    const savedPackage = addPackage(packageData);
    setLastSavedPackage(savedPackage);
    setShowPackageForm(false);
    setCurrentBarcode(undefined);
    
    // Show the "add another" dialog instead of immediately returning to scan
    setShowAddAnotherDialog(true);
  };

  const handleAddAnotherPackage = () => {
    setShowAddAnotherDialog(false);
    // Start a new package entry (could be with barcode or manual)
    setCurrentBarcode(undefined);
    setShowPackageForm(true);
  };

  const handleAddToSameAddress = () => {
    setShowAddAnotherDialog(false);
    // Start a new package entry with the same address prefilled
    setCurrentBarcode(undefined);
    setShowPackageForm(true);
  };

  const handleFinishAdding = () => {
    setShowAddAnotherDialog(false);
    setLastSavedPackage(null);
    // Return to the scan tab to continue scanning
    setActiveTab('scan');
  };

  const handleCancelScanning = () => {
    setShowBarcodeScanner(false);
    setShowPackageForm(false);
    setCurrentBarcode(undefined);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
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
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center space-x-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center space-x-2">
            <Route size={24} className="text-green-600" />
            <span>Tournée du jour</span>
          </h2>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Route size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune tournée planifiée</p>
          <p className="text-sm mt-2">Scannez vos colis pour commencer</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('scan')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Camera size={32} />
          <span className="font-semibold text-lg">Scanner un colis</span>
          <span className="text-sm text-blue-100">Démarrer le scan de codes-barres</span>
        </button>
        
        <button
          onClick={() => setShowGPSManager(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 transition-all duration-200 flex flex-col items-center space-y-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Navigation size={32} />
          <span className="font-semibold text-lg">GPS Manager</span>
          <span className="text-sm text-green-100">Optimiser vos tournées</span>
        </button>
      </div>

      {/* Nouvelle section GPS */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Target size={24} className="text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">GPS & Optimisation</h3>
              <p className="text-sm text-purple-700">Gestion complète des tournées</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setShowGPSManager(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Target size={16} />
            <span>Optimiser tournée</span>
          </button>
        </div>
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
        <h2 className="text-xl md:text-2xl font-bold mb-4">Scanner des colis</h2>
        <p className="text-gray-600 mb-8 px-4">
          Utilisez votre caméra pour scanner les codes-barres et capturer les adresses
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="space-y-4">
          <button 
            onClick={startScanning}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-6 rounded-xl text-lg md:text-xl font-semibold hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 flex items-center justify-center space-x-3 touch-manipulation shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Camera size={32} />
            <div className="text-left">
              <div>Démarrer le scan</div>
              <div className="text-sm text-blue-100 font-normal">Scanner les codes-barres</div>
            </div>
          </button>
          
          <div className="text-center">
            <p className="text-gray-500 mb-4">ou</p>
          </div>

          <button 
            onClick={startManualEntry}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-gray-700 hover:to-gray-800 active:from-gray-800 active:to-gray-900 transition-all duration-200 touch-manipulation shadow-lg hover:shadow-xl"
          >
            Saisie manuelle
          </button>
        </div>
      </div>

      {/* Statistiques de scan */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
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
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Colis récents</h3>
          <div className="space-y-3">
            {packages.slice(-5).reverse().map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{pkg.address.full_address}</p>
                  <p className="text-xs text-gray-600 truncate">{pkg.location}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ml-2 whitespace-nowrap ${
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
      case 'gps':
        return renderGPSView();
      case 'history':
        return <div className="text-center py-8 text-gray-500">Historique en développement</div>;
      default:
        return renderTodayView();
    }
  };

  const renderGPSView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4">GPS Manager</h2>
        <p className="text-gray-600 mb-8 px-4">
          Optimisation intelligente des tournées avec export vers apps GPS
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Fonctionnalités principales</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Target size={16} className="text-blue-600" />
                <span>Algorithme TSP avec contraintes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation size={16} className="text-green-600" />
                <span>Export Google Maps, Waze, Plans</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-orange-600" />
                <span>Gestion priorités et fenêtres temporelles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Route size={16} className="text-purple-600" />
                <span>Optimisation temps réel</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-xl font-bold text-blue-600">{packages.length}</div>
                <div className="text-xs text-gray-600">Colis scannés</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-xl font-bold text-green-600">{deliveredPackages.length}</div>
                <div className="text-xs text-gray-600">Livrés</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 mt-6">
          <div className="flex justify-center">
            <button
              onClick={() => setShowGPSManager(true)}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Target size={20} />
              <span>Lancer GPS Manager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Modals */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onCancel={handleCancelScanning}
          onOpenSettings={handleOpenSettings}
          isActive={showBarcodeScanner}
        />
      )}

      {showPackageForm && (
        <PackageForm
          barcode={currentBarcode}
          onSave={handlePackageSaved}
          onCancel={handleCancelScanning}
          prefilledAddress={lastSavedPackage?.address}
        />
      )}

      {/* Add Another Package Dialog */}
      {showAddAnotherDialog && lastSavedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Colis ajouté avec succès !
              </h3>
              <p className="text-gray-600 text-sm">
                Adresse: {lastSavedPackage.address.full_address}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleAddToSameAddress}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Package size={20} />
                <span>Ajouter un autre colis à cette adresse</span>
              </button>
              
              <button
                onClick={handleAddAnotherPackage}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Ajouter un nouveau colis</span>
              </button>
              
              <button
                onClick={handleFinishAdding}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {showGPSManager && (
        <div className="fixed inset-0 z-50">
          <EnhancedGPSManager onBack={() => setShowGPSManager(false)} />
        </div>
      )}

      {showSettings && (
        <SettingsPage onBack={handleCloseSettings} />
      )}


      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-3">
              <Truck size={24} className="text-green-600" />
              <div>
                <h1 className="text-lg md:text-xl font-semibold">Tableau de bord chauffeur</h1>
                <p className="text-xs md:text-sm text-gray-600">
                  Bienvenue ! Bonne journée de livraison.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <button 
                onClick={handleOpenSettings}
                className="p-2 text-gray-600 hover:text-gray-900 touch-manipulation"
                title="Paramètres"
              >
                <Settings size={20} />
              </button>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Truck size={16} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Desktop Navigation */}
        <div className="mb-8 hidden md:block">
          <nav className="flex space-x-8">
            {[
              { id: 'today', label: 'Aujourd\'hui', icon: Clock },
              { id: 'scan', label: 'Scanner', icon: Camera },
              { id: 'gps', label: 'GPS', icon: Navigation },
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

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <nav className="flex justify-around">
          {[
            { id: 'today', label: 'Aujourd\'hui', icon: Clock },
            { id: 'scan', label: 'Scanner', icon: Camera },
            { id: 'gps', label: 'GPS', icon: Navigation },
            { id: 'history', label: 'Historique', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1 touch-manipulation ${
                activeTab === tab.id
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              <tab.icon size={20} className="mb-1" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};