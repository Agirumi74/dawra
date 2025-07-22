import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  X, 
  Plus, 
  Star,
  Globe,
  AlertCircle,
  Loader2,
  Database,
  Wifi,
  WifiOff,
  ArrowRight,
  Mic,
  MicOff
} from 'lucide-react';
import { Address, BANSuggestion } from '../types';
import { CSVAddressService, CSVAddress } from '../services/csvAddressService';
import { BANApiService } from '../services/banApiService';
import { AddressDatabaseService } from '../services/addressDatabase';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface AddressSearchSuggestion {
  type: 'local' | 'ban';
  address?: Address;
  csvAddress?: CSVAddress;
  banSuggestion?: BANSuggestion;
  score?: number;
  displayName: string;
  subtitle?: string;
}

interface MultiFieldAddressFormProps {
  onAddressChange: (address: Partial<Address>) => void;
  initialAddress?: Partial<Address>;
  placeholder?: string;
  defaultPostcode?: string;
  className?: string;
}

export const MultiFieldAddressForm: React.FC<MultiFieldAddressFormProps> = ({
  onAddressChange,
  initialAddress,
  placeholder = "Rechercher une rue...",
  defaultPostcode = '74',
  className = ""
}) => {
  // États pour les champs séparés
  const [streetNumber, setStreetNumber] = useState(initialAddress?.street_number || '');
  const [streetName, setStreetName] = useState(initialAddress?.street_name || '');
  const [postalCode, setPostalCode] = useState(initialAddress?.postal_code || defaultPostcode);
  const [city, setCity] = useState(initialAddress?.city || '');
  
  // États pour la recherche
  const [suggestions, setSuggestions] = useState<AddressSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [banAvailable, setBanAvailable] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // États pour la recherche de villes
  const [citySuggestions, setCitySuggestions] = useState<CSVAddress[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  const streetInputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Speech recognition for address input
  const {
    isListening,
    transcript,
    confidence,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition('fr-FR', false);

  // Handle speech recognition results
  useEffect(() => {
    if (transcript && confidence > 0.3) {
      // Parse the speech transcript for address components
      const parsed = parseSearchQuery(transcript);
      
      // Set the street name from speech
      if (parsed.street) {
        setStreetName(parsed.street);
      }
      
      // Set the street number if detected
      if (parsed.number) {
        setStreetNumber(parsed.number);
      }
      
      // Auto-stop listening after receiving a good result
      if (confidence > 0.7) {
        stopListening();
        resetTranscript();
      }
    }
  }, [transcript, confidence, stopListening, resetTranscript]);

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      setError('');
      startListening();
    }
  };

  // Vérifier la disponibilité de BAN au montage
  useEffect(() => {
    BANApiService.isAvailable().then(setBanAvailable);
  }, []);
  const parseSearchQuery = (query: string) => {
    const trimmed = query.trim();
    
    // Chercher un pattern numéro + rue au début
    const numberFirstMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (numberFirstMatch) {
      return {
        number: numberFirstMatch[1],
        street: numberFirstMatch[2]
      };
    }
    
    // Chercher un pattern rue + numéro à la fin
    const numberLastMatch = trimmed.match(/^(.+)\s+(\d+)$/);
    if (numberLastMatch) {
      return {
        number: numberLastMatch[2],
        street: numberLastMatch[1]
      };
    }
    
    // Pas de numéro trouvé, c'est juste le nom de rue
    return {
      number: '',
      street: trimmed
    };
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const maxResults = 8;
      const localLimit = Math.ceil(maxResults * 0.6); // 60% pour local
      const banLimit = maxResults - localLimit; // 40% pour BAN

      // 1. Recherche locale en premier
      const localResults = await CSVAddressService.searchAddresses(searchQuery, postalCode, localLimit);
      
      const localSuggestions: AddressSearchSuggestion[] = localResults.map(csvAddr => ({
        type: 'local',
        csvAddress: csvAddr,
        address: CSVAddressService.parseCSVAddress(csvAddr),
        displayName: `${csvAddr.numero} ${csvAddr.nom_voie}`.trim(),
        subtitle: `${csvAddr.code_postal} ${csvAddr.nom_commune}`,
        score: 1 // Score local toujours prioritaire
      }));

      // 2. Si pas assez de résultats locaux et BAN disponible, chercher en ligne
      let banSuggestions: AddressSearchSuggestion[] = [];
      
      if (localSuggestions.length < maxResults && banAvailable) {
        try {
          const banResults = await BANApiService.searchAddressesDebounced(
            searchQuery, 
            banLimit, 
            postalCode
          );
          
          banSuggestions = banResults
            .filter(banResult => {
              // Éviter les doublons avec les résultats locaux
              return !localSuggestions.some(local => 
                local.address?.street_name.toLowerCase() === banResult.properties.street?.toLowerCase() &&
                local.address?.postal_code === banResult.properties.postcode &&
                local.address?.street_number === banResult.properties.housenumber
              );
            })
            .map(banResult => ({
              type: 'ban',
              banSuggestion: banResult,
              address: BANApiService.banSuggestionToAddress(banResult),
              displayName: banResult.properties.label,
              subtitle: `BAN • Score: ${Math.round(banResult.properties.score * 100)}%`,
              score: banResult.properties.score
            }));
        } catch (banError) {
          console.warn('Erreur BAN API:', banError);
          setBanAvailable(false);
        }
      }

      // 3. Combiner et trier les résultats
      const allSuggestions = [...localSuggestions, ...banSuggestions]
        .sort((a, b) => {
          // Priorité aux résultats locaux, puis par score
          if (a.type === 'local' && b.type === 'ban') return -1;
          if (a.type === 'ban' && b.type === 'local') return 1;
          return (b.score || 0) - (a.score || 0);
        })
        .slice(0, maxResults);

      setSuggestions(allSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setError('Erreur lors de la recherche d\'adresses');
    } finally {
      setIsLoading(false);
    }
  }, [postalCode, banAvailable]);

  // Recherche de villes par code postal
  useEffect(() => {
    if (postalCode.length >= 2) {
      CSVAddressService.searchCitiesByPostcodeDebounced(postalCode)
        .then(cities => {
          setCitySuggestions(cities);
          if (city.length >= 2) {
            setShowCitySuggestions(true);
          }
        });
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  }, [postalCode, city]);

  // Recherche d'adresses quand on tape dans le champ rue
  useEffect(() => {
    if (streetName.length >= 2) {
      // Parser la recherche pour détecter un numéro
      const parsed = parseSearchQuery(streetName);
      
      // Si on a détecté un numéro et qu'il est différent de ce qui est dans le champ numéro
      if (parsed.number && parsed.number !== streetNumber) {
        setStreetNumber(parsed.number);
      }
      
      // Effectuer la recherche avec le nom de rue
      performSearch(parsed.street);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [streetName, performSearch]);

  // Mettre à jour l'adresse quand les champs changent
  useEffect(() => {
    const address: Partial<Address> = {
      street_number: streetNumber,
      street_name: streetName,
      postal_code: postalCode,
      city: city,
      country: 'France'
    };
    
    if (streetName && city && postalCode) {
      address.full_address = `${streetNumber} ${streetName}, ${postalCode} ${city}`.trim();
    }
    
    onAddressChange(address);
  }, [streetNumber, streetName, postalCode, city, onAddressChange]);

  const handleSuggestionSelect = async (suggestion: AddressSearchSuggestion) => {
    try {
      let selectedAddress: Address;

      if (suggestion.type === 'local') {
        selectedAddress = suggestion.address!;
      } else {
        // Adresse BAN - la convertir et l'ajouter au local
        selectedAddress = BANApiService.banSuggestionToAddress(suggestion.banSuggestion!);
        
        // Ajouter à la base locale
        CSVAddressService.addBANAddressToLocal(selectedAddress);
        AddressDatabaseService.addOrUpdateAddress(selectedAddress);
      }

      // Remplir les champs séparés
      setStreetNumber(selectedAddress.street_number);
      setStreetName(selectedAddress.street_name);
      setPostalCode(selectedAddress.postal_code);
      setCity(selectedAddress.city);
      
      // Fermer toutes les suggestions immédiatement
      setShowSuggestions(false);
      setShowCitySuggestions(false);
      setSelectedIndex(-1);
      
      // Clear any errors
      setError('');
      
      // Remove focus from street input to prevent reopening suggestions
      if (streetInputRef.current) {
        streetInputRef.current.blur();
      }
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      setError('Erreur lors de la sélection de l\'adresse');
    }
  };

  const handleCitySuggestionSelect = (suggestion: CSVAddress) => {
    setCity(suggestion.nom_commune);
    setPostalCode(suggestion.code_postal);
    setShowCitySuggestions(false);
  };

  // Navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Focus sur la suggestion sélectionnée
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Champs d'adresse séparés */}
      <div className="grid grid-cols-4 gap-3">
        {/* Numéro de rue */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">N°</label>
          <input
            type="text"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value)}
            placeholder="123"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Nom de rue - avec recherche */}
        <div className="col-span-3 relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Rue *</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={streetInputRef}
              type="text"
              value={streetName}
              onChange={(e) => setStreetName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Dictez l'adresse..." : placeholder}
              className={`w-full pl-10 pr-20 p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none ${
                isListening ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-1 rounded transition-colors ${
                    isListening 
                      ? 'text-red-600 hover:text-red-700 animate-pulse' 
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                  title={isListening ? 'Arrêter la dictée' : 'Commencer la dictée vocale'}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
              {isLoading && (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              )}
              {banAvailable ? (
                <Wifi size={14} className="text-green-600" title="BAN API disponible" />
              ) : (
                <WifiOff size={14} className="text-orange-600" title="BAN API indisponible" />
              )}
            </div>
          </div>

          {/* Suggestions de rues */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="Suggestions d'adresses"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  ref={(el) => suggestionRefs.current[index] = el}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full p-3 text-left border-b border-gray-100 last:border-b-0 flex items-start space-x-3 transition-colors ${
                    selectedIndex === index 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin size={14} className="text-blue-600 flex-shrink-0" />
                    {suggestion.type === 'local' ? (
                      <Star size={12} className="text-yellow-500 flex-shrink-0" title="Adresse locale" />
                    ) : (
                      <Globe size={12} className="text-green-600 flex-shrink-0" title="Adresse BAN" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {suggestion.displayName}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate">
                        {suggestion.subtitle}
                      </p>
                      {suggestion.type === 'ban' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          +Auto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ArrowRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code postal et ville */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Code postal *</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="74000"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Ville *</label>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              if (e.target.value.length >= 2 && citySuggestions.length > 0) {
                setShowCitySuggestions(true);
              }
            }}
            placeholder="Nom de la ville"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
          
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

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Database size={10} />
          <span>Local</span>
          <span>•</span>
          <Globe size={10} />
          <span>BAN</span>
          {speechSupported && (
            <>
              <span>•</span>
              <Mic size={10} />
              <span>Vocal</span>
            </>
          )}
        </div>
        
        <span>Tapez "38 nant" ou utilisez la dictée vocale</span>
      </div>

      {/* Speech recognition feedback */}
      {isListening && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MicOff size={16} className="text-red-600 animate-pulse" />
            <span className="text-red-800 text-sm">
              En écoute... Dictez l'adresse clairement
              {transcript && (
                <span className="block mt-1 text-red-600 font-medium">
                  "{transcript}" (confiance: {Math.round(confidence * 100)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {streetName.length > 0 && streetName.length < 2 && (
        <p className="text-sm text-gray-500">
          Tapez au moins 2 caractères pour rechercher
        </p>
      )}

      {streetName.length >= 2 && !isLoading && suggestions.length === 0 && showSuggestions && (
        <div className="text-center py-4 text-gray-500">
          <MapPin size={20} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Aucune adresse trouvée</p>
          <p className="text-xs">Essayez avec d'autres mots-clés</p>
        </div>
      )}
    </div>
  );
};