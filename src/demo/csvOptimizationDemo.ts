// Simple demo to test CSV optimization without jest
import { CSVAddressService, DataFilter } from '../services/csvAddressService';

export const demoCSVOptimization = async () => {
  console.log('🧪 Démo de l\'optimisation CSV');
  console.log('==============================');

  try {
    // Test 1: Chargement normal (toutes les données)
    console.log('\n1️⃣ Test chargement complet...');
    const startTime1 = performance.now();
    await CSVAddressService.loadData();
    const endTime1 = performance.now();
    console.log(`⏱️ Temps de chargement complet: ${(endTime1 - startTime1).toFixed(2)}ms`);

    // Réinitialiser pour le test suivant
    CSVAddressService.reset();

    // Test 2: Chargement filtré par code postal
    console.log('\n2️⃣ Test chargement filtré (codes postaux 74xxx)...');
    const startTime2 = performance.now();
    const filter: DataFilter = {
      postalCodes: ['74']
    };
    const stats = await CSVAddressService.loadDataWithFilters(filter);
    const endTime2 = performance.now();
    
    console.log(`⏱️ Temps de chargement filtré: ${(endTime2 - startTime2).toFixed(2)}ms`);
    console.log(`📊 Statistiques d'optimisation:`);
    console.log(`   - Total dans fichiers: ${stats.totalAddressesInFile + stats.totalLieuxDitsInFile} entrées`);
    console.log(`   - Chargées en mémoire: ${stats.loadedAddresses + stats.loadedLieuxDits} entrées`);
    console.log(`   - Réduction: ${stats.reductionPercentage.toFixed(1)}%`);
    console.log(`   - Gain de temps estimé: ${((endTime1 - startTime1) - (endTime2 - startTime2)).toFixed(2)}ms`);

    // Test 3: Vérifier que les recherches fonctionnent toujours
    console.log('\n3️⃣ Test recherche dans les données filtrées...');
    const searchResults = await CSVAddressService.searchAddresses('rue', '74');
    console.log(`🔍 Résultats de recherche "rue" avec code postal 74: ${searchResults.length} trouvés`);
    
    if (searchResults.length > 0) {
      console.log(`   Exemple: ${searchResults[0].numero} ${searchResults[0].nom_voie}, ${searchResults[0].code_postal} ${searchResults[0].nom_commune}`);
    }

    console.log('\n✅ Démonstration terminée avec succès!');
    console.log(`🎯 L'optimisation réduit la charge de ${stats.reductionPercentage.toFixed(1)}% des données!`);

    return stats;

  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error);
    throw error;
  }
};

// Pour une utilisation dans la console du navigateur
(window as any).demoCSVOptimization = demoCSVOptimization;