# Guide Utilisateur - GPS Manager

## 📱 Introduction

Le GPS Manager de Dawra vous permet d'optimiser vos tournées de livraison et d'exporter vos itinéraires vers vos applications GPS préférées (Google Maps, Waze, Plans iOS).

## 🚀 Démarrage rapide

### 1. Accéder au GPS Manager

1. Connectez-vous à l'application Dawra
2. Dans le tableau de bord chauffeur, cliquez sur "GPS Manager"
3. Ou utilisez l'onglet "GPS" dans la navigation

### 2. Première utilisation

1. **Voir la démonstration** : Cliquez sur "Voir la démo" pour découvrir toutes les fonctionnalités
2. **Scanner vos colis** : Ajoutez vos colis via l'onglet "Scanner" ou directement dans GPS Manager
3. **Optimiser votre tournée** : Cliquez sur "Optimiser la tournée" une fois vos colis ajoutés

## 📦 Gestion des colis

### Ajouter un colis

1. **Via scan** :
   - Cliquez sur "Scanner un colis"
   - Scannez le code-barres avec votre caméra
   - L'adresse sera détectée automatiquement (OCR)
   - Vérifiez et complétez les informations

2. **Manuellement** :
   - Cliquez sur "Ajouter colis" dans GPS Manager
   - Saisissez l'adresse complète
   - Indiquez l'emplacement dans votre véhicule
   - Ajoutez des notes si nécessaire

### Informations importantes du colis

- **Adresse** : Adresse complète de livraison
- **Emplacement** : Où se trouve le colis dans votre véhicule (ex: "Étagère Gauche Haut")
- **Type** : Particulier ou Entreprise
- **Priorité** :
  - 🔴 **Premier** : Livraison prioritaire absolue
  - 🟠 **Express midi** : À livrer avant 12h00
  - ⚪ **Standard** : Livraison normale
- **Fenêtre temporelle** : Créneaux horaires spécifiques (optionnel)
- **Notes** : Informations importantes (code porte, consignes spéciales, etc.)

## ⚙️ Configuration de la tournée

### Paramètres principaux

1. **Heure de départ** : Quand vous commencez votre tournée (défaut: 08:00)
2. **Temps d'arrêt** : Durée moyenne par livraison (défaut: 15 minutes)
3. **Vitesse moyenne** : Votre vitesse moyenne de conduite (défaut: 30 km/h)
4. **Contraintes temporelles** : Respecter les priorités et fenêtres horaires
5. **Retour dépôt** : Inclure le retour au dépôt dans le calcul

### Conseils pour les paramètres

- **Temps d'arrêt** : Comptez 10-20 minutes selon le type de quartier
- **Vitesse moyenne** : 25-35 km/h en ville, 40-50 km/h en périphérie
- **Contraintes** : Activez toujours pour respecter les priorités clients

## 🎯 Optimisation de tournée

### Comment ça marche

1. L'algorithme groupe vos colis par adresse
2. Il calcule les distances réelles entre tous les points
3. Il applique les contraintes de priorité et de temps
4. Il génère l'itinéraire le plus efficace

### Types d'optimisation

- **Simple** : Plus rapide, ordre optimal des adresses
- **Avec contraintes** : Plus lent mais respecte toutes vos contraintes

### Lecture des résultats

Chaque point de livraison affiche :
- **Numéro d'ordre** dans la tournée
- **Heure prévue** d'arrivée
- **Distance** depuis le point précédent
- **Nombre de colis** à livrer
- **Priorité** du point (couleur de l'icône)

## 🧭 Navigation GPS

### Export vers votre GPS préféré

#### Google Maps
- ✅ Support jusqu'à 23 points de passage
- ✅ Optimisation d'itinéraire automatique
- ✅ Fonctionne sur tous les appareils

#### Waze
- ✅ Lancement direct de l'application
- ⚠️ Une destination à la fois
- ℹ️ Liste des prochains arrêts affichée

#### Apple Plans (iOS)
- ✅ Application native iOS
- ✅ Intégration Siri
- ✅ Support CarPlay

### Mode navigation intégré

1. **Vue carte** : Visualisez votre position et l'itinéraire
2. **Point actuel** : Informations sur la livraison en cours
3. **Actions rapides** :
   - "Naviguer" : Ouvrir dans votre GPS
   - "Livraison terminée" : Marquer comme livré
   - "Échec" : Marquer comme échec de livraison

### Gestion temps réel

#### Ajouter un colis en cours de tournée
1. Cliquez sur le bouton "+" dans la navigation
2. Ajoutez le nouveau colis
3. L'itinéraire se recalcule automatiquement

#### Marquer une livraison
- **Livraison terminée** : Le point passe au vert, passage automatique au suivant
- **Échec de livraison** : Le point passe au rouge, possibilité de réessayer plus tard

## 📤 Export et partage

### Formats disponibles

#### Pour GPS externes
- **URL Google Maps** : Lien direct avec tous les points
- **URL Waze** : Lien vers la première destination
- **GPX** : Fichier pour GPS professionnels
- **KML** : Fichier pour Google Earth

#### Pour documentation
- **PDF** : Feuille de route imprimable
- **CSV** : Données pour Excel/autres logiciels
- **Liste colis** : Détail de tous les colis

### Partage de tournée

1. **Via WhatsApp/SMS** : Partage du résumé textuel
2. **Email** : Export des fichiers par email
3. **Impression** : Feuille de route PDF

## ❓ Questions fréquentes

### L'optimisation est-elle toujours meilleure ?
- Oui, sauf cas très particuliers (contraintes locales que l'algorithme ne connaît pas)
- Vous pouvez toujours modifier l'ordre manuellement après optimisation

### Que faire si une adresse n'est pas trouvée ?
1. Vérifiez l'orthographe de l'adresse
2. Essayez une forme simplifiée (sans étage, bis, etc.)
3. Utilisez l'adresse la plus proche
4. L'adresse sera positionnée manuellement

### Comment gérer les livraisons échouées ?
1. Marquez comme "Échec" pendant la navigation
2. Le colis reste dans votre liste pour un nouvel essai
3. Vous pouvez le repositionner dans la tournée

### L'export GPS ne fonctionne pas
1. Vérifiez que l'app GPS est installée
2. Autorisez les redirections dans votre navigateur
3. Utilisez l'export web en fallback

### Puis-je modifier une tournée optimisée ?
- Oui, vous pouvez réordonner manuellement les points
- Vous pouvez ajouter/supprimer des colis à tout moment
- Vous pouvez recalculer l'optimisation à nouveau

## 💡 Conseils d'utilisation

### Pour une efficacité maximum
1. **Scannez tous vos colis** avant de partir
2. **Vérifiez les priorités** (Premier, Express midi)
3. **Renseignez les fenêtres temporelles** si connues
4. **Optimisez avant de partir** du dépôt
5. **Utilisez votre GPS habituel** pour la navigation

### Bonnes pratiques
- **Emplacements** : Soyez précis pour retrouver vos colis rapidement
- **Notes** : Notez codes portes, étages, consignes spéciales
- **Types** : Distinguez particuliers/entreprises pour les horaires
- **Backup** : Exportez votre feuille de route en PDF

### Optimisation des paramètres
- **Ville dense** : Vitesse 25 km/h, arrêts 20 min
- **Périphérie** : Vitesse 40 km/h, arrêts 10 min
- **Zones mixtes** : Vitesse 30 km/h, arrêts 15 min

## 🆘 Support

### En cas de problème
1. **Redémarrer l'app** : Fermer complètement et relancer
2. **Vérifier la connexion** : L'optimisation nécessite internet
3. **Vider le cache** : Dans les paramètres du navigateur
4. **Contacter le support** : Si le problème persiste

### Signaler un bug
- Décrivez précisément le problème
- Indiquez votre navigateur et appareil
- Joignez une capture d'écran si possible

---

**💡 Astuce** : Commencez par la démonstration pour découvrir toutes les fonctionnalités en 5 minutes !

**🔄 Mise à jour** : Cette documentation est mise à jour régulièrement. Consultez-la pour découvrir les nouvelles fonctionnalités.