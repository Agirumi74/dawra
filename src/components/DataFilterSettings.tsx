import React, { useState, useCallback } from 'react';
import { 
  Settings, 
  Database, 
  Filter, 
  BarChart3, 
  Clock, 
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CSVAddressService, DataFilter, LoadingStats } from '../services/csvAddressService';

interface DataFilterSettingsProps {
  onFilterApplied?: (stats: LoadingStats) => void;
  className?: string;
}

export const DataFilterSettings: React.FC<DataFilterSettingsProps> = ({
  onFilterApplied,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<DataFilter>({
    postalCodes: [],
    cities: [],
    maxEntries: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState<LoadingStats | null>(null);
  const [error, setError] = useState<string>('');
  
  // États pour les inputs
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [maxEntriesInput, setMaxEntriesInput] = useState('');

  const handleAddPostalCode = useCallback(() => {
    if (postalCodeInput.trim() && !filter.postalCodes?.includes(postalCodeInput.trim())) {
      setFilter(prev => ({
        ...prev,
        postalCodes: [...(prev.postalCodes || []), postalCodeInput.trim()]
      }));
      setPostalCodeInput('');
    }
  }, [postalCodeInput, filter.postalCodes]);

  const handleAddCity = useCallback(() => {
    if (cityInput.trim() && !filter.cities?.includes(cityInput.trim())) {
      setFilter(prev => ({
        ...prev,
        cities: [...(prev.cities || []), cityInput.trim()]
      }));
      setCityInput('');
    }
  }, [cityInput, filter.cities]);

  const handleRemovePostalCode = useCallback((code: string) => {
    setFilter(prev => ({
      ...prev,
      postalCodes: prev.postalCodes?.filter(pc => pc !== code) || []
    }));
  }, []);

  const handleRemoveCity = useCallback((city: string) => {
    setFilter(prev => ({
      ...prev,
      cities: prev.cities?.filter(c => c !== city) || []
    }));
  }, []);

  const handleMaxEntriesChange = useCallback((value: string) => {
    setMaxEntriesInput(value);
    const num = parseInt(value);
    setFilter(prev => ({
      ...prev,
      maxEntries: isNaN(num) ? undefined : num
    }));
  }, []);

  const applyFilter = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🎯 Application du filtre:', filter);
      const startTime = performance.now();
      
      const stats = await CSVAddressService.loadDataWithFilters(filter);
      
      const endTime = performance.now();
      console.log(`⏱️ Temps de chargement optimisé: ${(endTime - startTime).toFixed(2)}ms`);
      
      setLoadingStats(stats);
      onFilterApplied?.(stats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'application du filtre');
      console.error('❌ Erreur lors du filtrage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, onFilterApplied]);

  const resetFilter = useCallback(() => {
    setFilter({
      postalCodes: [],
      cities: [],
      maxEntries: undefined
    });
    setPostalCodeInput('');
    setCityInput('');
    setMaxEntriesInput('');
    setLoadingStats(null);
    setError('');
    CSVAddressService.reset();
  }, []);

  const currentStats = loadingStats || CSVAddressService.getLoadingStats();
  const isFilterActive = CSVAddressService.isFilteredLoadActive();

  return (
    <div className={`relative ${className}`}>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
          isFilterActive 
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtrage des données
        {isFilterActive && (
          <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
        )}
      </button>

      {/* Panel de configuration */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Optimisation des données CSV
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Configuration des filtres */}
            <div className="space-y-4">
              {/* Codes postaux */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codes postaux
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={postalCodeInput}
                    onChange={(e) => setPostalCodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPostalCode()}
                    placeholder="Ex: 74, 75001"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={handleAddPostalCode}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filter.postalCodes?.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {code}
                      <button
                        onClick={() => handleRemovePostalCode(code)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Villes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Villes
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
                    placeholder="Ex: Annecy, Paris"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={handleAddCity}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filter.cities?.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                    >
                      {city}
                      <button
                        onClick={() => handleRemoveCity(city)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Limite d'entrées */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite d'entrées (optionnel)
                </label>
                <input
                  type="number"
                  value={maxEntriesInput}
                  onChange={(e) => handleMaxEntriesChange(e.target.value)}
                  placeholder="Ex: 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Statistiques actuelles */}
              {currentStats && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Statistiques d'optimisation
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Total fichier: {currentStats.totalAddressesInFile + currentStats.totalLieuxDitsInFile} entrées</div>
                    <div>Chargées: {currentStats.loadedAddresses + currentStats.loadedLieuxDits} entrées</div>
                    <div className="font-semibold">
                      Réduction: {currentStats.reductionPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={applyFilter}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Appliquer
                </button>
                <button
                  onClick={resetFilter}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFilterSettings;