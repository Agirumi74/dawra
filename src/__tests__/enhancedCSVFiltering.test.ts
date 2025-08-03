import { CSVAddressService, DataFilter } from '../services/csvAddressService';

// Mock fetch pour les tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Enhanced CSV Filtering Tests', () => {
  beforeEach(() => {
    CSVAddressService.reset();
    mockFetch.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createMockCSVResponse = (addresses: any[]) => {
    const addressesCSV = [
      'id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;type_position;alias;nom_ld;libelle_acheminement;nom_afnor;source_position;source_nom_voie;certification_commune;cad_parcelles',
      ...addresses.map((addr, index) => 
        `addr_${index};;${addr.numero};;${addr.nom_voie};${addr.code_postal};${addr.code_insee || '74002'};${addr.nom_commune};;;933921.82;6528390.52;6.013124;45.814976;entrée;;;${addr.nom_commune.toUpperCase()};${addr.nom_voie.toUpperCase()};commune;commune;0;`
      )
    ].join('\n');

    const lieuxDitsCSV = [
      'id;nom_lieu_dit;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;source_position;source_nom_voie'
    ].join('\n');

    return { addressesCSV, lieuxDitsCSV };
  };

  describe('Intelligent postal code filtering', () => {
    test('should match exact postal codes', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test', code_postal: '75001', nom_commune: 'Paris' },
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses);

      mockFetch
        .mockResolvedValueOnce({ text: async () => addressesCSV } as Response)
        .mockResolvedValueOnce({ text: async () => lieuxDitsCSV } as Response);

      const filter: DataFilter = { postalCodes: ['74000'] };
      const stats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(1);
    });

    test('should match postal code prefixes intelligently', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test', code_postal: '74200', nom_commune: 'Thonon' },
        { numero: '30', nom_voie: 'Rue Test', code_postal: '75001', nom_commune: 'Paris' },
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses);

      mockFetch
        .mockResolvedValueOnce({ text: async () => addressesCSV } as Response)
        .mockResolvedValueOnce({ text: async () => lieuxDitsCSV } as Response);

      const filter: DataFilter = { postalCodes: ['74'] };
      const stats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(2); // Should match both 74000 and 74200
    });
  });

  describe('Intelligent city filtering', () => {
    test('should match exact city names', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test', code_postal: '74200', nom_commune: 'Thonon-les-Bains' },
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses);

      mockFetch
        .mockResolvedValueOnce({ text: async () => addressesCSV } as Response)
        .mockResolvedValueOnce({ text: async () => lieuxDitsCSV } as Response);

      const filter: DataFilter = { cities: ['Annecy'] };
      const stats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(1);
    });

    test('should match partial city names intelligently', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test', code_postal: '74200', nom_commune: 'Thonon-les-Bains' },
        { numero: '30', nom_voie: 'Rue Test', code_postal: '38000', nom_commune: 'Grenoble' },
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses);

      mockFetch
        .mockResolvedValueOnce({ text: async () => addressesCSV } as Response)
        .mockResolvedValueOnce({ text: async () => lieuxDitsCSV } as Response);

      const filter: DataFilter = { cities: ['Thonon'] };
      const stats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(1); // Should match Thonon-les-Bains
    });
  });

  describe('Combined filtering logic', () => {
    test('should use OR logic between postal codes and cities', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test', code_postal: '75001', nom_commune: 'Paris' },
        { numero: '30', nom_voie: 'Rue Test', code_postal: '38000', nom_commune: 'Grenoble' },
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses);

      mockFetch
        .mockResolvedValueOnce({ text: async () => addressesCSV } as Response)
        .mockResolvedValueOnce({ text: async () => lieuxDitsCSV } as Response);

      const filter: DataFilter = { 
        postalCodes: ['74000'], 
        cities: ['Paris'] 
      };
      const stats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(2); // Should match Annecy (postal) AND Paris (city), but NOT Grenoble
    });
  });
});