import React, { useState } from 'react';
import { Package, Address } from '../types';
import { DEFAULT_TRUCK_LOCATIONS } from '../constants/locations';
import { geminiOCR } from '../services/geminiOCR';
import { CameraCapture } from './CameraCapture';
import { 
  MapPin, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Package as PackageIcon,
  Truck,
  Building,
  Home,
  AlertCircle
} from 'lucide-react';

interface PackageFormProps {
  barcode?: string;
  onSave: (packageData: Omit<Package, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  barcode,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    address: '',
    location: '',
    notes: '',
    type: 'particulier' as 'particulier' | 'entreprise',
    priority: 'standard' as 'standard' | 'express_midi' | 'premier'
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  // Créer l'objet adresse depuis le texte
  const createAddressFromText = (addressText: string): Address => {
    return {
      id: Date.now().toString(),
      street_number: '',
      street_name: '',
      postal_code: '',
      city: '',
      country: 'France',
      full_address: addressText
    };
  };

  const handleAddressCapture = async (imageData: string) => {
    setIsProcessingOCR(true);
    setOcrError('');
    setShowCamera(false);

    try {
      const result = await geminiOCR.extractAddressFromImage(imageData);
      
      if (result.address === 'ERREUR_LECTURE') {
        setOcrError('Impossible de lire l\'adresse. Veuillez réessayer ou saisir manuellement.');
      } else {
        setFormData(prev => ({
          ...prev,
          address: result.address
        }));
      }
    } catch {
      setOcrError('Erreur lors de l\'analyse de l\'image');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    const location = DEFAULT_TRUCK_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: location.name
      }));
    }
  };

  const handleCustomLocationAdd = () => {
    if (customLocation.trim()) {
      setFormData(prev => ({
        ...prev,
        location: customLocation.trim()
      }));
      setCustomLocation('');
      setShowCustomLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim()) {
      alert('Veuillez saisir une adresse');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('Veuillez sélectionner un emplacement dans le camion');
      return;
    }

    const packageData: Omit<Package, 'id' | 'createdAt'> = {
      barcode,
      address: createAddressFromText(formData.address),
      location: formData.location,
      notes: formData.notes,
      type: formData.type,
      priority: formData.priority,
      status: 'pending'
    };

    onSave(packageData);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 overflow-y-auto">
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleAddressCapture}
          onCancel={() => setShowCamera(false)}
          isProcessing={isProcessingOCR}
          title="Capturer l'adresse"
          subtitle="Cadrez l'adresse sur l'étiquette du colis"
        />
      )}

      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PackageIcon size={24} className="text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold">Nouveau colis</h1>
                  {barcode && (
                    <p className="text-sm text-gray-600">Code: {barcode}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Adresse */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin size={20} className="text-blue-600" />
                <span>Adresse de livraison</span>
              </label>
              {!isProcessingOCR && (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Camera size={16} />
                  <span>Scanner</span>
                </button>
              )}
            </div>

            {isProcessingOCR && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Analyse de l'adresse...</span>
                </div>
              </div>
            )}

            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Saisissez l'adresse ou utilisez le scanner caméra"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isProcessingOCR}
            />

            {ocrError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{ocrError}</span>
              </div>
            )}
          </div>

          {/* Emplacement dans le camion */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-3">
              <Truck size={20} className="text-green-600" />
              <span>Emplacement dans le camion</span>
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {DEFAULT_TRUCK_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleLocationSelect(location.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    formData.location === location.name
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: location.color }}
                    />
                    <span className="font-medium">{location.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Emplacement personnalisé */}
            {!showCustomLocation ? (
              <button
                type="button"
                onClick={() => setShowCustomLocation(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
              >
                + Ajouter un emplacement personnalisé
              </button>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Ex: Étagère haute droite"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleCustomLocationAdd}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomLocation(false)}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Type de livraison */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 block">
              Type de livraison
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'particulier' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'particulier'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <Home size={24} className="mx-auto mb-2" />
                  <span className="font-medium">Particulier</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'entreprise' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'entreprise'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <Building size={24} className="mx-auto mb-2" />
                  <span className="font-medium">Entreprise</span>
                </div>
              </button>
            </div>
          </div>

          {/* Priorité */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 block">
              Priorité
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: e.target.value as 'standard' | 'express_midi' | 'premier'
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standard">Standard</option>
              <option value="express_midi">Express (avant midi)</option>
              <option value="premier">Premier (prioritaire)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Edit3 size={20} className="text-gray-600" />
              <span>Notes (optionnel)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ex: Code portail 1234B, Colis fragile, Sonnette en panne..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </form>

        {/* Boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={20} />
              <span>Enregistrer et continuer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};