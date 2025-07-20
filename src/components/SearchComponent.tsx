import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Package, 
  MapPin, 
  Clock,
  Truck,
  Building2,
  Home,
  AlertCircle
} from 'lucide-react';
import { SearchService, SearchResult } from '../services/searchService';
import { Package as PackageType } from '../types';

interface SearchComponentProps {
  packages: PackageType[];
  onSelectPackage?: (pkg: PackageType) => void;
  onSelectLocation?: (location: string) => void;
  className?: string;
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  packages,
  onSelectPackage,
  onSelectLocation,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = SearchService.search(packages, query);
      setResults(searchResults);
      setShowQuickSearch(false);
    } else {
      setResults([]);
      const searchSuggestions = SearchService.getSearchSuggestions(packages);
      setSuggestions(searchSuggestions);
      setShowQuickSearch(true);
    }
  }, [query, packages]);

  const handleInputFocus = () => {
    setIsExpanded(true);
    if (!query.trim()) {
      setShowQuickSearch(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on results
    if (resultsRef.current && resultsRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => {
      setIsExpanded(false);
      setShowQuickSearch(false);
    }, 150);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'package') {
      onSelectPackage?.(result.data as PackageType);
    } else if (result.type === 'location') {
      onSelectLocation?.(result.data as string);
    }
    setQuery('');
    setIsExpanded(false);
    setShowQuickSearch(false);
    inputRef.current?.blur();
  };

  const handleQuickSearchClick = (queryText: string) => {
    setQuery(queryText);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowQuickSearch(true);
    inputRef.current?.focus();
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'package') {
      const pkg = result.data as PackageType;
      if (pkg.status === 'delivered') return <Clock className="text-green-600" size={20} />;
      if (pkg.status === 'failed') return <AlertCircle className="text-red-600" size={20} />;
      return <Package className="text-blue-600" size={20} />;
    }
    return <Truck className="text-gray-600" size={20} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const quickSearchQueries = SearchService.getQuickSearchQueries();

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Chercher un colis, adresse ou emplacement..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results / Quick Search */}
      {isExpanded && (
        <div 
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {showQuickSearch && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recherches rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickSearchQueries.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearchClick(item.query)}
                    className="flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </button>
                ))}
              </div>

              {suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Suggestions</h4>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSearchClick(suggestion)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        {result.type === 'package' && (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor((result.data as PackageType).status)
                            }`}>
                              {(result.data as PackageType).status === 'pending' && 'En attente'}
                              {(result.data as PackageType).status === 'delivered' && 'Livré'}
                              {(result.data as PackageType).status === 'failed' && 'Échec'}
                            </span>
                            {(result.data as PackageType).type === 'entreprise' ? (
                              <Building2 size={14} className="text-gray-400" />
                            ) : (
                              <Home size={14} className="text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {result.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.matchedFields.map((field, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun colis ou emplacement trouvé pour "{query}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};