import { useLocalStorage } from './useLocalStorage';
import { Package } from '../types';

export function usePackages() {
  const [packages, setPackages] = useLocalStorage<Package[]>('tournee-packages', []);

  const addPackage = (packageData: Omit<Package, 'id' | 'createdAt'>) => {
    const newPackage: Package = {
      ...packageData,
      id: Date.now().toString(),
      createdAt: new Date(),
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
  };
}