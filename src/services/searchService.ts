import { Package, DeliveryPoint, Address } from '../types';

export interface SearchResult {
  id: string;
  type: 'package' | 'address' | 'location';
  title: string;
  subtitle: string;
  data: Package | Address | string;
  matchedFields: string[];
}

export class SearchService {
  /**
   * Search through packages by barcode, address, location, or notes
   */
  static searchPackages(packages: Package[], query: string): SearchResult[] {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    packages.forEach(pkg => {
      const matchedFields: string[] = [];
      let isMatch = false;

      // Search in barcode
      if (pkg.barcode && pkg.barcode.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('code-barres');
        isMatch = true;
      }

      // Search in address
      const fullAddress = pkg.address.full_address.toLowerCase();
      if (fullAddress.includes(normalizedQuery)) {
        matchedFields.push('adresse');
        isMatch = true;
      }

      // Search in specific address fields
      if (pkg.address.street_name.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('rue');
        isMatch = true;
      }

      if (pkg.address.city.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('ville');
        isMatch = true;
      }

      if (pkg.address.postal_code.includes(normalizedQuery)) {
        matchedFields.push('code postal');
        isMatch = true;
      }

      // Search in truck location
      if (pkg.location.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('emplacement');
        isMatch = true;
      }

      // Search in notes
      if (pkg.notes && pkg.notes.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('notes');
        isMatch = true;
      }

      // Search by status in French
      const statusLabels = {
        pending: 'en attente',
        delivered: 'livré',
        failed: 'échec'
      };
      if (statusLabels[pkg.status].includes(normalizedQuery)) {
        matchedFields.push('statut');
        isMatch = true;
      }

      // Search by type in French
      if ((pkg.type === 'particulier' && 'particulier'.includes(normalizedQuery)) ||
          (pkg.type === 'entreprise' && 'entreprise'.includes(normalizedQuery))) {
        matchedFields.push('type');
        isMatch = true;
      }

      if (isMatch) {
        results.push({
          id: pkg.id,
          type: 'package',
          title: pkg.barcode || `Colis ${pkg.id.slice(-4)}`,
          subtitle: `${pkg.address.street_name}, ${pkg.address.city} • ${pkg.location}`,
          data: pkg,
          matchedFields
        });
      }
    });

    return results;
  }

  /**
   * Search for common truck locations
   */
  static searchTruckLocations(query: string): SearchResult[] {
    if (!query.trim()) return [];

    const commonLocations = [
      'Cul Camion',
      'Étagère G Bas',
      'Étagère G Haut',
      'Étagère D Bas',
      'Étagère D Haut',
      'Étagère Gauche Bas',
      'Étagère Gauche Haut',
      'Étagère Droite Bas',
      'Étagère Droite Haut',
      'Avant',
      'Arrière',
      'Sol',
      'Côté Gauche',
      'Côté Droit'
    ];

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    commonLocations.forEach(location => {
      if (location.toLowerCase().includes(normalizedQuery)) {
        results.push({
          id: location.toLowerCase().replace(/\s+/g, '-'),
          type: 'location',
          title: location,
          subtitle: 'Emplacement du camion',
          data: location,
          matchedFields: ['nom']
        });
      }
    });

    return results;
  }

  /**
   * Get search suggestions based on existing packages
   */
  static getSearchSuggestions(packages: Package[], currentQuery: string = ''): string[] {
    const suggestions = new Set<string>();
    
    packages.forEach(pkg => {
      // Add cities
      if (pkg.address.city) {
        suggestions.add(pkg.address.city);
      }
      
      // Add postal codes
      if (pkg.address.postal_code) {
        suggestions.add(pkg.address.postal_code);
      }
      
      // Add locations
      if (pkg.location) {
        suggestions.add(pkg.location);
      }
      
      // Add barcodes (last 4 digits)
      if (pkg.barcode && pkg.barcode.length > 4) {
        suggestions.add(pkg.barcode.slice(-4));
      }
    });

    const suggestionArray = Array.from(suggestions);
    
    if (currentQuery.trim()) {
      const normalizedQuery = currentQuery.toLowerCase().trim();
      return suggestionArray
        .filter(s => s.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => {
          // Prioritize exact matches at the beginning
          const aStartsWith = a.toLowerCase().startsWith(normalizedQuery);
          const bStartsWith = b.toLowerCase().startsWith(normalizedQuery);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.localeCompare(b);
        })
        .slice(0, 5);
    }
    
    return suggestionArray.slice(0, 5);
  }

  /**
   * Combined search across all types
   */
  static search(packages: Package[], query: string): SearchResult[] {
    const packageResults = this.searchPackages(packages, query);
    const locationResults = this.searchTruckLocations(query);
    
    // Combine and sort by relevance
    const allResults = [...packageResults, ...locationResults];
    
    // Sort by match quality (more matched fields = higher relevance)
    return allResults.sort((a, b) => {
      // Prioritize exact matches in title
      const aExactTitle = a.title.toLowerCase() === query.toLowerCase();
      const bExactTitle = b.title.toLowerCase() === query.toLowerCase();
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;
      
      // Then by number of matched fields
      return b.matchedFields.length - a.matchedFields.length;
    });
  }

  /**
   * Quick search for common queries
   */
  static getQuickSearchQueries(): Array<{ label: string; query: string; icon: string }> {
    return [
      { label: 'Colis en attente', query: 'en attente', icon: '📦' },
      { label: 'Livraisons du jour', query: 'livré', icon: '✅' },
      { label: 'Échecs de livraison', query: 'échec', icon: '❌' },
      { label: 'Cul du camion', query: 'cul camion', icon: '🚚' },
      { label: 'Étagères gauche', query: 'étagère gauche', icon: '📚' },
      { label: 'Étagères droite', query: 'étagère droite', icon: '📚' },
      { label: 'Entreprises', query: 'entreprise', icon: '🏢' },
      { label: 'Particuliers', query: 'particulier', icon: '🏠' }
    ];
  }
}