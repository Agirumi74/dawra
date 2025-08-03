import { CSVAddressService, DataFilter, LoadingStats } from '../services/csvAddressService';

// Mock fetch pour les tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CSV Address Service - Optimization Tests', () => {
  beforeEach(() => {
    // Réinitialiser le service
    CSVAddressService.reset();
    mockFetch.mockClear();
  });

  afterAll(() => {
    // Nettoyer les mocks
    jest.restoreAllMocks();
  });

  const createMockCSVResponse = (addresses: Array<{numero: string; nom_voie: string; code_postal: string; nom_commune: string; code_insee?: string}>, lieux_dits: Array<Record<string, unknown>>) => {
    const addressesCSV = [
      'id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;type_position;alias;nom_ld;libelle_acheminement;nom_afnor;source_position;source_nom_voie;certification_commune;cad_parcelles',
      ...addresses.map((addr, index) => 
        `addr_${index};;${addr.numero};;${addr.nom_voie};${addr.code_postal};${addr.code_insee || '74002'};${addr.nom_commune};;;933921.82;6528390.52;6.013124;45.814976;entrée;;;${addr.nom_commune.toUpperCase()};${addr.nom_voie.toUpperCase()};commune;commune;0;`
      )
    ].join('\n');

    const lieuxDitsCSV = [
      'id;nom_lieu_dit;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;source_position;source_nom_voie',
      ...lieux_dits.map((ld, index) => 
        `ld_${index};${ld.nom_lieu_dit};${ld.code_postal};${ld.code_insee || '74293'};${ld.nom_commune};;;951700.16;6579672.95;6.269208;46.270037;bal;bal`
      )
    ].join('\n');

    return { addressesCSV, lieuxDitsCSV };
  };

  describe('Optimisation du filtrage par code postal', () => {
    test('doit charger seulement les adresses correspondant aux codes postaux sélectionnés', async () => {
      // Préparer des données de test
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue de Paris', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Avenue de Lyon', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '30', nom_voie: 'Place du Centre', code_postal: '74200', nom_commune: 'Thonon' },
        { numero: '40', nom_voie: 'Rue de Genève', code_postal: '74200', nom_commune: 'Thonon' },
        { numero: '50', nom_voie: 'Boulevard de Nice', code_postal: '75001', nom_commune: 'Paris' },
        { numero: '60', nom_voie: 'Rue de Marseille', code_postal: '13000', nom_commune: 'Marseille' }
      ];

      const mockLieuxDits = [
        { nom_lieu_dit: 'Le Bois', code_postal: '74000', nom_commune: 'Annecy' },
        { nom_lieu_dit: 'La Plage', code_postal: '74200', nom_commune: 'Thonon' },
        { nom_lieu_dit: 'Le Village', code_postal: '75001', nom_commune: 'Paris' }
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses, mockLieuxDits);

      // Mock des réponses fetch
      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => lieuxDitsCSV,
        } as Response);

      // Tester le chargement avec filtrage sur les codes postaux 74xxx
      const filter: DataFilter = {
        postalCodes: ['74']
      };

      const stats: LoadingStats = await CSVAddressService.loadDataWithFilters(filter);

      // Vérifications
      expect(stats.totalAddressesInFile).toBe(6); // Total d'adresses dans le fichier
      expect(stats.totalLieuxDitsInFile).toBe(3); // Total de lieux-dits dans le fichier
      expect(stats.loadedAddresses).toBe(4); // Seulement les adresses avec code postal 74xxx
      expect(stats.loadedLieuxDits).toBe(2); // Seulement les lieux-dits avec code postal 74xxx
      expect(stats.reductionPercentage).toBeCloseTo(33.33, 1); // (9-6)/9 * 100 = 33.33%
      expect(stats.filterCriteria).toEqual(filter);

      // Vérifier que le service indique un chargement filtré
      expect(CSVAddressService.isFilteredLoadActive()).toBe(true);
      expect(CSVAddressService.getCurrentFilter()).toEqual(filter);
    });

    test('doit charger seulement les adresses correspondant aux villes sélectionnées', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test1', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test2', code_postal: '74001', nom_commune: 'Annecy' },
        { numero: '30', nom_voie: 'Rue Test3', code_postal: '74200', nom_commune: 'Thonon' },
        { numero: '40', nom_voie: 'Rue Test4', code_postal: '75001', nom_commune: 'Paris' }
      ];

      const mockLieuxDits = [
        { nom_lieu_dit: 'Lieu 1', code_postal: '74000', nom_commune: 'Annecy' },
        { nom_lieu_dit: 'Lieu 2', code_postal: '74200', nom_commune: 'Thonon' },
        { nom_lieu_dit: 'Lieu 3', code_postal: '75001', nom_commune: 'Paris' }
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses, mockLieuxDits);

      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => lieuxDitsCSV,
        } as Response);

      // Filtrer seulement pour Annecy
      const filter: DataFilter = {
        cities: ['Annecy']
      };

      const stats: LoadingStats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.totalAddressesInFile).toBe(4);
      expect(stats.totalLieuxDitsInFile).toBe(3);
      expect(stats.loadedAddresses).toBe(2); // Seulement les adresses d'Annecy
      expect(stats.loadedLieuxDits).toBe(1); // Seulement le lieu-dit d'Annecy
      expect(stats.reductionPercentage).toBeCloseTo(57.14, 1); // (7-3)/7 * 100 = 57.14%
    });

    test('doit combiner les filtres code postal et ville', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test1', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test2', code_postal: '74200', nom_commune: 'Thonon' },
        { numero: '30', nom_voie: 'Rue Test3', code_postal: '75001', nom_commune: 'Paris' },
        { numero: '40', nom_voie: 'Rue Test4', code_postal: '13000', nom_commune: 'Marseille' }
      ];

      const { addressesCSV } = createMockCSVResponse(mockAddresses, []);

      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => 'id;nom_lieu_dit;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;source_position;source_nom_voie\\n',
        } as Response);

      // Filtrer pour code postal 74xxx OU ville Paris
      const filter: DataFilter = {
        postalCodes: ['74'],
        cities: ['Paris']
      };

      const stats: LoadingStats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(3); // Annecy + Thonon + Paris
      expect(stats.reductionPercentage).toBe(25); // (4-3)/4 * 100 = 25%
    });

    test('doit respecter la limite maxEntries', async () => {
      const mockAddresses = Array.from({ length: 10 }, (_, i) => ({
        numero: `${i + 1}0`,
        nom_voie: `Rue Test ${i + 1}`,
        code_postal: '74000',
        nom_commune: 'Annecy'
      }));

      const { addressesCSV } = createMockCSVResponse(mockAddresses, []);

      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => 'id;nom_lieu_dit;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;source_position;source_nom_voie\\n',
        } as Response);

      const filter: DataFilter = {
        postalCodes: ['74'],
        maxEntries: 5
      };

      const stats: LoadingStats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(5); // Limité à 5 entrées
      expect(stats.totalAddressesInFile).toBe(10);
    });
  });

  describe('Performance et réduction de données', () => {
    test('doit logger les métriques de performance', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test', code_postal: '74000', nom_commune: 'Annecy' }
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses, []);

      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => lieuxDitsCSV,
        } as Response);

      const filter: DataFilter = {
        postalCodes: ['74']
      };

      await CSVAddressService.loadDataWithFilters(filter);

      // Vérifier que les logs de performance sont présents
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Démarrage du chargement optimisé avec filtres:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Chargement optimisé terminé en')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 Réduction de données:')
      );

      consoleSpy.mockRestore();
    });

    test('doit permettre la réinitialisation du service', () => {
      // Simuler un état chargé
      CSVAddressService.reset();

      expect(CSVAddressService.isFilteredLoadActive()).toBe(false);
      expect(CSVAddressService.getCurrentFilter()).toBeNull();
      expect(CSVAddressService.getLoadingStats()).toBeNull();
    });
  });

  describe('Compatibilité avec le mode non-filtré', () => {
    test('doit retourner des statistiques correctes quand aucun filtre n\'est appliqué', async () => {
      const mockAddresses = [
        { numero: '10', nom_voie: 'Rue Test1', code_postal: '74000', nom_commune: 'Annecy' },
        { numero: '20', nom_voie: 'Rue Test2', code_postal: '75001', nom_commune: 'Paris' }
      ];

      const { addressesCSV, lieuxDitsCSV } = createMockCSVResponse(mockAddresses, []);

      mockFetch
        .mockResolvedValueOnce({
          text: async () => addressesCSV,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => lieuxDitsCSV,
        } as Response);

      // Chargement sans filtre
      const filter: DataFilter = {};
      const stats: LoadingStats = await CSVAddressService.loadDataWithFilters(filter);

      expect(stats.loadedAddresses).toBe(stats.totalAddressesInFile);
      expect(stats.loadedLieuxDits).toBe(stats.totalLieuxDitsInFile);
      expect(stats.reductionPercentage).toBe(0); // Aucune réduction
    });
  });
});