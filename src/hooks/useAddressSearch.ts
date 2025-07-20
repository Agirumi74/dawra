import { useState, useCallback, useRef } from 'react';
import { Address, BANSuggestion } from '../types';
import { CSVAddressService, CSVAddress } from '../services/csvAddressService';
import { BANApiService } from '../services/banApiService';
import { AddressDatabaseService } from '../services/addressDatabase';

export interface AddressSearchResult {
  type: 'local' | 'ban';
  address: Address;
  originalData: CSVAddress | BANSuggestion;
  score: number;
  isFromCache?: boolean;
}

export interface UseAddressSearchOptions {
  maxLocalResults?: number;
  maxBanResults?: number;
  enableBAN?: boolean;
  postcode?: string;
  debounceMs?: number;
  minQueryLength?: number;
}

export interface UseAddressSearchReturn {
  searchAddresses: (query: string) => Promise<AddressSearchResult[]>;
  searchCities: (postcode: string) => Promise<CSVAddress[]>;
  addAddressToLocal: (address: Address) => void;
  isLoading: boolean;
  error: string | null;
  banAvailable: boolean;
  clearError: () => void;
}

export const useAddressSearch = (options: UseAddressSearchOptions = {}): UseAddressSearchReturn => {
  const {
    maxLocalResults = 6,
    maxBanResults = 4,
    enableBAN = true,
    postcode,
    debounceMs = 300,
    minQueryLength = 2
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banAvailable, setBanAvailable] = useState(true);
  
  const debounceTimerRef = useRef<number | null>(null);
  const searchCacheRef = useRef<Map<string, AddressSearchResult[]>>(new Map());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchAddresses = useCallback(async (query: string): Promise<AddressSearchResult[]> => {
    if (query.length < minQueryLength) {
      return [];
    }

    // Vérifier le cache
    const cacheKey = `${query}_${postcode || ''}`;
    if (searchCacheRef.current.has(cacheKey)) {
      return searchCacheRef.current.get(cacheKey)!;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results: AddressSearchResult[] = [];

      // 1. Recherche locale
      const localResults = await CSVAddressService.searchAddresses(query, postcode, maxLocalResults);
      
      // Convertir les résultats locaux
      for (const csvAddr of localResults) {
        results.push({
          type: 'local',
          address: CSVAddressService.parseCSVAddress(csvAddr),
          originalData: csvAddr,
          score: 1, // Score local toujours prioritaire
          isFromCache: true
        });
      }

      // 2. Recherche BAN si activée et pas assez de résultats locaux
      if (enableBAN && banAvailable && results.length < (maxLocalResults + maxBanResults)) {
        try {
          const banResults = await BANApiService.searchAddressesWithRetry(
            query, 
            maxBanResults, 
            postcode
          );

          // Filtrer les doublons et convertir
          for (const banResult of banResults) {
            const banAddress = BANApiService.banSuggestionToAddress(banResult);
            
            // Vérifier si cette adresse n'existe pas déjà dans les résultats locaux
            const isDuplicate = results.some(result => 
              result.address.street_name.toLowerCase().trim() === banAddress.street_name.toLowerCase().trim() &&
              result.address.postal_code === banAddress.postal_code &&
              result.address.street_number === banAddress.street_number
            );

            if (!isDuplicate) {
              results.push({
                type: 'ban',
                address: banAddress,
                originalData: banResult,
                score: banResult.properties.score
              });
            }
          }
        } catch (banError) {
          console.warn('Erreur BAN API:', banError);
          setBanAvailable(false);
          // Ne pas traiter comme une erreur fatale
        }
      }

      // 3. Trier les résultats (local d'abord, puis par score)
      results.sort((a, b) => {
        if (a.type === 'local' && b.type === 'ban') return -1;
        if (a.type === 'ban' && b.type === 'local') return 1;
        return b.score - a.score;
      });

      // Mettre en cache
      searchCacheRef.current.set(cacheKey, results);
      
      // Limiter la taille du cache
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        searchCacheRef.current.delete(firstKey);
      }

      return results;

    } catch (searchError) {
      const errorMessage = searchError instanceof Error ? searchError.message : 'Erreur de recherche';
      setError(errorMessage);
      console.error('Erreur lors de la recherche d\'adresses:', searchError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enableBAN, banAvailable, maxLocalResults, maxBanResults, postcode, minQueryLength]);

  const searchCities = useCallback(async (postcodeQuery: string): Promise<CSVAddress[]> => {
    if (postcodeQuery.length < 2) {
      return [];
    }

    try {
      return await CSVAddressService.searchCitiesByPostcodeDebounced(postcodeQuery);
    } catch (cityError) {
      console.error('Erreur lors de la recherche de villes:', cityError);
      return [];
    }
  }, []);

  const addAddressToLocal = useCallback((address: Address) => {
    try {
      // Ajouter au service CSV
      CSVAddressService.addBANAddressToLocal(address);
      
      // Ajouter à la base d'adresses enrichie
      AddressDatabaseService.addOrUpdateAddress(address);
      
      // Vider le cache pour forcer une nouvelle recherche
      searchCacheRef.current.clear();
      
      console.log('Adresse ajoutée à la base locale:', address);
    } catch (addError) {
      console.error('Erreur lors de l\'ajout de l\'adresse:', addError);
      setError('Erreur lors de l\'ajout de l\'adresse à la base locale');
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query: string): Promise<AddressSearchResult[]> => {
    return new Promise((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const results = await searchAddresses(query);
        resolve(results);
      }, debounceMs);
    });
  }, [searchAddresses, debounceMs]);

  return {
    searchAddresses: debouncedSearch,
    searchCities,
    addAddressToLocal,
    isLoading,
    error,
    banAvailable,
    clearError
  };
};

export default useAddressSearch;