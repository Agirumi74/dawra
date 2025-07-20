import React, { useState } from 'react';
import { SearchComponent } from './SearchComponent';
import { usePackages } from '../hooks/usePackages';
import { Package as PackageType } from '../types';
import { Truck, Package, MapPin, CheckCircle, AlertCircle, X } from 'lucide-react';

export const SearchDemo: React.FC = () => {
  const { packages, initializeDemoData } = usePackages();
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    initializeDemoData();
  }, [initializeDemoData]);

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setSelectedLocation(null);
    setShowModal(true);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setSelectedPackage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
    setSelectedLocation(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} className="text-green-600" />;
      case 'failed': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Package size={16} className="text-blue-600" />;
    }
  };

  const packagesInLocation = selectedLocation 
    ? packages.filter(p => p.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Truck size={24} className="text-green-600" />
              <div>
                <h1 className="text-xl font-semibold">Démonstration Recherche - "ten es ou?"</h1>
                <p className="text-sm text-gray-600">
                  Trouvez rapidement vos colis et emplacements
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {packages.length} colis chargés
            </div>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchComponent 
            packages={packages}
            onSelectPackage={handlePackageSelect}
            onSelectLocation={handleLocationSelect}
            className="max-w-2xl mx-auto"
          />
        </div>
      </div>

      {/* Package List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Colis du jour</h2>
            <p className="text-sm text-gray-600">Cliquez sur un colis pour plus de détails</p>
          </div>
          <div className="divide-y divide-gray-200">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(pkg.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {pkg.barcode || `Colis ${pkg.id.slice(-4)}`}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {pkg.address.full_address}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-600">{pkg.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                      {pkg.status === 'pending' && 'En attente'}
                      {pkg.status === 'delivered' && 'Livré'}
                      {pkg.status === 'failed' && 'Échec'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {pkg.type === 'entreprise' ? '🏢' : '🏠'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPackage ? 'Détails du colis' : 'Emplacement sélectionné'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {selectedPackage && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code-barres</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPackage.barcode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPackage.address.full_address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emplacement dans le camion</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium text-blue-600">{selectedPackage.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedPackage.type === 'entreprise' ? '🏢 Entreprise' : '🏠 Particulier'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPackage.status)}`}>
                      {selectedPackage.status === 'pending' && 'En attente'}
                      {selectedPackage.status === 'delivered' && 'Livré'}
                      {selectedPackage.status === 'failed' && 'Échec'}
                    </span>
                  </div>
                  {selectedPackage.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPackage.notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedLocation && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emplacement</label>
                    <p className="mt-1 text-lg font-medium text-blue-600">{selectedLocation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Colis dans cet emplacement</label>
                    <p className="mt-1 text-sm text-gray-900">{packagesInLocation.length} colis</p>
                  </div>
                  {packagesInLocation.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Liste des colis:</h4>
                      {packagesInLocation.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{pkg.barcode}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(pkg.status)}`}>
                            {pkg.status === 'pending' && 'En attente'}
                            {pkg.status === 'delivered' && 'Livré'}
                            {pkg.status === 'failed' && 'Échec'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};