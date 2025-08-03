import React, { useState } from 'react';
import { Package, Address } from '../types';
import { usePersonalSettings } from '../hooks/usePersonalSettings';
import { unifiedOCR } from '../services/unifiedOCR';
import { CameraCapture } from './CameraCapture';
import { MultiFieldAddressForm } from './MultiFieldAddressForm';
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
  AlertCircle,
  Image,
  Trash2
} from 'lucide-react';

interface PackageFormProps {
  barcode?: string;
  onSave: (packageData: Omit<Package, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  prefilledAddress?: Partial<Address>;  // For adding multiple packages to same address
}

export const PackageForm: React.FC<PackageFormProps> = ({
  barcode,
  onSave,
  onCancel,
  prefilledAddress
}) => {
  const { personalSettings, addTruckLocation } = usePersonalSettings();
  
  const [formData, setFormData] = useState({
    location: personalSettings.defaultLocation || '',
    notes: '',
    type: 'particulier' as 'particulier' | 'entreprise',
    priority: 'standard' as 'standard' | 'express_midi' | 'premier',
    isPickup: false,
    pickupMaxTime: ''
  });
  
  // État pour l'adresse composée de champs séparés
  const [address, setAddress] = useState<Partial<Address>>(prefilledAddress || {
    street_number: '',
    street_name: '',
    postal_code: '74',
    city: '',
    country: 'France'
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [showPackageCamera, setShowPackageCamera] = useState(false); // For package photos
  const [packagePhoto, setPackagePhoto] = useState<string | undefined>(undefined);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  // Créer l'objet adresse complet depuis l'adresse partielle
  const createCompleteAddress = (partialAddress: Partial<Address>): Address => {
    const fullAddress = `${partialAddress.street_number || ''} ${partialAddress.street_name || ''}, ${partialAddress.postal_code || ''} ${partialAddress.city || ''}`.trim();
    
    return {
      id: Date.now().toString(),
      street_number: partialAddress.street_number || '',
      street_name: partialAddress.street_name || '',
      postal_code: partialAddress.postal_code || '',
      city: partialAddress.city || '',
      country: partialAddress.country || 'France',
      full_address: fullAddress,
      coordinates: partialAddress.coordinates
    };
  };

  const handlePackagePhotoCapture = (imageData: string) => {
    setPackagePhoto(imageData);
    setShowPackageCamera(false);
  };

  const removePackagePhoto = () => {
    setPackagePhoto(undefined);
  };

  const handleAddressCapture = async (imageData: string) => {
    setIsProcessingOCR(true);
    setOcrError('');
    setShowCamera(false);

    try {
      const result = await unifiedOCR.extractAddressFromImage(imageData);
      
      if (!result.success || !result.address) {
        const methodInfo = result.method ? ` (${result.method === 'basic' ? 'OCR basique' : result.method === 'gemini' ? 'Gemini AI' : 'aucune méthode'})` : '';
        setOcrError((result.error || 'Impossible de lire l\'adresse. Veuillez réessayer ou saisir manuellement.') + methodInfo);
      } else {
        // Parser l'adresse OCR pour remplir les champs séparés
        // Pour l'instant, on met tout dans le champ full_address et on laisse l'utilisateur ajuster
        setAddress(prev => ({
          ...prev,
          full_address: result.address,
          street_name: result.address // Temporaire, l'utilisateur peut ajuster
        }));
        
        // Show confidence and method info
        const methodInfo = result.method === 'basic' ? 'OCR basique' : result.method === 'gemini' ? 'Gemini AI' : 'Détection automatique';
        
        if (result.confidence < 0.7) {
          setOcrError(`Adresse détectée par ${methodInfo} avec confiance ${(result.confidence * 100).toFixed(0)}%. Veuillez vérifier.`);
        } else {
          // Show success message with method used
          setOcrError(`Adresse détectée par ${methodInfo}. Vérifiez et ajustez si nécessaire.`);
        }
      }
    } catch (error) {
      setOcrError('Erreur lors de l\'analyse de l\'image. Veuillez réessayer.');
      console.error('Erreur OCR:', error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    const location = personalSettings.truckLocations.find(loc => loc.id === locationId);
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: location.name
      }));
    }
  };

  const handleCustomLocationAdd = () => {
    if (customLocation.trim()) {
      // Add to personal settings
      addTruckLocation(customLocation.trim(), '#3b82f6'); // Default blue color
      
      // Set as current location
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
    
    // Validation améliorée des champs d'adresse
    const validationErrors: string[] = [];
    
    if (!address.street_name?.trim()) {
      validationErrors.push('Le nom de rue est obligatoire');
    }
    
    if (!address.city?.trim()) {
      validationErrors.push('La ville est obligatoire');
    }
    
    if (!address.postal_code?.trim()) {
      validationErrors.push('Le code postal est obligatoire');
    } else if (!/^\d{5}$/.test(address.postal_code.trim())) {
      validationErrors.push('Le code postal doit contenir 5 chiffres');
    }
    
    if (!formData.location.trim()) {
      validationErrors.push('Veuillez sélectionner un emplacement dans le camion');
    }
    
    // Validation spécifique pour les enlèvements
    if (formData.isPickup && !formData.pickupMaxTime) {
      validationErrors.push('L\'heure limite d\'enlèvement est obligatoire');
    }
    
    if (validationErrors.length > 0) {
      setOcrError('Erreurs de validation:\n• ' + validationErrors.join('\n• '));
      return;
    }

    try {
      const packageData: Omit<Package, 'id' | 'createdAt'> = {
        barcode,
        address: createCompleteAddress(address),
        location: formData.location,
        notes: formData.notes,
        type: formData.type,
        priority: formData.priority,
        status: 'pending',
        photo: packagePhoto,
        isPickup: formData.isPickup,
        pickupMaxTime: formData.isPickup ? formData.pickupMaxTime : undefined
      };

      // Vérification finale de l'adresse complète
      const completeAddress = packageData.address;
      if (!completeAddress.full_address || completeAddress.full_address.trim().length < 10) {
        setOcrError('L\'adresse semble incomplète. Veuillez vérifier tous les champs.');
        return;
      }

      onSave(packageData);
    } catch (error) {
      console.error('Erreur lors de la création du colis:', error);
      setOcrError('Erreur lors de la création du colis. Veuillez réessayer.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 overflow-y-auto">
      {/* Camera Modal for package photo */}
      {showPackageCamera && (
        <CameraCapture
          onCapture={handlePackagePhotoCapture}
          onCancel={() => setShowPackageCamera(false)}
          onOpenSettings={() => {
            setShowPackageCamera(false);
            if (typeof window !== 'undefined') {
              window.alert('Ouvrez les paramètres depuis le menu principal pour configurer la caméra');
            }
          }}
          isProcessing={false}
          title="Photo du colis"
          subtitle="Prenez une photo du colis pour le documenter"
        />
      )}

      {/* Camera Modal for address OCR */}
      {showCamera && (
        <CameraCapture
          onCapture={handleAddressCapture}
          onCancel={() => setShowCamera(false)}
          onOpenSettings={() => {
            setShowCamera(false);
            // The onOpenSettings would need to be passed from parent
            // For now, we'll handle it in a simpler way
            if (typeof window !== 'undefined') {
              window.alert('Ouvrez les paramètres depuis le menu principal pour configurer Gemini API');
            }
          }}
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

            <MultiFieldAddressForm
              onAddressChange={setAddress}
              initialAddress={address}
              placeholder="Ex: Clos du nant, nant, 38 nant..."
              defaultPostcode="74"
            />

            {/* Aide contextuelle pour l'adresse */}
            {(!address.street_name || !address.city || !address.postal_code) && !isProcessingOCR && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Adresse incomplète</p>
                    <p>
                      Assurez-vous de remplir tous les champs obligatoires. 
                      Si l'adresse n'existe pas dans nos bases de données, vous pouvez la créer manuellement 
                      en remplissant tous les champs puis en utilisant le bouton "Créer l'adresse".
                    </p>
                  </div>
                </div>
              </div>
            )}

            {ocrError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center space-x-2">
                <AlertCircle size={16} />
                <span className="whitespace-pre-line">{ocrError}</span>
              </div>
            )}

            {/* OCR Status Information */}
            <div className="mt-2 text-xs text-gray-500">
              {(() => {
                const status = unifiedOCR.getStatusMessage();
                return `État OCR: ${status}`;
              })()}
            </div>
          </div>

          {/* Emplacement dans le camion */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-3">
              <Truck size={20} className="text-green-600" />
              <span>Emplacement dans le camion</span>
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {personalSettings.truckLocations.map((location) => (
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

          {/* Type de service - Livraison ou Enlèvement */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 block">
              Type de service
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="serviceType"
                  checked={!formData.isPickup}
                  onChange={() => setFormData(prev => ({ ...prev, isPickup: false, pickupMaxTime: '' }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">Livraison</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="serviceType"
                  checked={formData.isPickup}
                  onChange={() => setFormData(prev => ({ ...prev, isPickup: true }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">Enlèvement</span>
              </label>
            </div>
            
            {/* Heure limite pour enlèvement */}
            {formData.isPickup && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure limite d'enlèvement
                </label>
                <input
                  type="time"
                  value={formData.pickupMaxTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupMaxTime: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Priorité avec boutons radio stylisés */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 block">
              Priorité
            </label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.priority === 'standard' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="standard"
                  checked={formData.priority === 'standard'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'standard' | 'express_midi' | 'premier' }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Standard</div>
                  <div className="text-sm text-gray-600">Livraison normale</div>
                </div>
              </label>
              
              <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.priority === 'express_midi' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="express_midi"
                  checked={formData.priority === 'express_midi'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'standard' | 'express_midi' | 'premier' }))}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Express (avant midi)</div>
                  <div className="text-sm text-gray-600">Livraison prioritaire matin</div>
                </div>
              </label>
              
              <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.priority === 'premier' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="premier"
                  checked={formData.priority === 'premier'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'standard' | 'express_midi' | 'premier' }))}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Premier (prioritaire)</div>
                  <div className="text-sm text-gray-600">Livraison ultra-prioritaire</div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Edit3 size={20} className="text-gray-600" />
              <span>Notes (optionnel)</span>
              {formData.notes && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, notes: '' }))}
                  className="ml-auto text-gray-400 hover:text-red-600 transition-colors"
                  title="Effacer les notes"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ex: Code portail 1234B, Colis fragile, Sonnette en panne..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Photo du colis */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Image size={20} className="text-green-600" />
              <span>Photo du colis (optionnel)</span>
            </label>
            
            {!packagePhoto ? (
              <button
                type="button"
                onClick={() => setShowPackageCamera(true)}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center space-y-2 text-gray-600"
              >
                <Camera size={32} />
                <span className="font-medium">Prendre une photo du colis</span>
                <span className="text-sm text-gray-500">Utile pour documenter l'état du colis</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={packagePhoto}
                    alt="Photo du colis"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removePackagePhoto}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPackageCamera(true)}
                  className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera size={16} />
                  <span>Reprendre la photo</span>
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
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