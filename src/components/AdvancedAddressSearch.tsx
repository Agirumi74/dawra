import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Address, BANSuggestion } from '../types';
import { CSVAddressService, CSVAddress } from '../services/csvAddressService';
import { BANApiService } from '../services/banApiService';
import { AddressDatabaseService } from '../services/addressDatabase';

interface AddressSearchSuggestion {
  type: 'local' | 'ban';
  address?: Address;
  csvAddress?: CSVAddress;
  banSuggestion?: BANSuggestion;
  score?: number;
  displayName: string;
  subtitle?: string;
}

interface AdvancedAddressSearchProps {
  onAddressSelect: (address: Address) => void;
  onCancel: () => void;
  placeholder?: string;
  defaultQuery?: string;
  postcode?: string;
  maxResults?: number;
  enableManualEntry?: boolean;
  currentUser?: string;
}

export const AdvancedAddressSearch: React.FC<AdvancedAddressSearchProps> = ({
  onAddressSelect,
  onCancel,
  placeholder = "Rechercher une adresse...",
  defaultQuery = "",
  postcode,
  maxResults = 8,
  enableManualEntry = true,
  currentUser = "Utilisateur"
}) => {
  const [query, setQuery] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<AddressSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [banAvailable, setBanAvailable] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [error, setError] = useState<string>('');
  
  // États pour le mode manuel
  const [manualAddress, setManualAddress] = useState<Partial<Address>>({
    street_number: '',
    street_name: '',
    postal_code: postcode || '',
    city: '',
    country: 'France'
  });
  const [citySuggestions, setCitySuggestions] = useState<CSVAddress[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Vérifier la disponibilité de BAN au montage
  useEffect(() => {
    BANApiService.isAvailable().then(setBanAvailable);
  }, []);

  // Recherche d'adresses
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setError('');
      return;
    }

    if (manualMode) return;

    setIsLoading(true);
    setError('');
    performSearch(query);
  }, [query, postcode, manualMode]);

  // Recherche de villes pour le mode manuel
  useEffect(() => {
    if (manualMode && manualAddress.postal_code && manualAddress.postal_code.length >= 2) {
      CSVAddressService.searchCitiesByPostcodeDebounced(manualAddress.postal_code)
        .then(cities => {
          setCitySuggestions(cities);
          if (manualAddress.city && manualAddress.city.length >= 2) {
            setShowCitySuggestions(true);
          }
        });
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  }, [manualAddress.postal_code, manualAddress.city, manualMode]);

  const performSearch = async (searchQuery: string) => {
    try {
      const localLimit = Math.ceil(maxResults * 0.6); // 60% pour local
      const banLimit = maxResults - localLimit; // 40% pour BAN

      // 1. Recherche locale en premier
      const localResults = await CSVAddressService.searchAddresses(searchQuery, postcode, localLimit);
      
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
            postcode
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
  };

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

      onAddressSelect(selectedAddress);
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      setError('Erreur lors de la sélection de l\'adresse');
    }
  };

  const handleManualSubmit = () => {
    if (!manualAddress.street_name || !manualAddress.city) {
      setError('Veuillez remplir au minimum la rue et la ville');
      return;
    }

    const address: Address = {
      id: `manual_${Date.now()}`,
      street_number: manualAddress.street_number || '',
      street_name: manualAddress.street_name || '',
      postal_code: manualAddress.postal_code || '',
      city: manualAddress.city || '',
      country: manualAddress.country || 'France',
      full_address: `${manualAddress.street_number || ''} ${manualAddress.street_name}, ${manualAddress.postal_code} ${manualAddress.city}`.trim()
    };

    // Ajouter à la base locale
    CSVAddressService.addBANAddressToLocal(address);
    AddressDatabaseService.addOrUpdateAddress(address);

    onAddressSelect(address);
  };

  const handleCitySuggestionSelect = (suggestion: CSVAddress) => {
    setManualAddress({
      ...manualAddress,
      city: suggestion.nom_commune,
      postal_code: suggestion.code_postal
    });
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

  if (manualMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Plus size={20} className="text-blue-600" />
            <span>Nouvelle adresse</span>
          </h3>
          <button
            onClick={() => setManualMode(false)}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            aria-label="Retour à la recherche"
          >
            <Search size={16} />
            <span>Recherche auto</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="N°"
            value={manualAddress.street_number}
            onChange={(e) => setManualAddress({...manualAddress, street_number: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            aria-label="Numéro de rue"
          />
          <input
            type="text"
            placeholder="Rue *"
            value={manualAddress.street_name}
            onChange={(e) => setManualAddress({...manualAddress, street_name: e.target.value})}
            className="col-span-2 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
            aria-label="Nom de la rue"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Code postal"
            value={manualAddress.postal_code}
            onChange={(e) => setManualAddress({...manualAddress, postal_code: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            aria-label="Code postal"
          />
          
          <div className="relative">
            <input
              type="text"
              placeholder="Ville *"
              value={manualAddress.city}
              onChange={(e) => {
                setManualAddress({...manualAddress, city: e.target.value});
                if (e.target.value.length >= 2 && citySuggestions.length > 0) {
                  setShowCitySuggestions(true);
                }
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              required
              aria-label="Ville"
            />
            
            {showCitySuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {citySuggestions
                  .filter(s => s.nom_commune.toLowerCase().includes(manualAddress.city?.toLowerCase() || ''))
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

        <div className="flex space-x-3">
          <button
            onClick={handleManualSubmit}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            aria-label="Créer l'adresse"
          >
            <Check size={20} />
            <span>Créer l'adresse</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Annuler"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            autoFocus
            aria-label="Recherche d'adresse"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isLoading && (
              <Loader2 size={20} className="animate-spin text-blue-600" />
            )}
            {banAvailable ? (
              <Wifi size={16} className="text-green-600" title="BAN API disponible" />
            ) : (
              <WifiOff size={16} className="text-orange-600" title="BAN API indisponible" />
            )}
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            role="listbox"
            aria-label="Suggestions d'adresses"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                ref={(el) => suggestionRefs.current[index] = el}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full p-4 text-left border-b border-gray-100 last:border-b-0 flex items-start space-x-3 transition-colors ${
                  selectedIndex === index 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className="flex items-center space-x-2 mt-1">
                  <MapPin size={16} className="text-blue-600 flex-shrink-0" />
                  {suggestion.type === 'local' ? (
                    <Star size={14} className="text-yellow-500 flex-shrink-0" title="Adresse locale" />
                  ) : (
                    <Globe size={14} className="text-green-600 flex-shrink-0" title="Adresse BAN" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {suggestion.displayName}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {suggestion.subtitle}
                    </p>
                    {suggestion.type === 'ban' && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        +Auto
                      </span>
                    )}
                  </div>
                </div>
                
                <ArrowRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {enableManualEntry && (
          <button
            onClick={() => setManualMode(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            aria-label="Créer une nouvelle adresse manuellement"
          >
            <Plus size={16} />
            <span>Nouvelle adresse</span>
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Database size={12} />
            <span>Local</span>
            <span>•</span>
            <Globe size={12} />
            <span>BAN</span>
          </div>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Annuler la recherche"
          >
            Annuler
          </button>
        </div>
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-500">
          Tapez au moins 2 caractères pour rechercher
        </p>
      )}

      {query.length >= 2 && !isLoading && suggestions.length === 0 && showSuggestions && (
        <div className="text-center py-6 text-gray-500">
          <MapPin size={24} className="mx-auto mb-2 text-gray-400" />
          <p>Aucune adresse trouvée</p>
          <p className="text-sm">Essayez avec d'autres mots-clés ou créez une nouvelle adresse</p>
        </div>
      )}
    </div>
  );
};