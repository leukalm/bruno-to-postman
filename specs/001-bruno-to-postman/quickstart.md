# Guide de démarrage rapide : Bruno to Postman

**Version**: 1.0.0
**Date**: 2025-11-14

## Introduction

Cet outil en ligne de commande permet de convertir vos fichiers de requêtes Bruno (.bru) vers le format de collection Postman v2.1, facilitant ainsi la migration entre ces deux outils.

## Installation

### Prérequis

- Node.js 18.0 ou supérieur
- npm 9.0 ou supérieur

### Installation globale (recommandée)

```bash
npm install -g bruno-to-postman
```

### Installation locale dans un projet

```bash
npm install --save-dev bruno-to-postman
```

### Installation depuis les sources

```bash
git clone https://github.com/votre-org/bruno-to-postman.git
cd bruno-to-postman
npm install
npm run build
npm link
```

## Utilisation

### Commande de base

```bash
bruno-to-postman convert <input> -o <output>
```

### Options disponibles

| Option | Alias | Description | Par défaut |
|--------|-------|-------------|------------|
| `--output` | `-o` | Chemin du fichier de sortie | `./collection.postman.json` |
| `--name` | `-n` | Nom de la collection Postman | Nom du dossier source |
| `--env` | `-e` | Inclure la conversion des environnements | `false` |
| `--recursive` | `-r` | Parcourir les sous-dossiers | `true` |
| `--verbose` | `-v` | Afficher les logs détaillés | `false` |
| `--json` | `-j` | Sortie au format JSON | `false` |
| `--force` | `-f` | Écraser les fichiers existants | `false` |

## Exemples d'utilisation

### 1. Convertir un fichier Bruno unique

```bash
bruno-to-postman convert ./requests/get-user.bru -o ./postman/get-user.json
```

**Résultat attendu** :
```
✓ Lecture du fichier Bruno : ./requests/get-user.bru
✓ Parsing réussi : 1 requête trouvée
✓ Conversion en cours...
✓ Collection Postman créée avec succès
✓ Fichier sauvegardé : ./postman/get-user.json

📊 Résumé :
  - Requêtes converties : 1
  - Durée : 0.15s
```

### 2. Convertir un dossier entier

```bash
bruno-to-postman convert ./bruno-requests -o ./my-collection.json -n "Ma Collection API"
```

**Résultat attendu** :
```
✓ Scan du dossier : ./bruno-requests
✓ Fichiers Bruno trouvés : 15
✓ Structure détectée : 3 dossiers, 15 requêtes

🔄 Conversion en cours...
  ✓ users/get-all.bru
  ✓ users/create.bru
  ✓ users/update.bru
  ✓ products/list.bru
  ...

✓ Collection Postman créée : "Ma Collection API"
✓ Fichier sauvegardé : ./my-collection.json

📊 Résumé :
  - Requêtes converties : 15/15
  - Dossiers : 3
  - Durée : 2.3s
```

### 3. Convertir avec environnements

```bash
bruno-to-postman convert ./bruno-requests -o ./collection.json --env
```

**Résultat attendu** :
```
✓ Scan du dossier : ./bruno-requests
✓ Fichiers Bruno trouvés : 15
✓ Environnements détectés : 2 (dev, prod)

🔄 Conversion en cours...
  ✓ Requêtes : 15/15
  ✓ Environnements : 2/2

✓ Fichiers créés :
  - ./collection.json
  - ./dev.postman_environment.json
  - ./prod.postman_environment.json

📊 Résumé :
  - Requêtes converties : 15
  - Environnements : 2
  - Durée : 2.8s
```

### 4. Mode verbeux pour le débogage

```bash
bruno-to-postman convert ./bruno-requests -o ./collection.json -v
```

**Résultat attendu** :
```
🔍 Mode verbeux activé

[DEBUG] Scan du dossier : ./bruno-requests
[DEBUG] Fichier trouvé : ./bruno-requests/users/get-all.bru
[DEBUG]   - Méthode : GET
[DEBUG]   - URL : {{baseUrl}}/api/users
[DEBUG]   - Headers : 2
[DEBUG]   - Query params : 1
[DEBUG] Fichier trouvé : ./bruno-requests/users/create.bru
[DEBUG]   - Méthode : POST
[DEBUG]   - URL : {{baseUrl}}/api/users
[DEBUG]   - Headers : 2
[DEBUG]   - Body : JSON (45 bytes)
...

✓ Conversion terminée
```

### 5. Sortie JSON pour intégration CI/CD

```bash
bruno-to-postman convert ./bruno-requests -o ./collection.json --json
```

**Résultat attendu** (JSON sur stdout) :
```json
{
  "success": true,
  "inputPath": "./bruno-requests",
  "outputPath": "./collection.json",
  "requestsConverted": 15,
  "foldersCreated": 3,
  "duration": 2300,
  "errors": [],
  "warnings": []
}
```

## Structure d'un projet Bruno typique

```
mon-projet-bruno/
├── environments/
│   ├── dev.bru          # Variables d'environnement dev
│   └── prod.bru         # Variables d'environnement prod
├── users/
│   ├── get-all.bru
│   ├── get-by-id.bru
│   ├── create.bru
│   └── update.bru
├── products/
│   ├── list.bru
│   └── details.bru
└── bruno.json           # Config Bruno (ignoré par le convertisseur)
```

## Après la conversion

### Import dans Postman Desktop

1. Ouvrir Postman
2. Cliquer sur "Import" (en haut à gauche)
3. Sélectionner "File"
4. Choisir le fichier `.json` généré
5. Cliquer sur "Import"

### Import des environnements

1. Aller dans "Environments" (barre latérale gauche)
2. Cliquer sur "Import"
3. Sélectionner les fichiers `.postman_environment.json`
4. Activer l'environnement souhaité

### Vérification

✅ **À vérifier après l'import** :
- Toutes les requêtes sont présentes
- La structure hiérarchique (folders) est préservée
- Les variables `{{var}}` sont bien reconnues
- Les scripts pre-request et tests sont présents
- Les headers et query parameters sont corrects

## Gestion des erreurs

### Erreur : Fichier Bruno invalide

```
❌ Le fichier ./requests/invalid.bru n'est pas un fichier Bruno valide.
   Raison: Section 'meta' manquante
   💡 Vérifiez que le fichier contient une section meta et une méthode HTTP.
```

**Solution** : Ouvrez le fichier et ajoutez une section `meta` :
```bru
meta {
  name: Ma Requête
  type: http
}
```

### Erreur : Permissions d'écriture

```
❌ Impossible d'écrire le fichier : ./output/collection.json
   Raison: Permission refusée
   💡 Vérifiez que vous avez les permissions d'écriture dans ce dossier.
```

**Solution** :
```bash
chmod +w ./output
# ou
sudo bruno-to-postman convert ...
```

### Erreur : Fichier de sortie existe déjà

```
❌ Le fichier ./collection.json existe déjà.
   💡 Utilisez l'option --force pour écraser le fichier existant.
```

**Solution** :
```bash
bruno-to-postman convert ./bruno-requests -o ./collection.json --force
```

### Avertissement : Fonctionnalité non supportée

```
⚠️  Avertissement dans users/upload.bru :
   La fonctionnalité 'binary file upload' n'est pas complètement supportée par Postman.
   💡 Vous devrez configurer manuellement le fichier dans Postman après l'import.
```

## Fonctionnalités supportées

### ✅ Complètement supporté

- Toutes les méthodes HTTP (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Headers personnalisés
- Query parameters
- Path variables `{{var}}`
- Body JSON, XML, text, form-urlencoded
- Authentification Basic, Bearer, API Key
- Scripts pre-request (convertis de `bru.*` vers `pm.*`)
- Scripts de tests (convertis vers syntaxe Postman)
- Variables d'environnement
- Structure hiérarchique (folders)

### ⚠️ Partiellement supporté

- Body multipart/form-data (fichiers nécessitent configuration manuelle)
- OAuth2 (config de base uniquement)
- Certificats client
- Proxies

### ❌ Non supporté

- GraphQL (format Bruno spécifique)
- WebSocket
- gRPC
- Plugins Bruno personnalisés

## Intégration CI/CD

### GitHub Actions

```yaml
name: Convert Bruno to Postman

on:
  push:
    paths:
      - 'bruno-requests/**'

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g bruno-to-postman
      - run: bruno-to-postman convert ./bruno-requests -o ./postman-collection.json --json
      - uses: actions/upload-artifact@v3
        with:
          name: postman-collection
          path: postman-collection.json
```

### GitLab CI

```yaml
convert-bruno:
  image: node:18
  script:
    - npm install -g bruno-to-postman
    - bruno-to-postman convert ./bruno-requests -o ./postman-collection.json
  artifacts:
    paths:
      - postman-collection.json
```

## Script npm

Ajoutez dans votre `package.json` :

```json
{
  "scripts": {
    "convert": "bruno-to-postman convert ./bruno-requests -o ./postman-collection.json",
    "convert:dev": "bruno-to-postman convert ./bruno-requests -o ./dev-collection.json --env",
    "convert:watch": "nodemon --watch bruno-requests --exec 'npm run convert'"
  }
}
```

## Dépannage

### L'outil ne démarre pas

```bash
# Vérifier l'installation
which bruno-to-postman

# Réinstaller
npm uninstall -g bruno-to-postman
npm install -g bruno-to-postman

# Vérifier la version Node.js
node --version  # Doit être >= 18.0
```

### Performances lentes

- Utiliser `--recursive false` si vous n'avez pas de sous-dossiers
- Traiter les dossiers par petits lots
- Vérifier qu'il n'y a pas de très gros fichiers (>10MB)

### Caractères spéciaux mal encodés

- Vérifier que vos fichiers .bru sont en UTF-8
- Utiliser `file --mime-encoding *.bru` pour vérifier

## Support et contribution

- **Issues** : https://github.com/votre-org/bruno-to-postman/issues
- **Documentation** : https://docs.bruno-to-postman.dev
- **Discord** : https://discord.gg/bruno-to-postman

## Changelog

### v1.0.0 (2025-11-14)
- ✨ Conversion fichier unique
- ✨ Conversion dossier avec hiérarchie
- ✨ Support des environnements Bruno
- ✨ Conversion des scripts (bru.* → pm.*)
- ✨ Messages d'erreur en français
- ✨ Mode verbeux pour débogage
