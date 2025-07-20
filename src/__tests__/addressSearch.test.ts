import { BANApiService } from '../services/banApiService';
import { CSVAddressService } from '../services/csvAddressService';
import { useFuzzySearch } from '../hooks/useFuzzySearch';
import { useAddressSearch } from '../hooks/useAddressSearch';

// Mock des services pour les tests
jest.mock('../services/banApiService');
jest.mock('../services/csvAddressService');

describe('BAN API Service', () => {
  const mockBanResponse = {
    features: [
      {
        properties: {
          label: '38 Clos du nant, 74540 Alby-sur-Chéran',
          score: 0.95,
          housenumber: '38',
          street: 'Clos du nant',
          postcode: '74540',
          city: 'Alby-sur-Chéran',
          context: 'Haute-Savoie',
          type: 'housenumber',
          importance: 0.8
        },
        geometry: {
          type: 'Point',
          coordinates: [6.013124, 45.814976]
        }
      }
    ]
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  test('recherche d\'adresses via BAN API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBanResponse
    });

    const results = await BANApiService.searchAddresses('38 Clos du nant', 5);
    
    expect(results).toHaveLength(1);
    expect(results[0].properties.label).toBe('38 Clos du nant, 74540 Alby-sur-Chéran');
    expect(results[0].properties.score).toBe(0.95);
  });

  test('gestion des erreurs API BAN', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const results = await BANApiService.searchAddresses('adresse inexistante');
    
    expect(results).toHaveLength(0);
  });

  test('conversion BAN suggestion vers Address', () => {
    const banSuggestion = mockBanResponse.features[0];
    const address = BANApiService.banSuggestionToAddress(banSuggestion);
    
    expect(address.street_number).toBe('38');
    expect(address.street_name).toBe('Clos du nant');
    expect(address.postal_code).toBe('74540');
    expect(address.city).toBe('Alby-sur-Chéran');
    expect(address.coordinates?.lat).toBe(45.814976);
    expect(address.coordinates?.lng).toBe(6.013124);
  });

  test('normalisation de texte', () => {
    const text = 'Château d\'Eau - N°123';
    const normalized = BANApiService.normalizeText(text);
    
    expect(normalized).toBe('chateau d eau n 123');
  });
});

describe('CSV Address Service Enhanced', () => {
  const mockCSVAddresses = [
    {
      id: '1',
      numero: '38',
      nom_voie: 'Clos du nant',
      code_postal: '74540',
      nom_commune: 'Alby-sur-Chéran',
      lon: 6.013124,
      lat: 45.814976,
      libelle_acheminement: 'ALBY-SUR-CHERAN',
      nom_afnor: 'CLOS DU NANT'
    },
    {
      id: '2',
      numero: '1',
      nom_voie: 'Rue de la Mairie',
      code_postal: '74150',
      nom_commune: 'Rumilly',
      lon: 6.145678,
      lat: 45.867890,
      libelle_acheminement: 'RUMILLY',
      nom_afnor: 'RUE DE LA MAIRIE'
    }
  ];

  beforeEach(() => {
    (CSVAddressService as any).addresses = mockCSVAddresses;
    (CSVAddressService as any).isLoaded = true;
  });

  test('recherche fuzzy avec score de pertinence', async () => {
    const results = await CSVAddressService.searchAddresses('clos nant');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].nom_voie).toBe('Clos du nant');
  });

  test('recherche avec code postal', async () => {
    const results = await CSVAddressService.searchAddresses('mairie', '74150');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code_postal).toBe('74150');
  });

  test('ajout d\'adresse BAN au local', () => {
    const address = {
      id: 'ban_test',
      street_number: '100',
      street_name: 'Rue Test',
      postal_code: '74000',
      city: 'Test City',
      country: 'France',
      full_address: '100 Rue Test, 74000 Test City',
      coordinates: { lat: 45.0, lng: 6.0 }
    };

    const csvAddress = CSVAddressService.addBANAddressToLocal(address);
    
    expect(csvAddress.numero).toBe('100');
    expect(csvAddress.nom_voie).toBe('Rue Test');
    expect(csvAddress.code_postal).toBe('74000');
  });
});

describe('Fuzzy Search Hook', () => {
  test('recherche fuzzy basique', () => {
    const { result } = renderHook(() => useFuzzySearch({
      keys: ['name'],
      threshold: 0.3
    }));

    const items = [
      { name: 'Avenue de la République' },
      { name: 'Rue de la Paix' },
      { name: 'Boulevard Saint-Michel' }
    ];

    const results = result.current.search('ave rep', items);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.name).toBe('Avenue de la République');
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  test('support des abréviations', () => {
    const { result } = renderHook(() => useFuzzySearch({
      keys: ['name'],
      abbreviations: true,
      threshold: 0.3
    }));

    const items = [
      { name: 'Avenue Victor Hugo' },
      { name: 'Rue Jean Jaurès' }
    ];

    const results = result.current.search('av victor', items);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.name).toBe('Avenue Victor Hugo');
  });

  test('ignorance des accents', () => {
    const { result } = renderHook(() => useFuzzySearch({
      keys: ['name'],
      ignoreAccents: true,
      threshold: 0.3
    }));

    const items = [
      { name: 'Château de Versailles' },
      { name: 'Hôtel de Ville' }
    ];

    const results = result.current.search('chateau', items);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.name).toBe('Château de Versailles');
  });
});

describe('Address Search Hook Integration', () => {
  test('recherche combinée local + BAN', async () => {
    const mockLocalResults = [mockCSVAddresses[0]];
    const mockBanResults = [mockBanResponse.features[0]];

    (CSVAddressService.searchAddresses as jest.Mock).mockResolvedValue(mockLocalResults);
    (BANApiService.searchAddressesWithRetry as jest.Mock).mockResolvedValue(mockBanResults);

    const { result } = renderHook(() => useAddressSearch({
      enableBAN: true,
      maxLocalResults: 3,
      maxBanResults: 3
    }));

    const results = await result.current.searchAddresses('clos nant');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.type === 'local')).toBe(true);
  });

  test('fallback local quand BAN indisponible', async () => {
    const mockLocalResults = [mockCSVAddresses[0]];

    (CSVAddressService.searchAddresses as jest.Mock).mockResolvedValue(mockLocalResults);
    (BANApiService.searchAddressesWithRetry as jest.Mock).mockRejectedValue(new Error('BAN unavailable'));

    const { result } = renderHook(() => useAddressSearch({
      enableBAN: true
    }));

    const results = await result.current.searchAddresses('clos nant');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.type === 'local')).toBe(true);
  });
});

// Helpers pour les tests React
function renderHook<T>(hook: () => T): { result: { current: T } } {
  let result: T;
  
  function TestComponent() {
    result = hook();
    return null;
  }

  // Simulation simple du rendu du hook
  result = hook();
  
  return {
    result: {
      get current() {
        return result;
      }
    }
  };
}