# Guide de Contribution - Dawra

## 🎯 Comment Contribuer

Merci de votre intérêt pour **Dawra** ! Ce guide vous explique comment contribuer efficacement au projet.

## 🚀 Démarrage Rapide

### 1. Setup Développement
```bash
# Fork le projet sur GitHub
git clone https://github.com/VOTRE-USERNAME/dawra.git
cd dawra

# Installation
npm install

# Lancement dev
npm run dev
```

### 2. Vérification Qualité
```bash
# Lint et correction auto
npm run lint

# Build pour vérifier
npm run build

# Tests (quand disponibles)
npm test
```

## 📋 Types de Contributions

### 🐛 Corrections de Bugs
1. Vérifiez qu'un [issue existe](https://github.com/Agirumi74/dawra/issues)
2. Créez une branche : `git checkout -b fix/nom-du-bug`
3. Corrigez le problème avec tests si possible
4. Commitez avec message descriptif
5. Ouvrez une Pull Request

### ✨ Nouvelles Fonctionnalités
1. Proposez via [Discussion GitHub](https://github.com/Agirumi74/dawra/discussions)
2. Attendez validation avant développement
3. Suivez l'architecture existante
4. Documentez la fonctionnalité
5. Ajoutez tests appropriés

### 📖 Documentation
1. Améliorations README, guides utilisateurs
2. Documentation technique manquante
3. Exemples et tutoriels
4. Traductions (si pertinent)

### 🧪 Tests
**Priorité élevée !** Le projet manque de tests.
1. Tests unitaires composants React
2. Tests hooks personnalisés  
3. Tests services/APIs
4. Tests d'intégration

## 🏗️ Standards de Code

### TypeScript
```typescript
// ✅ Bon : Types explicites
interface PackageData {
  id: string;
  address: Address;
  status: PackageStatus;
}

// ❌ Éviter : Types any
const handleData = (data: any) => { };
```

### Composants React
```typescript
// ✅ Structure recommandée
interface Props {
  packages: Package[];
  onPackageSelect: (id: string) => void;
}

export const PackageList: React.FC<Props> = ({ packages, onPackageSelect }) => {
  // Hooks en premier
  const [selectedId, setSelectedId] = useState<string>();
  
  // Fonctions
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    onPackageSelect(id);
  }, [onPackageSelect]);
  
  // Render
  return (
    <div className="package-list">
      {packages.map(pkg => (
        <PackageCard 
          key={pkg.id} 
          package={pkg}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
```

### Hooks Personnalisés
```typescript
// ✅ Pattern recommandé
export const usePackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Opérations CRUD avec gestion d'erreurs
  const addPackage = useCallback(async (packageData: PackageData) => {
    setLoading(true);
    try {
      // Logic
      setPackages(prev => [...prev, newPackage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { packages, loading, error, addPackage };
};
```

## 🎨 Guidelines UI/UX

### Design System (à créer)
```typescript
// Tokens de design cohérents
const colors = {
  primary: '#2563eb',    // Bleu principal
  success: '#10b981',    // Vert livraisons
  warning: '#f59e0b',    // Orange attention
  danger: '#ef4444',     // Rouge échecs
} as const;

const spacing = {
  xs: '0.25rem',
  sm: '0.5rem', 
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;
```

### Accessibilité
- **Contraste suffisant** pour usage extérieur
- **Touch targets** ≥ 44px pour usage avec gants
- **Navigation clavier** pour tous les éléments
- **Screen readers** avec labels appropriés

### Mobile-First
```css
/* ✅ Mobile d'abord */
.package-card {
  @apply p-4 text-base;
}

/* Puis desktop */
@media (min-width: 768px) {
  .package-card {
    @apply p-6 text-lg;
  }
}
```

## 🧪 Tests Guidelines

### Structure Tests
```
src/__tests__/
├── components/
│   ├── PackageList.test.tsx
│   └── BarcodeScanner.test.tsx
├── hooks/
│   ├── usePackages.test.ts
│   └── useLocalStorage.test.ts
├── services/
│   ├── geocoding.test.ts
│   └── routeOptimization.test.ts
└── utils/
    └── helpers.test.ts
```

### Exemple Test Composant
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PackageList } from '../components/PackageList';

describe('PackageList', () => {
  const mockPackages = [
    { id: '1', address: { street: 'Test' }, status: 'pending' }
  ];
  
  it('affiche la liste des colis', () => {
    render(<PackageList packages={mockPackages} onPackageSelect={jest.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('appelle onPackageSelect au clic', () => {
    const mockSelect = jest.fn();
    render(<PackageList packages={mockPackages} onPackageSelect={mockSelect} />);
    
    fireEvent.click(screen.getByText('Test'));
    expect(mockSelect).toHaveBeenCalledWith('1');
  });
});
```

## 📝 Conventions Git

### Messages de Commit
```bash
# Format : type(scope): description

# Types
feat(scanner): ajout scan QR codes
fix(route): correction calcul distances  
docs(readme): mise à jour installation
style(ui): amélioration contraste boutons
refactor(hooks): simplification usePackages
test(scanner): ajout tests unitaires
chore(deps): mise à jour dépendances
```

### Branches
```bash
# Fonctionnalités
feature/scanner-qr-codes
feature/voice-commands

# Corrections
fix/route-optimization-bug
fix/camera-permissions

# Documentation  
docs/user-guide-improvement
docs/api-documentation
```

## 🔍 Process de Review

### Checklist PR
- [ ] Code suit les standards du projet
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de breaking changes non documentés
- [ ] ESLint sans erreurs
- [ ] Build successful
- [ ] Screenshots UI si changements visuels

### Critères d'Acceptance
1. **Fonctionnel** : La feature marche comme spécifiée
2. **Qualité** : Code maintenable et bien structuré  
3. **Tests** : Couverture appropriée
4. **Performance** : Pas de régressions
5. **UX** : Interface intuitive et accessible

## 🏆 Priorités Actuelles

### Urgent (Aide Bienvenue !)
1. **🐛 Corrections ESLint** : 55 erreurs à corriger
2. **🔒 Sécurité** : Vulnérabilités npm à résoudre
3. **🧪 Tests** : Couverture de 15% à 80%+
4. **♻️ Refactor DriverDashboard** : Diviser composant de 552 lignes

### Important
1. **🎨 Design System** : Composants réutilisables
2. **⚡ Performance** : Optimisations React
3. **📱 PWA** : Service Worker complet
4. **📊 Monitoring** : Intégration Sentry

### Nice-to-Have
1. **🌐 i18n** : Support multilingue
2. **🎯 Analytics** : Métriques d'usage
3. **🤖 CI/CD** : Pipeline automatisée
4. **📚 Storybook** : Composants isolés

## ❓ FAQ Contributeurs

**Q: Je débute en React, puis-je contribuer ?**
R: Absolument ! Commencez par la documentation ou des corrections simples.

**Q: Comment proposer une grosse fonctionnalité ?**
R: Ouvrez d'abord une Discussion GitHub pour validation avant développement.

**Q: Le code actuel a beaucoup d'erreurs ESLint...**
R: C'est connu ! Votre aide pour les corriger est très appréciée.

**Q: Pas de tests, comment bien tester mes changements ?**
R: Testez manuellement + ajoutez des tests pour votre code si possible.

## 🎉 Reconnaissance

Tous les contributeurs sont mentionnés dans :
- README principal
- Page About de l'application  
- Release notes

Merci de faire de Dawra un meilleur outil pour les chauffeurs-livreurs ! 🚚

---

*Pour questions : [Discussions GitHub](https://github.com/Agirumi74/dawra/discussions)*