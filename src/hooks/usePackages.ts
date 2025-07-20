import { useLocalStorage } from './useLocalStorage';
import { Package } from '../types';

export function usePackages() {
  const [packages, setPackages] = useLocalStorage<Package[]>('tournee-packages', []);

  // Demo data for testing
  const initializeDemoData = () => {
    const demoPackages: Package[] = [
      {
        id: 'pkg-001',
        barcode: '123456789012',
        address: {
          id: 'addr-001',
          street_number: '15',
          street_name: 'Rue de la Paix',
          postal_code: '75001',
          city: 'Paris',
          country: 'France',
          full_address: '15 Rue de la Paix, 75001 Paris',
          coordinates: { lat: 48.8566, lng: 2.3522 }
        },
        location: 'Étagère Droite Haut',
        notes: 'Fragile - Attention manipulation',
        type: 'particulier',
        priority: 'standard',
        status: 'pending',
        createdAt: new Date()
      },
      {
        id: 'pkg-002',
        barcode: '987654321098',
        address: {
          id: 'addr-002',
          street_number: '42',
          street_name: 'Avenue des Champs-Élysées',
          postal_code: '75008',
          city: 'Paris',
          country: 'France',
          full_address: '42 Avenue des Champs-Élysées, 75008 Paris',
          coordinates: { lat: 48.8698, lng: 2.3076 }
        },
        location: 'Cul Camion',
        notes: 'Code portail: 1234A',
        type: 'entreprise',
        priority: 'express_midi',
        status: 'pending',
        createdAt: new Date()
      },
      {
        id: 'pkg-003',
        barcode: '456789123456',
        address: {
          id: 'addr-003',
          street_number: '8',
          street_name: 'Place Vendôme',
          postal_code: '75001',
          city: 'Paris',
          country: 'France',
          full_address: '8 Place Vendôme, 75001 Paris',
          coordinates: { lat: 48.8673, lng: 2.3291 }
        },
        location: 'Étagère Gauche Bas',
        notes: 'Livraison avant 12h00',
        type: 'entreprise',
        priority: 'premier',
        status: 'delivered',
        createdAt: new Date()
      },
      {
        id: 'pkg-004',
        barcode: '789123456789',
        address: {
          id: 'addr-004',
          street_number: '25',
          street_name: 'Rue de Rivoli',
          postal_code: '75004',
          city: 'Paris',
          country: 'France',
          full_address: '25 Rue de Rivoli, 75004 Paris',
          coordinates: { lat: 48.8566, lng: 2.3542 }
        },
        location: 'Étagère Droite Bas',
        notes: 'Sonnez 2 fois',
        type: 'particulier',
        priority: 'standard',
        status: 'failed',
        createdAt: new Date()
      },
      {
        id: 'pkg-005',
        barcode: '321654987321',
        address: {
          id: 'addr-005',
          street_number: '100',
          street_name: 'Boulevard Saint-Germain',
          postal_code: '75006',
          city: 'Paris',
          country: 'France',
          full_address: '100 Boulevard Saint-Germain, 75006 Paris',
          coordinates: { lat: 48.8543, lng: 2.3349 }
        },
        location: 'Étagère Gauche Haut',
        notes: 'Interphone défaillant',
        type: 'particulier',
        priority: 'standard',
        status: 'pending',
        createdAt: new Date()
      }
    ];
    
    if (packages.length === 0) {
      setPackages(demoPackages);
    }
  };

  const addPackage = (packageData: Omit<Package, 'id' | 'createdAt'>) => {
    const newPackage: Package = {
      ...packageData,
      id: Date.now().toString(),
      createdAt: new Date(),
      priority: packageData.priority || 'standard',
    };
    setPackages([...packages, newPackage]);
    return newPackage;
  };

  const updatePackage = (id: string, updates: Partial<Package>) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, ...updates } : pkg
    ));
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter(pkg => pkg.id !== id));
  };

  const clearAllPackages = () => {
    setPackages([]);
  };

  const getPackagesByStatus = (status: Package['status']) => {
    return packages.filter(pkg => pkg.status === status);
  };

  return {
    packages,
    addPackage,
    updatePackage,
    removePackage,
    clearAllPackages,
    getPackagesByStatus,
    initializeDemoData,
  };
}