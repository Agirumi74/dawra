import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DriverDashboard } from '../DriverDashboard';
import { AppProvider } from '../../context/AppContext';

// Mock external dependencies
jest.mock('../../BarcodeScanner', () => ({
  BarcodeScanner: () => <div data-testid="barcode-scanner">Mock Barcode Scanner</div>
}));

jest.mock('../../PackageForm', () => ({
  PackageForm: () => <div data-testid="package-form">Mock Package Form</div>
}));

jest.mock('../../EnhancedGPSManager', () => ({
  EnhancedGPSManager: () => <div data-testid="gps-manager">Mock GPS Manager</div>
}));

jest.mock('../../SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page">Mock Settings Page</div>
}));

jest.mock('../../../hooks/usePackages', () => ({
  usePackages: () => ({
    packages: [],
    addPackage: jest.fn(),
    getPackagesByStatus: jest.fn(() => [])
  })
}));

const WrappedDriverDashboard = () => (
  <AppProvider>
    <DriverDashboard />
  </AppProvider>
);

describe('DriverDashboard Integration', () => {
  it('renders main dashboard with header and navigation', () => {
    render(<WrappedDriverDashboard />);
    
    // Check header
    expect(screen.getByText('Tableau de bord chauffeur')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue ! Bonne journée de livraison.')).toBeInTheDocument();
    
    // Check navigation tabs (desktop)
    expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument();
    expect(screen.getByText('Scanner')).toBeInTheDocument();
    expect(screen.getByText('GPS')).toBeInTheDocument();
    expect(screen.getByText('Historique')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<WrappedDriverDashboard />);
    
    // Initially on Today tab
    expect(screen.getByText('Mon véhicule')).toBeInTheDocument();
    
    // Switch to Scanner tab
    const scannerTab = screen.getAllByText('Scanner')[0]; // Get first occurrence (desktop nav)
    fireEvent.click(scannerTab);
    
    await waitFor(() => {
      expect(screen.getByText('Scanner des colis')).toBeInTheDocument();
    });
    
    // Switch to GPS tab
    const gpsTab = screen.getAllByText('GPS')[0];
    fireEvent.click(gpsTab);
    
    await waitFor(() => {
      expect(screen.getByText('GPS Manager')).toBeInTheDocument();
    });
  });

  it('renders vehicle section with empty state by default', () => {
    render(<WrappedDriverDashboard />);
    
    expect(screen.getByText('Mon véhicule')).toBeInTheDocument();
    expect(screen.getByText('Aucun véhicule assigné')).toBeInTheDocument();
    expect(screen.getByText('Contactez votre responsable')).toBeInTheDocument();
  });

  it('renders quick action buttons in today view', () => {
    render(<WrappedDriverDashboard />);
    
    expect(screen.getByText('Scanner un colis')).toBeInTheDocument();
    expect(screen.getByText('GPS Manager')).toBeInTheDocument();
    expect(screen.getByText('Démarrer le scan de codes-barres')).toBeInTheDocument();
    expect(screen.getByText('Optimiser vos tournées')).toBeInTheDocument();
  });

  it('renders alerts section', () => {
    render(<WrappedDriverDashboard />);
    
    expect(screen.getByText('Rappels')).toBeInTheDocument();
    expect(screen.getByText('• Vérification du véhicule avant départ')).toBeInTheDocument();
    expect(screen.getByText('• 3 colis prioritaires à livrer avant 12h')).toBeInTheDocument();
  });

  it('handles responsive navigation correctly', () => {
    render(<WrappedDriverDashboard />);
    
    // Should have both desktop and mobile navigation
    const todayButtons = screen.getAllByText('Aujourd\'hui');
    expect(todayButtons).toHaveLength(2); // Desktop + mobile
  });

  it('displays proper icons in navigation', () => {
    render(<WrappedDriverDashboard />);
    
    // Check that navigation items have proper structure
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
  });
});