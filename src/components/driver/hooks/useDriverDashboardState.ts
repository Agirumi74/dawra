import { useState } from 'react';
import type { Vehicle, Package } from '../../context/AppContext';

export const useDriverDashboardState = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'scan' | 'gps' | 'history'>('today');
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [todayRoute, setTodayRoute] = useState<unknown>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showGPSManager, setShowGPSManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false);
  const [lastSavedPackage, setLastSavedPackage] = useState<Package | null>(null);
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