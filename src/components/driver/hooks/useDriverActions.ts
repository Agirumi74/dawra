import { useCallback } from 'react';

export const useDriverActions = (
  setActiveTab: (tab: 'today' | 'scan' | 'gps' | 'history') => void,
  setShowBarcodeScanner: (show: boolean) => void,
  setShowPackageForm: (show: boolean) => void,
  setShowGPSManager: (show: boolean) => void,
  setShowSettings: (show: boolean) => void,
  setShowAddAnotherDialog: (show: boolean) => void,
  setCurrentBarcode: (barcode: string | undefined) => void,
  setLastSavedPackage: (pkg: any) => void,
  addPackage: (pkg: any) => void
) => {
  const handleBarcodeScanned = useCallback((barcode: string) => {
    setCurrentBarcode(barcode);
    setShowBarcodeScanner(false);
    setShowPackageForm(true);
  }, [setCurrentBarcode, setShowBarcodeScanner, setShowPackageForm]);

  const handlePackageSaved = useCallback((packageData: any) => {
    addPackage(packageData);
    setLastSavedPackage(packageData);
    setShowPackageForm(false);
    setShowAddAnotherDialog(true);
  }, [addPackage, setLastSavedPackage, setShowPackageForm, setShowAddAnotherDialog]);

  const handleCancelScanning = useCallback(() => {
    setShowBarcodeScanner(false);
    setShowPackageForm(false);
    setCurrentBarcode(undefined);
  }, [setShowBarcodeScanner, setShowPackageForm, setCurrentBarcode]);

  const handleAddToSameAddress = useCallback(() => {
    setCurrentBarcode(undefined);
    setShowAddAnotherDialog(false);
    setShowPackageForm(true);
  }, [setCurrentBarcode, setShowAddAnotherDialog, setShowPackageForm]);

  const handleAddAnotherPackage = useCallback(() => {
    setCurrentBarcode(undefined);
    setLastSavedPackage(null);
    setShowAddAnotherDialog(false);
    setShowBarcodeScanner(true);
  }, [setCurrentBarcode, setLastSavedPackage, setShowAddAnotherDialog, setShowBarcodeScanner]);

  const handleFinishAdding = useCallback(() => {
    setShowAddAnotherDialog(false);
    setLastSavedPackage(null);
  }, [setShowAddAnotherDialog, setLastSavedPackage]);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, [setShowSettings]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, [setShowSettings]);

  const startScanning = useCallback(() => {
    setShowBarcodeScanner(true);
  }, [setShowBarcodeScanner]);

  const startManualEntry = useCallback(() => {
    setCurrentBarcode(undefined);
    setShowPackageForm(true);
  }, [setCurrentBarcode, setShowPackageForm]);

  return {
    handleBarcodeScanned,
    handlePackageSaved,
    handleCancelScanning,
    handleAddToSameAddress,
    handleAddAnotherPackage,
    handleFinishAdding,
    handleOpenSettings,
    handleCloseSettings,
    startScanning,
    startManualEntry,
  };
};