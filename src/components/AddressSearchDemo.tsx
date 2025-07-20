import React, { useState } from 'react';
import { Address } from '../types';
import { AdvancedAddressSearch } from './AdvancedAddressSearch';
import { SmartAddressForm } from './SmartAddressForm';
import { MapPin, Search, Settings } from 'lucide-react';

export const AddressSearchDemo: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [demoMode, setDemoMode] = useState<'advanced' | 'smart' | 'none'>('none');

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setDemoMode('none');
  };

  const handleCancel = () => {
    setDemoMode('none');
  };

  const handlePackageComplete = (packageData: Address, duplicateCount?: number) => {
    console.log('Package completed:', packageData, 'Duplicates:', duplicateCount);
    setSelectedAddress(packageData);
    setDemoMode('none');
  };

  if (demoMode === 'advanced') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Démonstration - Recherche d'adresse avancée
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AdvancedAddressSearch
              onAddressSelect={handleAddressSelect}
              onCancel={handleCancel}
              placeholder="Rechercher une adresse (ex: 38 Clos du nant, Alby)..."
              postcode="74"
              currentUser="Testeur"
            />
          </div>
        </div>
      </div>
    );
  }

  if (demoMode === 'smart') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Démonstration - Formulaire intelligent
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SmartAddressForm
              onPackageComplete={handlePackageComplete}
              onCancel={handleCancel}
              defaultPostcode="74"
              currentUser="Testeur"
              scannedBarcode="TEST123456789"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Démonstration du système de recherche d'adresses
          </h1>
          <p className="text-gray-600">
            Test des composants de recherche d'adresses avec intégration BAN API
          </p>
        </div>

        {/* Adresse sélectionnée */}
        {selectedAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <MapPin className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold text-green-800">
                Adresse sélectionnée
              </h2>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedAddress.full_address}</p>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Numéro:</span> {selectedAddress.street_number || 'N/A'}</p>
                <p><span className="font-medium">Rue:</span> {selectedAddress.street_name}</p>
                <p><span className="font-medium">Code postal:</span> {selectedAddress.postal_code}</p>
                <p><span className="font-medium">Ville:</span> {selectedAddress.city}</p>
                <p><span className="font-medium">Pays:</span> {selectedAddress.country}</p>
                {selectedAddress.coordinates && (
                  <p><span className="font-medium">Coordonnées:</span> {selectedAddress.coordinates.lat}, {selectedAddress.coordinates.lng}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Options de test */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recherche avancée */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Search className="text-blue-600" size={24} />
              <h3 className="text-xl font-semibold">Recherche avancée</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Teste la recherche d'adresses avec intégration BAN API, recherche fuzzy, 
              et enrichissement automatique de la base locale.
            </p>
            <button
              onClick={() => setDemoMode('advanced')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Search size={20} />
              <span>Tester la recherche avancée</span>
            </button>
          </div>

          {/* Formulaire intelligent */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="text-purple-600" size={24} />
              <h3 className="text-xl font-semibold">Formulaire intelligent</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Teste le formulaire complet avec recherche d'adresse intégrée, 
              gestion de colis, et toutes les fonctionnalités avancées.
            </p>
            <button
              onClick={() => setDemoMode('smart')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Settings size={20} />
              <span>Tester le formulaire intelligent</span>
            </button>
          </div>
        </div>

        {/* Guide de test */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Guide de test</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Adresses de test disponibles (locales):</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>38 Clos du nant, 74540 Alby-sur-Chéran</code></li>
                <li><code>62 Clos du nant, 74540 Alby-sur-Chéran</code></li>
                <li><code>1 Rue de la Mairie, 74150 Rumilly</code></li>
                <li><code>Place du Marché, 74000 Annecy</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Fonctionnalités à tester:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Recherche avec quelques caractères (ex: "clos", "mairie")</li>
                <li>Recherche fuzzy (ex: "cls du nan" au lieu de "clos du nant")</li>
                <li>Recherche BAN (adresses non présentes dans le CSV local)</li>
                <li>Mode manuel pour créer de nouvelles adresses</li>
                <li>Navigation au clavier (↑/↓, Enter, Escape)</li>
                <li>Ajout automatique des adresses BAN au cache local</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Accessibilité à vérifier:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Navigation au clavier</li>
                <li>Attributs ARIA (aria-label, aria-expanded, role)</li>
                <li>Contraste des couleurs</li>
                <li>Feedback d'erreur accessible</li>
                <li>Focus management approprié</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};