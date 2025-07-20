# Documentation GPS Manager - Dawra

## Vue d'ensemble

Le GPS Manager de Dawra est une solution complète de gestion et d'optimisation des tournées de livraison. Il intègre des algorithmes avancés de résolution du problème du voyageur de commerce (TSP) avec des contraintes réelles, et offre des capacités d'export vers les principales applications GPS.

## Fonctionnalités principales

### 🎯 Optimisation TSP avancée
- **Algorithme du voyageur de commerce** avec contraintes temporelles
- **Gestion des priorités** : Premier, Express midi, Standard
- **Fenêtres temporelles** pour les livraisons spécifiques
- **Amélioration 2-opt** automatique pour les grandes tournées
- **Calcul de matrices de distances réelles** via OSRM

### 📱 Export GPS multi-plateforme
- **Google Maps** avec waypoints optimisés (jusqu'à 23 points)
- **Waze** avec deep linking natif
- **Apple Plans** (iOS) avec support natif
- **Here Maps** pour les alternatives
- **Détection automatique** de la plateforme

### ⚡ Gestion temps réel
- **Ajout/suppression dynamique** de colis
- **Recalcul instantané** des itinéraires
- **Suivi de progression** en temps réel
- **Marquage des livraisons** avec statuts multiples

### 📊 Formats d'export multiples
- **GPX/KML** pour GPS professionnels
- **PDF** feuilles de route imprimables
- **CSV** données structurées
- **Partage** via Web Share API

## Architecture technique

### Structure des composants

```
src/
├── components/
│   ├── EnhancedGPSManager.tsx     # Interface principale GPS
│   ├── GPSNavigation.tsx          # Navigation avec carte
│   ├── GPSDemo.tsx               # Démonstration interactive
│   └── driver/
│       └── DriverDashboard.tsx   # Tableau de bord chauffeur
├── services/
│   ├── routeOptimization.ts      # Algorithmes TSP
│   ├── enhancedRouteExport.ts    # Export GPS avancé
│   ├── routeExport.ts           # Export données
│   └── geocoding.ts             # Géocodage
└── types/
    └── index.ts                 # Types TypeScript
```

### Types de données

#### Package
```typescript
interface Package {
  id: string;
  barcode?: string;
  address: Address;
  location: string;          // Emplacement dans le véhicule
  notes: string;
  type: 'particulier' | 'entreprise';
  priority?: 'standard' | 'express_midi' | 'premier';
  status: 'pending' | 'delivered' | 'failed';
  timeWindow?: {
    start?: string;          // Format HH:MM
    end?: string;
  };
  createdAt: Date;
  deliveredAt?: Date;
}
```

#### DeliveryPoint
```typescript
interface DeliveryPoint {
  id: string;
  address: Address;
  packages: Package[];
  status: 'pending' | 'completed' | 'partial';
  order: number;
  distance?: number;
  priority: 'standard' | 'express_midi' | 'premier';
  estimatedTime?: string;
}
```

## Guide d'utilisation

### 1. Configuration initiale

```typescript
const routeSettings = {
  startTime: '08:00',           // Heure de départ
  stopTimeMinutes: 15,          // Temps d'arrêt par livraison
  averageSpeedKmh: 30,         // Vitesse moyenne
  useConstraints: true,         // Activer les contraintes
  returnToDepot: true          // Retour au dépôt
};
```

### 2. Optimisation de route

```typescript
// Grouper les colis par adresse
const groupedPoints = RouteOptimizer.groupPackagesByAddress(packages);

// Géocoder les adresses
const geocodedPoints = await geocodeAddresses(groupedPoints);

// Calculer la matrice de distances
const distanceMatrix = await RouteOptimizer.getDistanceMatrix(coordinates);

// Optimiser avec contraintes
const optimizedRoute = RouteOptimizer.optimizeWithConstraints(
  geocodedPoints,
  userPosition,
  distanceMatrix,
  constraints,
  startTime,
  stopTimeMinutes,
  averageSpeedKmh
);
```

### 3. Export vers GPS externe

```typescript
// Export automatique selon la plateforme
EnhancedRouteExportService.exportToNativeGPS(deliveryPoints);

// Export spécifique
EnhancedRouteExportService.exportToGoogleMaps(deliveryPoints, {
  includeWaypoints: true,
  optimizeOrder: false,      // Garder notre optimisation
  travelMode: 'driving'
});

// Export avec deep linking
EnhancedRouteExportService.exportWithDeepLinking(
  deliveryPoints, 
  'auto'  // 'google' | 'waze' | 'apple' | 'here'
);
```

### 4. Gestion temps réel

```typescript
// Ajouter un colis en cours de tournée
const updatedTour = await RouteOptimizer.addAddressesToTour(
  existingTour,
  [newDeliveryPoint],
  currentPosition,
  currentIndex
);

// Marquer une livraison comme terminée
updatePackage(packageId, { 
  status: 'delivered', 
  deliveredAt: new Date() 
});
```

## Algorithmes d'optimisation

### TSP avec contraintes

L'algorithme principal utilise une approche multi-étapes :

1. **Séparation par priorité** : Traitement Premier → Express → Standard
2. **Contraintes temporelles** : Respect des fenêtres de livraison
3. **Nearest Neighbor** : Optimisation locale par groupe
4. **2-opt improvement** : Amélioration pour les grandes tournées

### Gestion des priorités

- **Premier** : Traité en priorité absolue, avant tous les autres
- **Express midi** : Doit être livré avant 12:00
- **Standard** : Traité après les prioritaires

### Contraintes temporelles

```typescript
// Exemple de contrainte
package.timeWindow = {
  start: '09:00',  // Pas avant 9h
  end: '11:00'     // Pas après 11h
};
```

## Intégrations GPS

### Google Maps
- Support jusqu'à 23 waypoints
- Optimisation des waypoints optionnelle
- Modes de transport multiples

### Waze
- Deep linking natif
- Une destination à la fois
- Notification des points suivants

### Apple Plans (iOS)
- URLs schemes natives
- Support iOS/macOS
- Intégration Siri

### Formats universels
- **GPX** : Compatible GPS randonnée/professionnel
- **KML** : Google Earth, applications cartographiques
- **CSV** : Import dans systèmes tiers

## Configuration avancée

### Variables d'environnement

```env
# Service de géocodage
GEOCODING_API_URL=https://api-adresse.data.gouv.fr/search/
OSRM_SERVER=https://router.project-osrm.org

# Limites d'optimisation
MAX_WAYPOINTS_GOOGLE=23
MAX_WAYPOINTS_HERE=16
MAX_POINTS_2OPT=50
```

### Paramètres de performance

```typescript
const optimizationSettings = {
  maxIterations2Opt: 100,        // Iterations max 2-opt
  distanceThreshold: 50000,      // Seuil distance (m)
  timeoutMs: 30000,             // Timeout calcul
  fallbackToHaversine: true,    // Fallback si OSRM échoue
  cacheDistanceMatrix: true     // Cache des matrices
};
```

## Tests et démonstration

### Démonstration interactive

Le composant `GPSDemo` propose une démonstration complète :

1. **Configuration** : Paramètres de tournée
2. **Scan simulation** : Ajout de colis de démonstration
3. **Optimisation** : Calcul d'itinéraire en temps réel
4. **Navigation** : Test des exports GPS
5. **Export** : Démonstration des formats

### Tests unitaires

```bash
# Tests des algorithmes
npm test routeOptimization

# Tests d'intégration GPS
npm test gpsExport

# Tests de performance
npm test performance
```

## Dépannage

### Problèmes courants

1. **Géocodage échoue**
   - Vérifier la connectivité internet
   - Valider le format des adresses
   - Utiliser le fallback Haversine

2. **Export GPS ne fonctionne pas**
   - Vérifier les URLs schemes
   - Tester les permissions navigateur
   - Utiliser le fallback web

3. **Optimisation lente**
   - Réduire le nombre de points
   - Désactiver l'amélioration 2-opt
   - Utiliser le cache de distances

### Logs de débogage

```typescript
// Activer les logs détaillés
localStorage.setItem('GPS_DEBUG', 'true');

// Logs de performance
console.time('routeOptimization');
// ... calcul
console.timeEnd('routeOptimization');
```

## Contributeurs et maintenance

### Structure du code
- Code modulaire et testable
- Types TypeScript stricts
- Documentation inline JSDoc
- Tests unitaires et d'intégration

### Ajout de nouvelles fonctionnalités
1. Implémenter les types TypeScript
2. Ajouter les tests unitaires
3. Mettre à jour la documentation
4. Tester l'intégration

### Performance
- Utilisation de Web Workers pour les calculs lourds
- Cache intelligent des matrices de distances
- Optimisations mémoire pour les grandes tournées
- Monitoring des performances en temps réel

---

*Cette documentation est maintenue à jour avec chaque version. Pour les questions spécifiques, consulter le code source ou contacter l'équipe de développement.*