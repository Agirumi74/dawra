import { useState } from 'react';

export const useDriverDashboardState = () => {
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

  return {
    activeTab,
    setActiveTab,
    currentVehicle,
    setCurrentVehicle,
    todayRoute,
    setTodayRoute,
    showBarcodeScanner,
    setShowBarcodeScanner,
    showPackageForm,
    setShowPackageForm,
    showGPSManager,
    setShowGPSManager,
    showSettings,
    setShowSettings,
    showAddAnotherDialog,
    setShowAddAnotherDialog,
    lastSavedPackage,
    setLastSavedPackage,
    currentBarcode,
    setCurrentBarcode,
  };
};