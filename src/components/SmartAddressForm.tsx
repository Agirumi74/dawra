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
  Home
} from 'lucide-react';
import { Address } from '../types';
import { BANService, BANSuggestion } from '../services/banService';
import { AddressDatabaseService, EnhancedAddress } from '../services/addressDatabase';

interface SmartAddressFormProps {
  onAddressComplete: (address: Address, note?: string, isGlobalNote?: boolean, photo?: string, duplicateCount?: number) => void;
  onCancel: () => void;
  defaultPostcode?: string;
  currentUser?: string;
}

export const SmartAddressForm: React.FC<SmartAddressFormProps> = ({
  onAddressComplete,
  onCancel,
  defaultPostcode = '74',
  currentUser = 'Chauffeur'
}) => {
  // États pour les champs d'adresse
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [postcode, setPostcode] = useState(defaultPostcode);
  const [city, setCity] = useState('');
  
  // États pour la recherche
  const [streetSuggestions, setStreetSuggestions] = useState<BANSuggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<BANSuggestion[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isLoadingStreet, setIsLoadingStreet] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  
  // États pour les fonctionnalités avancées
  const [note, setNote] = useState('');
  const [isGlobalNote, setIsGlobalNote] = useState(true);
  const [photo, setPhoto] = useState<string>('');
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // États pour l'adresse existante
  const [existingAddress, setExistingAddress] = useState<EnhancedAddress | null>(null);
  const [showExistingNotes, setShowExistingNotes] = useState(false);
  
  const streetInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Recherche dynamique dans le champ adresse
  useEffect(() => {
    if (streetName.length >= 2) {
      setIsLoadingStreet(true);
      BANService.searchAddressesDebounced(streetName, postcode || undefined)
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
    }
  }, [streetName, postcode]);

  // Recherche de villes par code postal
  useEffect(() => {
    if (postcode.length >= 2) {
      setIsLoadingCity(true);
      BANService.searchCitiesByPostcode(postcode)
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

  const handleStreetSuggestionSelect = (suggestion: BANSuggestion) => {
    const address = BANService.parseBANSuggestion(suggestion);
    setStreetNumber(address.street_number);
    setStreetName(address.street_name);
    setPostcode(address.postal_code);
    setCity(address.city);
    setShowStreetSuggestions(false);
  };

  const handleCitySuggestionSelect = (suggestion: BANSuggestion) => {
    const address = BANService.parseBANSuggestion(suggestion);
    setCity(address.city);
    setPostcode(address.postal_code);
    setShowCitySuggestions(false);
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
    if (!streetName || !city || !postcode) {
      alert('Veuillez remplir au minimum la rue, le code postal et la ville');
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
    const coords = await BANService.geocodeAddress(address);
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

    onAddressComplete(address, note.trim() || undefined, isGlobalNote, photo || undefined, duplicateCount);
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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Adresse de livraison</h2>
        <p className="text-sm text-gray-600">Saisissez l'adresse du colis</p>
      </div>

      {/* Champs d'adresse */}
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
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              placeholder="Rue de la Paix"
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
                    <p className="font-medium text-gray-900">{suggestion.properties.label}</p>
                    <p className="text-sm text-gray-600">
                      Score: {Math.round(suggestion.properties.score * 100)}%
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
                  .filter(s => s.properties.city.toLowerCase().includes(city.toLowerCase()))
                  .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySuggestionSelect(suggestion)}
                    className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-sm">{suggestion.properties.city}</p>
                    <p className="text-xs text-gray-600">{suggestion.properties.postcode}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adresse existante */}
      {existingAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
      {!existingAddress && streetName && city && postcode && (
        <button
          onClick={addToIndex}
          className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={16} />
          <span>Ajouter cette adresse à l'index</span>
        </button>
      )}

      {/* Options avancées */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between"
        >
          <span>Options avancées</span>
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Note */}
            <div>
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

            {/* Photo */}
            <div>
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
            <div>
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
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!streetName || !city || !postcode}
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