# 🚨 Actions Immédiates - Checklist Production Dawra

## ⚡ Phase 1: Stabilisation (URGENT - 1-2 semaines)

### 🔒 Sécurité - Jour 1-2 (CRITIQUE)
- [ ] **Audit et correction vulnérabilités**
  ```bash
  npm audit
  npm audit fix --force
  npm install --package-lock-only
  ```
- [ ] **Vérification post-correction**
  ```bash
  npm audit --audit-level=moderate
  npm run build  # Vérifier que tout fonctionne
  npm run dev    # Tester en développement
  ```

### 🐛 ESLint - Jour 3-5 (CRITIQUE)
- [ ] **Correction automatique**
  ```bash
  npx eslint . --fix
  ```
- [ ] **Correction manuelle restante** (priorité par fichier):
  1. [ ] `src/hooks/useSpeechRecognition.ts` (6 types any + warnings)
  2. [ ] `src/services/offlineStorage.ts` (5 types any)
  3. [ ] `src/components/driver/DriverDashboard.tsx` (552 lignes à diviser)
  4. [ ] `src/components/FullRouteMapView.tsx` (2 types any)
  5. [ ] Tests : corriger tous les types any restants

- [ ] **Validation finale**
  ```bash
  npx eslint . --max-warnings 0
  ```

### 🧪 Tests - Jour 6-8 (CRITIQUE)
- [ ] **Corriger configuration Jest**
  - [ ] Mettre à jour `jest.config.cjs`
  - [ ] Ajouter types globaux manquants
  - [ ] Corriger `moduleNameMapping` → `moduleNameMapper`

- [ ] **Corriger tests cassés**
  ```bash
  npm test  # Identifier tous les tests cassés
  ```
  - [ ] `addressSearch.test.ts` (3 erreurs global.fetch)
  - [ ] `csvOptimization.test.ts` (1 erreur global.fetch)  
  - [ ] `enhancedAddressSearch.test.ts` (1 erreur global.fetch)
  - [ ] `speechRecognition.test.ts` (1 erreur NodeJS.Timeout)

- [ ] **Validation des tests**
  ```bash
  npm run test:coverage
  ```

### 📋 Validation Phase 1 (Jour 9-10)
- [ ] **Checklist finale avant Phase 2**:
  - [ ] ✅ `npm audit` → 0 vulnérabilité
  - [ ] ✅ `npm run lint` → 0 erreur
  - [ ] ✅ `npm test` → tous les tests passent
  - [ ] ✅ `npm run build` → build réussi
  - [ ] ✅ Application fonctionne en local

---

## 📞 Contact et Support

### En cas de blocage
1. **Problème de sécurité** → Créer issue GitHub avec label "security"
2. **Erreur ESLint complexe** → Documenter dans issue avec stacktrace
3. **Tests cassés** → Créer PR avec tentative de fix

### Resources
- 📖 **Documentation complète**: `PRODUCTION-READINESS.md`
- 🔍 **Audit existant**: `AUDIT.md` 
- 💻 **Configuration**: Voir `package.json`, `jest.config.cjs`, `eslint.config.js`

---

**⚠️ IMPORTANT**: Ne passer à la Phase 2 que si TOUS les points de la Phase 1 sont validés ✅