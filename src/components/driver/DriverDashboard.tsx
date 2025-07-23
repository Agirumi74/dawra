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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
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
                Adresse: {state.lastSavedPackage.address.full_address}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={actions.handleAddToSameAddress}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Package size={20} />
                <span>Ajouter un autre colis à cette adresse</span>
              </button>
              
              <button
                onClick={actions.handleAddAnotherPackage}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Ajouter un nouveau colis</span>
              </button>
              
              <button
                onClick={actions.handleFinishAdding}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
                onClick={actions.handleOpenSettings}
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
              { id: 'info', label: 'Infos', icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => state.setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  state.activeTab === tab.id
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
            { id: 'info', label: 'Infos', icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => state.setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1 touch-manipulation ${
                state.activeTab === tab.id
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