import React, { useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Clock, 
  Camera, 
  Settings, 
  Navigation, 
  Plus,
  Info
} from 'lucide-react';
import { BarcodeScanner } from '../BarcodeScanner';
import { PackageForm } from '../PackageForm';
import { EnhancedGPSManager } from '../EnhancedGPSManager';
import { SettingsPage } from '../SettingsPage';

import { usePackages } from '../../hooks/usePackages';
import { useDriverDashboardState } from './hooks/useDriverDashboardState';
import { useDriverActions } from './hooks/useDriverActions';

import { TodayView } from './views/TodayView';
import { ScanView } from './views/ScanView';
import { GPSView } from './views/GPSView';
import { InfoView } from './views/InfoView';

interface DriverDashboardProps {
  user?: unknown; // Better than 'any'
}

export const DriverDashboard: React.FC<DriverDashboardProps> = () => {
  const state = useDriverDashboardState();
  const { packages, addPackage, getPackagesByStatus } = usePackages();
  
  const actions = useDriverActions(
    state.setActiveTab,
    state.setShowBarcodeScanner,
    state.setShowPackageForm,
    state.setShowGPSManager,
    state.setShowSettings,
    state.setShowAddAnotherDialog,
    state.setCurrentBarcode,
    state.setLastSavedPackage,
    addPackage
  );

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

  // Statistiques des colis
  const deliveredPackages = getPackagesByStatus('delivered');
  const failedPackages = getPackagesByStatus('failed');

  const renderContent = () => {
    switch (state.activeTab) {
      case 'today':
        return (
          <TodayView
            currentVehicle={state.currentVehicle}
            todayRoute={state.todayRoute}
            onScanClick={() => state.setActiveTab('scan')}
            onGPSManagerClick={() => state.setShowGPSManager(true)}
          />
        );
      case 'scan':
        return (
          <ScanView
            packages={packages}
            deliveredCount={deliveredPackages.length}
            failedCount={failedPackages.length}
            onStartScanning={actions.startScanning}
            onStartManualEntry={actions.startManualEntry}
          />
        );
      case 'gps':
        return (
          <GPSView
            packages={packages}
            deliveredCount={deliveredPackages.length}
            onLaunchGPSManager={() => state.setShowGPSManager(true)}
          />
        );
      case 'info':
        return (
          <InfoView
            currentVehicle={state.currentVehicle}
          />
        );
      default:
        return (
          <TodayView
            currentVehicle={state.currentVehicle}
            todayRoute={state.todayRoute}
            onScanClick={() => state.setActiveTab('scan')}
            onGPSManagerClick={() => state.setShowGPSManager(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Modals */}
      {state.showBarcodeScanner && (
        <BarcodeScanner
          onScan={actions.handleBarcodeScanned}
          onCancel={actions.handleCancelScanning}
          onOpenSettings={actions.handleOpenSettings}
          isActive={state.showBarcodeScanner}
        />
      )}

      {state.showPackageForm && (
        <PackageForm
          barcode={state.currentBarcode}
          onSave={actions.handlePackageSaved}
          onCancel={actions.handleCancelScanning}
          prefilledAddress={state.lastSavedPackage?.address}
        />
      )}

      {/* Add Another Package Dialog */}
      {state.showAddAnotherDialog && state.lastSavedPackage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Package size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Colis ajouté avec succès !
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Adresse: {state.lastSavedPackage.address.full_address}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={actions.handleAddToSameAddress}
                className="w-full py-4 px-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Package size={20} />
                <span>Ajouter un autre colis à cette adresse</span>
              </button>
              
              <button
                onClick={actions.handleAddAnotherPackage}
                className="w-full py-4 px-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl font-semibold hover:from-green-700 hover:to-green-800 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Plus size={20} />
                <span>Ajouter un nouveau colis</span>
              </button>
              
              <button
                onClick={actions.handleFinishAdding}
                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:scale-98 transition-all duration-200"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {state.showGPSManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <EnhancedGPSManager onBack={() => state.setShowGPSManager(false)} />
        </div>
      )}

      {state.showSettings && (
        <SettingsPage onBack={actions.handleCloseSettings} />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tournée Facile</h1>
                <p className="text-sm text-gray-600">Tableau de bord chauffeur</p>
              </div>
            </div>
            <button 
              onClick={actions.handleOpenSettings}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              title="Paramètres"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-24">
        {/* Content */}
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 safe-area-inset-bottom">
        <div className="flex justify-around max-w-md mx-auto">
          {[
            { id: 'today', label: 'Aujourd\'hui', icon: Clock },
            { id: 'scan', label: 'Scanner', icon: Camera },
            { id: 'gps', label: 'GPS', icon: Navigation },
            { id: 'info', label: 'Infos', icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => state.setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-3 px-4 min-w-0 flex-1 touch-manipulation transition-colors ${
                state.activeTab === tab.id
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon 
                size={22} 
                className={`mb-1 ${state.activeTab === tab.id ? 'stroke-2' : 'stroke-1.5'}`} 
              />
              <span className={`text-xs font-medium ${
                state.activeTab === tab.id ? 'font-semibold' : ''
              }`}>
                {tab.label}
              </span>
              {state.activeTab === tab.id && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};