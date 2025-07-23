# 🚚 Dawra - Assistant Livraison Intelligent

> Progressive Web App pour optimiser les tournées de livraison des chauffeurs-livreurs

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Agirumi74/dawra)
[![Version](https://img.shields.io/badge/version-0.8.0-blue)](https://github.com/Agirumi74/dawra)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[🚀 Demo Live](https://dawra.netlify.app) | [📖 Documentation](./docs/) | [🐛 Signaler un Bug](https://github.com/Agirumi74/dawra/issues)

## 🎯 Vision du Produit

**Dawra** transforme le téléphone du chauffeur-livreur en assistant intelligent pour :
- ⚡ Réduire le temps de préparation matinale de 50%
- 🗺️ Optimiser les tournées et économiser du carburant  
- 📱 Simplifier la navigation et le suivi des livraisons
- 💰 Solution 100% gratuite fonctionnant sur tout smartphone
## 🚀 Démarrage rapide

### Installation

```bash
# Cloner le repository
git clone https://github.com/Agirumi74/dawra.git
cd dawra

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

### Configuration (Optionnel)

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Ajouter votre clé API Gemini pour l'OCR avancé
VITE_GEMINI_API_KEY=your_api_key_here
```

## ✨ Fonctionnalités principales

### 📱 Scanner de Colis
- **Code-barres** : Scan automatique avec la caméra
- **OCR Intelligent** : Extraction automatique des adresses via IA
- **Saisie manuelle** : Alternative pour les cas complexes

### 🗺️ Optimisation de Tournées  
- **Algorithme intelligent** : Calcul du meilleur itinéraire
- **Contraintes métier** : Prise en compte des créneaux de livraison
- **Géolocalisation** : Optimisation depuis votre position actuelle

### 🧭 Navigation GPS
- **Export universel** : Compatible Waze, Google Maps, Plans iOS
- **Mode étape par étape** : Navigation guidée 
- **Suivi en temps réel** : Marquage des livraisons effectuées

### 💾 Mode Offline
- **Fonctionnement hors-ligne** : Après chargement initial
- **Stockage local** : Données sécurisées sur l'appareil
- **Synchronisation** : Quand la connexion revient

## 👤 Persona Utilisateur

**Luc, 38 ans - Chauffeur-livreur UPS**
- 🎯 **Objectif** : Terminer sa tournée plus vite et rentrer plus tôt
- 😫 **Frustration** : 30-45 min perdues le matin à trier les colis
- 📱 **Compétences** : Utilisateur standard de smartphone
## 📖 Documentation

### 📚 Guides Utilisateur
- [🚀 Guide de démarrage](./docs/user-guide/getting-started.md)
- [📱 Scanner de colis](./SCANNING-FEATURES.md)
- [🗺️ Navigation GPS](./GUIDE-UTILISATEUR-GPS.md)
- [🔍 Recherche d'adresses](./README-ADDRESS-SEARCH.md)
- [🎤 Commandes vocales](./VOICE-FEATURES-DOCUMENTATION.md)

### 🛠️ Documentation Technique
- [🏗️ Architecture](./docs/developer/architecture.md)
- [🔧 Installation avancée](./docs/developer/installation.md)
- [🤝 Contribuer](./docs/developer/contributing.md)
- [🚀 Déploiement](./docs/developer/deployment.md)

## 🏗️ Statut du Projet

| Aspect | État | Commentaire |
|--------|------|-------------|
| **Core App** | ✅ Fonctionnel | Scanner + Optimisation + Navigation |
| **Tests** | ⚠️ Partiel | 15% couverture, besoin d'amélioration |
| **Documentation** | ✅ Complète | Guides détaillés disponibles |
| **Sécurité** | ⚠️ À corriger | 8 vulnérabilités détectées |
| **Production** | 🔄 En cours | Corrections nécessaires avant déploiement |

> 📋 **Voir l'[Audit Complet](./AUDIT.md)** pour une analyse détaillée de l'état du projet

## 🛠️ Tech Stack

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS
- **Maps** : Leaflet + OpenStreetMap  
- **Scanner** : ZXing + Gemini AI (OCR)
- **Storage** : LocalStorage + IndexedDB
- **Build** : PWA avec Service Worker

## 🔧 Scripts disponibles

```bash
npm run dev       # Développement (localhost:5173)
npm run build     # Build production
npm run preview   # Aperçu du build
npm run lint      # Vérification du code
```

## 🤝 Contribuer

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. **Commit** vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/ma-fonctionnalite`)
5. **Ouvrir** une Pull Request

> 💡 Consultez le [Guide de Contribution](./docs/developer/contributing.md) pour plus de détails

## 📜 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour les détails.

## 🙏 Remerciements

- **Chauffeurs-livreurs** pour leurs retours utilisateurs
- **OpenStreetMap** pour les données cartographiques
- **Communauté React** pour les outils et librairies

---

**Développé avec ❤️ pour les chauffeurs-livreurs français**

*Dernière mise à jour : {{ date }} | Version : 0.8.0*