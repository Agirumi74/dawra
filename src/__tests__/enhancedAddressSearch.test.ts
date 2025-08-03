import { CSVAddressService, CSVAddress } from '../services/csvAddressService';

// Mock fetch pour les tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Enhanced Address Search Tests', () => {
  beforeEach(() => {
    CSVAddressService.reset();
    mockFetch.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const setupMockAddresses = (addresses: CSVAddress[]) => {
    // Set up internal addresses array for testing
    (CSVAddressService as any).addresses = addresses;
    (CSVAddressService as any).isLoaded = true;
    (CSVAddressService as any).postalCodeIndex = new Map();
    
    // Build postal code index
    for (const address of addresses) {
      const postalCode = address.code_postal;
      if (!(CSVAddressService as any).postalCodeIndex.has(postalCode)) {
        (CSVAddressService as any).postalCodeIndex.set(postalCode, []);
      }
      (CSVAddressService as any).postalCodeIndex.get(postalCode).push(address);
    }
  };

  describe('Improved relevance scoring', () => {
    test('should prioritize exact matches', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '38',
          nom_voie: 'Clos du nant',
          code_postal: '74540',
          nom_commune: 'Alby-sur-Chéran',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ALBY-SUR-CHERAN',
          nom_afnor: 'CLOS DU NANT'
        },
        {
          id: '2',
          numero: '40',
          nom_voie: 'Rue du Nant',
          code_postal: '74540',
          nom_commune: 'Alby-sur-Chéran',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ALBY-SUR-CHERAN',
          nom_afnor: 'RUE DU NANT'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('Clos du nant');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom_voie).toBe('Clos du nant'); // Exact match should be first
    });

    test('should handle partial matches intelligently', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '38',
          nom_voie: 'Clos du nant',
          code_postal: '74540',
          nom_commune: 'Alby-sur-Chéran',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ALBY-SUR-CHERAN',
          nom_afnor: 'CLOS DU NANT'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('clos nant');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom_voie).toBe('Clos du nant');
    });

    test('should handle street number in query', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '38',
          nom_voie: 'Clos du nant',
          code_postal: '74540',
          nom_commune: 'Alby-sur-Chéran',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ALBY-SUR-CHERAN',
          nom_afnor: 'CLOS DU NANT'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('38 clos nant');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].numero).toBe('38');
      expect(results[0].nom_voie).toBe('Clos du nant');
    });
  });

  describe('Abbreviation handling', () => {
    test('should recognize common street type abbreviations', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '10',
          nom_voie: 'Avenue de la République',
          code_postal: '74000',
          nom_commune: 'Annecy',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ANNECY',
          nom_afnor: 'AVENUE DE LA REPUBLIQUE'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('av republique');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom_voie).toBe('Avenue de la République');
    });

    test('should handle boulevard abbreviation', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '15',
          nom_voie: 'Boulevard Saint-Michel',
          code_postal: '75005',
          nom_commune: 'Paris',
          lon: 2.0,
          lat: 48.8,
          libelle_acheminement: 'PARIS',
          nom_afnor: 'BOULEVARD SAINT-MICHEL'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('bd saint michel');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom_voie).toBe('Boulevard Saint-Michel');
    });
  });

  describe('Fuzzy matching with Levenshtein distance', () => {
    test('should find addresses with minor spelling differences', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '12',
          nom_voie: 'Rue de la Liberté',
          code_postal: '74000',
          nom_commune: 'Annecy',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ANNECY',
          nom_afnor: 'RUE DE LA LIBERTE'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('liberte'); // Missing accent
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nom_voie).toBe('Rue de la Liberté');
    });
  });

  describe('Postal code filtering in search', () => {
    test('should filter results by postal code when provided', async () => {
      const addresses: CSVAddress[] = [
        {
          id: '1',
          numero: '10',
          nom_voie: 'Rue de la Paix',
          code_postal: '74000',
          nom_commune: 'Annecy',
          lon: 6.0,
          lat: 45.8,
          libelle_acheminement: 'ANNECY',
          nom_afnor: 'RUE DE LA PAIX'
        },
        {
          id: '2',
          numero: '20',
          nom_voie: 'Rue de la Paix',
          code_postal: '75001',
          nom_commune: 'Paris',
          lon: 2.0,
          lat: 48.8,
          libelle_acheminement: 'PARIS',
          nom_afnor: 'RUE DE LA PAIX'
        }
      ];

      setupMockAddresses(addresses);

      const results = await CSVAddressService.searchAddresses('rue paix', '74000');
      
      expect(results.length).toBe(1);
      expect(results[0].code_postal).toBe('74000');
      expect(results[0].nom_commune).toBe('Annecy');
    });
  });
});