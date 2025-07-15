import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Check, X } from 'lucide-react';
import { Address, AddressSuggestion } from '../types';
import { AddressService } from '../services/addressService';

interface AddressFormProps {
  initialAddress?: Address;
  onAddressSelect: (address: Address) => void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialAddress,
  onAddressSelect,
  onCancel
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualMode, setManualMode] = useState(true); // Mode manuel par défaut
  const [manualAddress, setManualAddress] = useState<Partial<Address>>({
    street_number: '',
    street_name: '',
    postal_code: '',
    city: '',
    country: 'France'
  });
  const [showAddToIndex, setShowAddToIndex] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(() => {
    try {
      const data = localStorage.getItem('saved-addresses');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAddress) {
      setQuery(AddressService.formatAddress(initialAddress));
      setManualAddress(initialAddress);
    }
  }, [initialAddress]);

  useEffect(() => {
    if (query.length >= 3 && !manualMode) {
      setIsLoading(true);
      AddressService.searchAddressesDebounced(query)
        .then(results => {
          setSuggestions(results);
          setShowSuggestions(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, manualMode]);

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const address = AddressService.parseAddress(suggestion);
    setQuery(AddressService.formatAddress(address));
    setShowSuggestions(false);
    onAddressSelect(address);
  };

  const handleManualSubmit = () => {
    if (!manualAddress.street_name || !manualAddress.city) {
      alert('Veuillez remplir au minimum la rue et la ville');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      street_number: manualAddress.street_number || '',
      street_name: manualAddress.street_name || '',
      postal_code: manualAddress.postal_code || '',
      city: manualAddress.city || '',
      country: manualAddress.country || 'France',
      full_address: AddressService.formatAddress(manualAddress as Address)
    };

    // Enregistrer l'adresse dans l'historique local
    const updated = [address, ...savedAddresses].slice(0, 20);
    setSavedAddresses(updated);
    localStorage.setItem('saved-addresses', JSON.stringify(updated));

    onAddressSelect(address);
  };

  if (manualMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saisie manuelle</h3>
          <button
            onClick={() => setManualMode(false)}
            className="text-blue-600 hover:text-blue-700"
          >
            Recherche automatique
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="N°"
            value={manualAddress.street_number}
            onChange={(e) => setManualAddress({...manualAddress, street_number: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <div className="col-span-2 relative">
            <input
              type="text"
              placeholder="Rue *"
              value={manualAddress.street_name}
              onChange={async (e) => {
                const value = e.target.value;
                setManualAddress({...manualAddress, street_name: value});
                if (value.length >= 3) {
                  setIsLoading(true);
                  const results = await AddressService.searchAddressesDebounced(value);
                  setSuggestions(results);
                  setShowSuggestions(true);
                  setIsLoading(false);
                } else {
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setIsLoading(false);
                }
              }}
              className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none w-full"
              required
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => {
                    const address = AddressService.parseAddress(suggestion);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setManualAddress({
                            ...manualAddress,
                            street_name: address.street_name,
                            postal_code: address.postal_code,
                            city: address.city
                          });
                          setShowSuggestions(false);
                        }}
                        className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
                      >
                        <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{address.street_name}</p>
                          <p className="text-sm text-gray-600">{address.postal_code} {address.city}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  !isLoading && (
                    <>
                      {/* Suggestions similaires (matching partiel) */}
                      {manualAddress.street_name && manualAddress.street_name.length >= 3 ? (
                        (() => {
                          const allAddresses = [...suggestions];
                          const fuzzyMatches = allAddresses.filter(s =>
                            s.display_name &&
                            manualAddress.street_name &&
                            s.display_name.toLowerCase().includes(manualAddress.street_name.toLowerCase())
                          );
                          return fuzzyMatches.length > 0 ? (
                            <>
                              <div className="p-2 text-xs text-gray-400">Suggestions similaires :</div>
                              {fuzzyMatches.map((s, i) => {
                                const a = AddressService.parseAddress(s);
                                return (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      setManualAddress({
                                        ...manualAddress,
                                        street_name: a.street_name,
                                        postal_code: a.postal_code,
                                        city: a.city
                                      });
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
                                  >
                                    <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-gray-900">{a.street_name}</p>
                                      <p className="text-sm text-gray-600">{a.postal_code} {a.city}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          ) : null;
                        })()
                      ) : null}
                      <div className="p-4 text-center text-gray-500">Adresse introuvable</div>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Code postal"
            value={manualAddress.postal_code}
            onChange={(e) => setManualAddress({...manualAddress, postal_code: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Ville *"
            value={manualAddress.city}
            onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleManualSubmit}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check size={20} />
            <span>Valider l'adresse</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {showAddToIndex && (
          <div className="mt-2">
            <button
              onClick={() => {
                const address: Address = {
                  id: Date.now().toString(),
                  street_number: manualAddress.street_number || '',
                  street_name: manualAddress.street_name || '',
                  postal_code: manualAddress.postal_code || '',
                  city: manualAddress.city || '',
                  country: manualAddress.country || 'France',
                  full_address: AddressService.formatAddress(manualAddress as Address)
                };
                const updated = [address, ...savedAddresses].slice(0, 20);
                setSavedAddresses(updated);
                localStorage.setItem('saved-addresses', JSON.stringify(updated));
                setShowAddToIndex(false);
                alert('Adresse ajoutée à l’index !');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Ajouter cette adresse à l’index
            </button>
          </div>
        )}

        {/* Affichage de l'index ailleurs dans l'app, à prévoir */}
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
            placeholder="Tapez une adresse (ex: 123 rue de la Paix Paris)"
            className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
              >
                <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{suggestion.display_name}</p>
                  {suggestion.address.postcode && (
                    <p className="text-sm text-gray-600">{suggestion.address.postcode}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setManualMode(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Saisie manuelle
        </button>
        
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>

      {query.length > 0 && query.length < 3 && (
        <p className="text-sm text-gray-500">Tapez au moins 3 caractères pour rechercher</p>
      )}
    </div>
  );
};