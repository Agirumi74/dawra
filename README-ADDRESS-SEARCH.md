# Système de recherche d'adresses avancé

## Vue d'ensemble

Ce système offre une expérience de recherche d'adresses sophistiquée qui combine :
- **Recherche locale** dans une base CSV française
- **Recherche en ligne** via l'API BAN (Base Adresse Nationale)
- **Recherche fuzzy** tolérante aux fautes de frappe et aux abréviations
- **Enrichissement automatique** de la base locale
- **Mode manuel** pour créer de nouvelles adresses

## Architecture

### Services

#### `BANApiService`
Service d'interaction avec l'API Base Adresse Nationale française.

**Fonctionnalités :**
- Recherche d'adresses avec filtrage par code postal
- Géocodage inverse (coordonnées → adresse)
- Gestion de la résilience (retry automatique)
- Détection de disponibilité du service
- Normalisation de texte française

```typescript
// Exemple d'utilisation
const results = await BANApiService.searchAddresses('38 Clos du nant', 5, '74540');
const address = BANApiService.banSuggestionToAddress(results[0]);
```

#### `CSVAddressService` (Enhanced)
Service de recherche dans la base locale avec scoring de pertinence amélioré.

**Améliorations :**
- Algorithme de scoring multicritère
- Support des abréviations communes françaises
- Recherche par mots-clés dans l'ordre
- Ajout automatique d'adresses BAN au cache local

```typescript
// Recherche fuzzy
const results = await CSVAddressService.searchAddresses('clos nant', '74540');

// Ajout d'adresse BAN
const csvAddr = CSVAddressService.addBANAddressToLocal(banAddress);
```

### Hooks React

#### `useAddressSearch`
Hook principal pour la recherche d'adresses combinée.

**Options :**
```typescript
interface UseAddressSearchOptions {
  maxLocalResults?: number;    // Nombre max de résultats locaux (défaut: 6)
  maxBanResults?: number;      // Nombre max de résultats BAN (défaut: 4)
  enableBAN?: boolean;         // Activer l'API BAN (défaut: true)
  postcode?: string;           // Filtrer par code postal
  debounceMs?: number;         // Délai de debounce (défaut: 300ms)
  minQueryLength?: number;     // Longueur min de requête (défaut: 2)
}
```

**Utilisation :**
```typescript
const {
  searchAddresses,
  searchCities,
  addAddressToLocal,
  isLoading,
  error,
  banAvailable,
  clearError
} = useAddressSearch({
  maxLocalResults: 8,
  enableBAN: true,
  postcode: '74'
});
```

#### `useFuzzySearch`
Hook de recherche fuzzy générique avec support des abréviations françaises.

**Fonctionnalités :**
- Distance de Levenshtein
- Correspondance partielle et exacte
- Support des abréviations courantes (av → avenue, r → rue, etc.)
- Ignorance des accents et de la casse
- Respect optionnel de l'ordre des mots

```typescript
const { search, isSearching } = useFuzzySearch({
  keys: ['street_name', 'city'],
  threshold: 0.3,
  abbreviations: true,
  ignoreAccents: true
});
```

### Composants

#### `AdvancedAddressSearch`
Composant principal de recherche d'adresses avec interface complète.

**Props :**
```typescript
interface AdvancedAddressSearchProps {
  onAddressSelect: (address: Address) => void;
  onCancel: () => void;
  placeholder?: string;
  defaultQuery?: string;
  postcode?: string;
  maxResults?: number;
  enableManualEntry?: boolean;
  currentUser?: string;
}
```

**Fonctionnalités :**
- Recherche en temps réel avec debounce
- Différenciation visuelle local/BAN
- Navigation au clavier (flèches, Enter, Escape)
- Mode manuel pour nouvelles adresses
- Accessibilité (ARIA, focus management)
- Gestion d'erreurs avec feedback utilisateur

## Structure de données CSV

### Format des adresses (`public/data/addresses.csv`)

```csv
id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;...;lon;lat;...
74002_nk74q8_00038;;38;;Clos du nant;74540;74002;Alby-sur-Chéran;;;6.013124;45.814976;...
```

**Colonnes importantes :**
- `numero` : Numéro de rue
- `nom_voie` : Nom de la voie
- `code_postal` : Code postal
- `nom_commune` : Nom de la commune
- `lon`, `lat` : Coordonnées GPS

### Format des lieux-dits (`public/data/lieux_dits.csv`)

```csv
id;nom_lieu_dit;code_postal;...;nom_commune;...;lon;lat;...
```

## Algorithme de recherche

### 1. Recherche locale prioritaire
- Recherche dans `AddressDatabaseService` (base enrichie)
- Recherche dans `addresses.csv` avec scoring
- Recherche dans `lieux_dits.csv`

### 2. Scoring de pertinence
```typescript
// Critères de scoring (points cumulatifs)
- Correspondance exacte complète: +100
- Correspondance exacte partielle: +80
- Début de correspondance: +50
- Correspondance par mots: +5 par mot
- Bonus tous mots trouvés: +20
- Correspondance partielle: +10
```

### 3. Recherche BAN complémentaire
- Déclenchée si résultats locaux insuffisants
- Filtrage des doublons avec base locale
- Ajout automatique au cache local lors de la sélection

### 4. Tri final
1. Résultats locaux (priorité absolue)
2. Résultats BAN par score décroissant

## Cas d'usage

### Recherche basique
```typescript
<AdvancedAddressSearch
  onAddressSelect={(address) => console.log('Sélectionnée:', address)}
  onCancel={() => console.log('Annulé')}
  placeholder="Tapez votre adresse..."
/>
```

### Recherche avec filtre postal
```typescript
<AdvancedAddressSearch
  postcode="74"
  maxResults={10}
  onAddressSelect={handleSelect}
  onCancel={handleCancel}
/>
```

### Mode intégré dans un formulaire
```typescript
const [showSearch, setShowSearch] = useState(false);
const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

return (
  <div>
    {!showSearch ? (
      <button onClick={() => setShowSearch(true)}>
        Rechercher une adresse
      </button>
    ) : (
      <AdvancedAddressSearch
        onAddressSelect={(addr) => {
          setSelectedAddress(addr);
          setShowSearch(false);
        }}
        onCancel={() => setShowSearch(false)}
      />
    )}
    
    {selectedAddress && (
      <div>Adresse sélectionnée: {selectedAddress.full_address}</div>
    )}
  </div>
);
```

## Gestion d'erreurs

### Erreurs réseau BAN
- Fallback automatique sur recherche locale uniquement
- Indication visuelle de l'état de connectivité
- Messages d'erreur contextuels

### Erreurs de validation
- Validation côté client des champs obligatoires
- Messages d'erreur accessibles avec ARIA
- Guide utilisateur pour correction

### Résilience
- Cache en mémoire des recherches récentes
- Retry automatique avec backoff exponentiel
- Dégradation gracieuse des fonctionnalités

## Accessibilité

### Support clavier
- Navigation dans les suggestions (↑/↓)
- Sélection avec Enter
- Fermeture avec Escape
- Focus management approprié

### ARIA
```typescript
// Attributs ARIA implémentés
aria-label="Recherche d'adresse"
aria-expanded={showSuggestions}
aria-haspopup="listbox"
role="combobox"
role="listbox"
role="option"
aria-selected={isSelected}
```

### Contraste et lisibilité
- Couleurs contrastées pour la différenciation local/BAN
- Icônes explicites (étoile=local, globe=BAN)
- Textes alternatifs pour les icônes

## Performance

### Optimisations
- Debouncing des requêtes (300ms par défaut)
- Cache des résultats de recherche
- Lazy loading des données CSV
- Limitation du nombre de résultats

### Métriques
- Temps de réponse local : <50ms
- Temps de réponse BAN : <2s
- Taille du cache : limitée à 50 entrées
- Bundle size impact : ~15KB (gzipped)

## Tests

### Structure des tests
```
src/__tests__/
├── addressSearch.test.ts     # Tests d'intégration
├── banApi.test.ts           # Tests API BAN
├── csvService.test.ts       # Tests service CSV
└── fuzzySearch.test.ts      # Tests recherche fuzzy
```

### Lancer les tests
```bash
npm test                     # Tous les tests
npm test -- --watch        # Mode watch
npm test addressSearch     # Tests spécifiques
```

### Couverture de tests
- Services : >90%
- Hooks : >85%
- Composants : >80%

## Configuration

### Variables d'environnement
```bash
# Optionnel - URL personnalisée pour BAN API
VITE_BAN_API_URL=https://api-adresse.data.gouv.fr

# Timeout pour les requêtes BAN (ms)
VITE_BAN_TIMEOUT=5000
```

### Configuration TypeScript
Le système utilise des types stricts pour garantir la sécurité :
```typescript
// Types principaux
Address, BANSuggestion, CSVAddress
AddressSearchResult, FuzzySearchResult
UseAddressSearchOptions
```

## Déploiement

### Build de production
```bash
npm run build
```

### Vérification
```bash
npm run preview
npm run lint
```

### Assets requis
- `/public/data/addresses.csv` : Base d'adresses française
- `/public/data/lieux_dits.csv` : Lieux-dits
- Connexion internet pour API BAN (optionnelle)

## Évolutions futures

### Améliorations prévues
- [ ] Géocodage local pour adresses sans coordonnées
- [ ] Historique des recherches utilisateur
- [ ] Suggestions basées sur la localisation
- [ ] API de mise à jour des données CSV
- [ ] Support multi-langues

### Intégrations possibles
- [ ] OpenStreetMap Nominatim (backup API)
- [ ] IGN Géoportail
- [ ] Base SIRENE pour les entreprises
- [ ] Données La Poste pour validation

## Support et maintenance

### Logs et monitoring
- Erreurs API BAN tracées en console
- Métriques de performance disponibles
- Cache hit/miss ratio

### Mise à jour des données
Les fichiers CSV doivent être mis à jour périodiquement :
1. Télécharger depuis [data.gouv.fr](https://www.data.gouv.fr)
2. Remplacer dans `/public/data/`
3. Redéployer l'application

### Contact
Pour questions techniques ou amélirations, voir la documentation du projet principal.