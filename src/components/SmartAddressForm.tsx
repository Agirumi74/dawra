import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Check, 
  X, 
  Plus, 
  Camera, 
  Copy,
  MessageSquare,
  Clock,
  Globe,
  User,
  Save,
  Search,
  Building2,
  Home,
  Zap,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Address, Package } from '../types';
import { CSVAddressService, CSVAddress } from '../services/csvAddressService';
import { AddressDatabaseService, EnhancedAddress } from '../services/addressDatabase';

interface SmartAddressFormProps {
  onPackageComplete: (packageData: Omit<Package, 'id' | 'createdAt'>, duplicateCount?: number) => void;
  onCancel: () => void;
  defaultPostcode?: string;
  currentUser?: string;
  scannedBarcode?: string;
}

export const SmartAddressForm: React.FC<SmartAddressFormProps> = ({
  onPackageComplete,
  onCancel,
  defaultPostcode = '74',
  currentUser = 'Chauffeur',
  scannedBarcode
}) => {
  // États pour les champs d'adresse
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [postcode, setPostcode] = useState(defaultPostcode);
  const [city, setCity] = useState('');
  
  // États pour la recherche
  const [streetSuggestions, setStreetSuggestions] = useState<CSVAddress[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CSVAddress[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isLoadingStreet, setIsLoadingStreet] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [streetQuery, setStreetQuery] = useState('');
  
  // États pour les informations du colis
  const [location, setLocation] = useState('');
  const [packageType, setPackageType] = useState<'particulier' | 'entreprise'>('particulier');
  const [priority, setPriority] = useState<'standard' | 'express_midi' | 'premier'>('standard');
  const [note, setNote] = useState('');
  const [isGlobalNote, setIsGlobalNote] = useState(true);
  const [photo, setPhoto] = useState<string>('');
  const [duplicateCount, setDuplicateCount] = useState(1);
  
  // États pour l'adresse existante
  const [existingAddress, setExistingAddress] = useState<EnhancedAddress | null>(null);
  const [showExistingNotes, setShowExistingNotes] = useState(false);
  
  const streetInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Emplacements par défaut
  const defaultLocations = [
    { id: 'front-left', name: 'Avant Gauche', color: '#ef4444' },
    { id: 'front-right', name: 'Avant Droite', color: '#f97316' },
    { id: 'middle-left', name: 'Milieu Gauche', color: '#eab308' },
    { id: 'middle-right', name: 'Milieu Droite', color: '#22c55e' },
    { id: 'back-left', name: 'Arrière Gauche', color: '#06b6d4' },
    { id: 'back-right', name: 'Arrière Droite', color: '#8b5cf6' },
    { id: 'floor', name: 'Sol', color: '#64748b' },
    { id: 'cab', name: 'Cabine', color: '#f59e0b' },
  ];

  // Recherche dynamique dans le champ adresse
  useEffect(() => {
    if (streetQuery.length >= 2) {
      setIsLoadingStreet(true);
      CSVAddressService.searchAddressesDebounced(streetQuery, postcode || undefined)
        .then(results => {
          setStreetSuggestions(results);
          setShowStreetSuggestions(true);
          setIsLoadingStreet(false);
        })
        .catch(() => {
          setIsLoadingStreet(false);
          setStreetSuggestions([]);
        });
    } else {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
      setIsLoadingStreet(false);
    }
  }, [streetQuery, postcode]);

  // Recherche de villes par code postal
  useEffect(() => {
    if (postcode.length >= 2) {
      setIsLoadingCity(true);
      CSVAddressService.searchCitiesByPostcodeDebounced(postcode)
        .then(results => {
          setCitySuggestions(results);
          if (city.length >= 2) {
            setShowCitySuggestions(true);
          }
          setIsLoadingCity(false);
        })
        .catch(() => {
          setIsLoadingCity(false);
          setCitySuggestions([]);
        });
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setIsLoadingCity(false);
    }
  }, [postcode]);

  // Vérifier si l'adresse existe déjà dans la base
  useEffect(() => {
    if (streetName && city && postcode) {
      const tempAddress: Address = {
        id: '',
        street_number: streetNumber,
        street_name: streetName,
        postal_code: postcode,
        city: city,
        country: 'France',
        full_address: `${streetNumber} ${streetName}, ${postcode} ${city}`.trim()
      };
      
      const existing = AddressDatabaseService.findAddress(tempAddress);
      setExistingAddress(existing);
    } else {
      setExistingAddress(null);
    }
  }, [streetNumber, streetName, postcode, city]);

  const handleStreetSuggestionSelect = (suggestion: CSVAddress) => {
    const address = CSVAddressService.parseCSVAddress(suggestion);
    setStreetNumber(address.street_number);
    setStreetName(address.street_name);
    setStreetQuery(address.street_name);
    setPostcode(address.postal_code);
    setCity(address.city);
    setShowStreetSuggestions(false);
    setIsLoadingStreet(false);
  };

  const handleCitySuggestionSelect = (suggestion: CSVAddress) => {
    const address = CSVAddressService.parseCSVAddress(suggestion);
    setCity(address.city);
    setPostcode(address.postal_code);
    setShowCitySuggestions(false);
    setIsLoadingCity(false);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!streetName || !city || !postcode || !location) {
      alert('Veuillez remplir tous les champs obligatoires (rue, ville, code postal, emplacement)');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      street_number: streetNumber,
      street_name: streetName,
      postal_code: postcode,
      city: city,
      country: 'France',
      full_address: `${streetNumber} ${streetName}, ${postcode} ${city}`.trim()
    };

    // Géocoder l'adresse
    const coords = await CSVAddressService.geocodeAddress(address);
    if (coords) {
      address.coordinates = coords;
    }

    // Ajouter à la base d'adresses si elle n'existe pas
    if (!existingAddress) {
      AddressDatabaseService.addOrUpdateAddress(address);
    }

    // Ajouter une note si fournie
    if (note.trim()) {
      const addressInDb = AddressDatabaseService.findAddress(address) || 
                         AddressDatabaseService.addOrUpdateAddress(address);
      AddressDatabaseService.addNoteToAddress(
        addressInDb.id,
        note.trim(),
        currentUser,
        isGlobalNote
      );
    }

    // Définir la fenêtre temporelle selon la priorité
    let timeWindow = undefined;
    if (priority === 'express_midi') {
      timeWindow = { end: '12:00' };
    }

    const packageData = {
      barcode: scannedBarcode || 'MANUAL_ENTRY',
      address,
      location,
      notes: note.trim(),
      type: packageType,
      priority,
      status: 'pending' as const,
      photo: photo || undefined,
      timeWindow
    };

    onPackageComplete(packageData, duplicateCount);
  };

  const addToIndex = () => {
    if (!streetName || !city || !postcode) {
      alert('Veuillez remplir tous les champs avant d\'ajouter à l\'index');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      street_number: streetNumber,
      street_name: streetName,
      postal_code: postcode,
      city: city,
      country: 'France',
      full_address: `${streetNumber} ${streetName}, ${postcode} ${city}`.trim()
    };

    AddressDatabaseService.addOrUpdateAddress(address);
    alert('Adresse ajoutée à l\'index !');
    setExistingAddress(AddressDatabaseService.findAddress(address));
  };

  const getPriorityIcon = (priorityType: string) => {
    switch (priorityType) {
      case 'premier':
        return <Star className="text-red-600" size={16} />;
      case 'express_midi':
        return <Zap className="text-orange-600" size={16} />;
      default:
        return <Clock className="text-blue-600" size={16} />;
    }
  };

  const getPriorityColor = (priorityType: string) => {
    switch (priorityType) {
      case 'premier':
        return 'border-red-500 bg-red-50';
      case 'express_midi':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Informations du colis</h2>
        {scannedBarcode && scannedBarcode !== 'MANUAL_ENTRY' && (
          <p className="text-sm text-gray-600">Code-barres: {scannedBarcode.substring(0, 20)}...</p>
        )}
      </div>

      {/* Champs d'adresse */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h3 className="font-semibold mb-4 flex items-center space-x-2">
          <MapPin size={18} className="text-blue-600" />
          <span>Adresse de livraison</span>
        </h3>
        
        <div className="space-y-3">
          {/* Numéro de rue */}
          <div>
            <label className="block text-sm font-medium mb-1">Numéro</label>
            <input
              type="text"
              value={streetNumber}
              onChange={(e) => setStreetNumber(e.target.value)}
              placeholder="123"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Nom de rue avec suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Rue *</label>
            <div className="relative">
              <input
                ref={streetInputRef}
                type="text"
                value={streetQuery}
                onChange={(e) => {
                  setStreetQuery(e.target.value);
                  setShowStreetSuggestions(true);
                }}
                placeholder="38 Clos du nant ou juste Clos du nant"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-10"
                required
              />
              {isLoadingStreet && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Suggestions de rues */}
            {showStreetSuggestions && streetSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {streetSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleStreetSuggestionSelect(suggestion)}
                    className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
                  >
                    <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {suggestion.numero} {suggestion.nom_voie}, {suggestion.code_postal} {suggestion.nom_commune}
                      </p>
                      <p className="text-sm text-gray-600">
                        {suggestion.libelle_acheminement}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code postal et ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Code postal *</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="74000"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Ville *</label>
              <div className="relative">
                <input
                  ref={cityInputRef}
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (e.target.value.length >= 2 && citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  placeholder="Annecy"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-10"
                  required
                />
                {isLoadingCity && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Suggestions de villes */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {citySuggestions
                    .filter(s => s.nom_commune.toLowerCase().includes(city.toLowerCase()))
                    .map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleCitySuggestionSelect(suggestion)}
                      className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-sm">{suggestion.nom_commune}</p>
                      <p className="text-xs text-gray-600">{suggestion.code_postal}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adresse existante */}
        {existingAddress && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Check size={16} className="text-green-600" />
                <span className="font-medium text-green-800">Adresse connue</span>
                {existingAddress.isVerified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Vérifiée
                  </span>
                )}
              </div>
              {existingAddress.notes.length > 0 && (
                <button
                  onClick={() => setShowExistingNotes(!showExistingNotes)}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
                >
                  <MessageSquare size={14} />
                  <span>{existingAddress.notes.length} note(s)</span>
                </button>
              )}
            </div>
            
            {showExistingNotes && existingAddress.notes.length > 0 && (
              <div className="mt-3 space-y-2">
                {existingAddress.notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="bg-white p-2 rounded border">
                    <p className="text-sm text-gray-900">{note.note}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <User size={10} />
                      <span>{note.author}</span>
                      <Clock size={10} />
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      {note.isGlobal && <Globe size={10} className="text-blue-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bouton pour ajouter à l'index si adresse inexistante */}
        {!existingAddress && streetName && city && postcode && streetNumber && (
          <button
            onClick={addToIndex}
            className="w-full mt-4 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>Ajouter cette adresse à l'index</span>
          </button>
        )}
      </div>

      {/* Informations du colis */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Informations du colis</h3>
        
        {/* Priorité de livraison */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-3">Priorité de livraison *</label>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setPriority('standard')}
              className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                priority === 'standard'
                  ? getPriorityColor('standard')
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {getPriorityIcon('standard')}
              <div className="text-left">
                <p className="font-medium">Standard</p>
                <p className="text-sm text-gray-600">Livraison normale dans la tournée</p>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setPriority('express_midi')}
              className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                priority === 'express_midi'
                  ? getPriorityColor('express_midi')
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {getPriorityIcon('express_midi')}
              <div className="text-left">
                <p className="font-medium">Express avant midi</p>
                <p className="text-sm text-gray-600">À livrer impérativement avant 12h00</p>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setPriority('premier')}
              className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                priority === 'premier'
                  ? getPriorityColor('premier')
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {getPriorityIcon('premier')}
              <div className="text-left">
                <p className="font-medium">À livrer en premier</p>
                <p className="text-sm text-gray-600">Priorité absolue - premier arrêt</p>
              </div>
            </button>
          </div>
        </div>

        {/* Emplacement dans le camion */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-3">Emplacement dans le camion *</label>
          <div className="grid grid-cols-2 gap-3">
            {defaultLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocation(loc.name)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  location === loc.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: loc.color }}
                  />
                  <span className="font-medium text-sm">{loc.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Type de livraison */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-3">Type de livraison</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPackageType('particulier')}
              className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                packageType === 'particulier'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Home size={20} className="text-blue-600" />
              <span className="font-medium">Particulier</span>
            </button>
            <button
              type="button"
              onClick={() => setPackageType('entreprise')}
              className={`p-4 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                packageType === 'entreprise'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Building2 size={20} className="text-purple-600" />
              <span className="font-medium">Entreprise</span>
            </button>
          </div>
        </div>

        {/* Note optionnelle */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Note (optionnelle)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Code portail, étage, instructions..."
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            rows={2}
          />
          {note.trim() && (
            <div className="mt-2 flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={isGlobalNote}
                  onChange={() => setIsGlobalNote(true)}
                  className="text-blue-600"
                />
                <Globe size={14} className="text-blue-600" />
                <span className="text-sm">Note permanente (visible par tous)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!isGlobalNote}
                  onChange={() => setIsGlobalNote(false)}
                  className="text-blue-600"
                />
                <Clock size={14} className="text-amber-600" />
                <span className="text-sm">Juste pour aujourd'hui</span>
              </label>
            </div>
          )}
        </div>

        {/* Photo du colis */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Photo du colis (optionnelle)</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => photoInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Camera size={16} />
              <span>Prendre une photo</span>
            </button>
            {photo && (
              <div className="flex items-center space-x-2">
                <img src={photo} alt="Colis" className="w-12 h-12 object-cover rounded" />
                <button
                  onClick={() => setPhoto('')}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
        </div>

        {/* Duplication */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Nombre de colis identiques</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDuplicateCount(Math.max(1, duplicateCount - 1))}
              className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-lg font-semibold w-8 text-center">{duplicateCount}</span>
            <button
              onClick={() => setDuplicateCount(Math.min(10, duplicateCount + 1))}
              className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
            <Copy size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {duplicateCount > 1 ? `${duplicateCount} colis identiques` : '1 colis'}
            </span>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          disabled={!streetName || !city || !postcode || !location}
          className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>
            {duplicateCount > 1 ? `Enregistrer ${duplicateCount} colis` : 'Enregistrer le colis'}
          </span>
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};