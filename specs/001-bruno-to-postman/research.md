# Research: Formats Bruno et Postman

**Date**: 2025-11-14
**Phase**: 0 - Research
**Status**: Complete

## Objectif

Comprendre en profondeur les formats de fichiers Bruno (.bru) et Postman Collection (v2.1) pour implémenter une conversion fidèle et complète.

## Format Bruno (.bru)

### Décision
Le format Bruno utilise un format texte personnalisé appelé "Bru" qui est similaire à YAML mais avec sa propre syntaxe. Chaque fichier .bru représente une requête HTTP unique.

### Structure d'un fichier .bru

```bru
meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/api/users
  body: none
  auth: none
}

headers {
  Content-Type: application/json
  Authorization: Bearer {{token}}
}

params:query {
  page: 1
  limit: 10
}

body:json {
  {
    "name": "John Doe"
  }
}

script:pre-request {
  // JavaScript code executed before request
  bru.setVar("timestamp", Date.now());
}

tests {
  // JavaScript code for testing response
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
}

docs {
  Documentation for this request
}
```

### Sections principales

1. **meta**: Métadonnées (nom, type, séquence)
2. **get/post/put/delete/patch/head/options**: Méthode HTTP + URL
3. **headers**: En-têtes HTTP
4. **params:query**: Paramètres de query string
5. **params:path**: Variables de chemin
6. **body**: Corps de la requête (json, xml, text, multipart, form-urlencoded)
7. **script:pre-request**: Script JavaScript exécuté avant la requête
8. **tests**: Scripts de test JavaScript
9. **docs**: Documentation
10. **auth**: Configuration d'authentification

### Parsing Strategy

**Decision**: Implémenter un parser personnalisé ligne par ligne utilisant une machine à états
- **Rationale**: Le format Bruno n'a pas de parser npm officiel accessible. Un parser personnalisé nous donne un contrôle total et permet de gérer les edge cases.
- **Alternatives considered**:
  - Utiliser un parser YAML → Rejeté car le format Bruno n'est pas du YAML valide
  - Regex global → Rejeté car trop fragile et difficile à maintenir
  - PEG parser (nearley/chevrotain) → Rejeté car overkill pour ce format simple

### Variables d'environnement

Bruno utilise la syntaxe `{{variableName}}` pour les variables, identique à Postman. Les environnements sont stockés dans des fichiers séparés `environments/*.bru`.

## Format Postman Collection v2.1

### Décision
Utiliser le format Postman Collection v2.1 (JSON) qui est le format standard supporté par Postman desktop et web.

### Structure d'une collection Postman

```json
{
  "info": {
    "name": "Collection Name",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_postman_id": "uuid",
    "description": "Collection description"
  },
  "item": [
    {
      "name": "Request Name",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/users?page=1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "users"],
          "query": [
            {
              "key": "page",
              "value": "1"
            }
          ]
        },
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"John\"}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        }
      },
      "event": [
        {
          "listen": "prerequest",
          "script": {
            "type": "text/javascript",
            "exec": ["pm.environment.set('timestamp', Date.now());"]
          }
        },
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": ["pm.test('Status is 200', () => {", "  pm.response.to.have.status(200);", "});"]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com"
    }
  ]
}
```

### Éléments clés

1. **info**: Métadonnées de la collection
2. **item**: Array de requêtes ou folders
3. **item[].request**: Définition de la requête HTTP
4. **item[].request.url**: URL décomposée (raw, host, path, query)
5. **item[].request.body**: Corps avec mode et options
6. **item[].event**: Scripts pre-request et tests
7. **variable**: Variables au niveau collection

### Folders (hiérarchie)

```json
{
  "item": [
    {
      "name": "Users",
      "item": [
        {
          "name": "Get User",
          "request": { ... }
        }
      ]
    }
  ]
}
```

### Generation Strategy

**Decision**: Construire l'objet JSON Postman de manière programmatique avec validation Zod
- **Rationale**: Assure la conformité au schéma v2.1 et permet la détection précoce d'erreurs
- **Alternatives considered**:
  - Template strings JSON → Rejeté car sujet aux erreurs de syntaxe
  - JSON Schema validation → Rejeté car moins ergonomique que Zod en TypeScript

## Mapping Bruno → Postman

### Correspondances directes

| Bruno | Postman | Notes |
|-------|---------|-------|
| `meta.name` | `item[].name` | Nom de la requête |
| `get/post/put...` | `request.method` | Méthode HTTP |
| `url` | `request.url.raw` | URL brute avec variables |
| `headers` | `request.header[]` | Array d'objets {key, value} |
| `params:query` | `request.url.query[]` | Array d'objets {key, value} |
| `body:json` | `request.body.raw` + mode="raw" | Corps JSON |
| `script:pre-request` | `event[].script` (prerequest) | Script JavaScript |
| `tests` | `event[].script` (test) | Script de test |
| `{{variable}}` | `{{variable}}` | Variables identiques |

### Conversions nécessaires

1. **URL Parsing**: Bruno stocke l'URL en texte brut, Postman la décompose en {host, path, query}
   - Solution: Parser l'URL pour extraire les composants

2. **Script Adaptation**: Les scripts Bruno utilisent l'API `bru.*`, Postman utilise `pm.*`
   - Solution: Remplacer `bru.setVar` par `pm.environment.set`, `bru.getVar` par `pm.environment.get`

3. **Body Types**: Mapper les types de body Bruno vers les modes Postman
   - `body:json` → `mode: "raw"`, `options.raw.language: "json"`
   - `body:xml` → `mode: "raw"`, `options.raw.language: "xml"`
   - `body:text` → `mode: "raw"`, `options.raw.language: "text"`
   - `body:multipart` → `mode: "formdata"`
   - `body:form-urlencoded` → `mode: "urlencoded"`

4. **Auth**: Convertir la configuration d'authentification Bruno vers Postman
   - Basic, Bearer, API Key sont supportés par les deux
   - OAuth2 peut nécessiter une adaptation

## Bibliothèques TypeScript

### CLI Framework

**Decision**: `commander` v11+
- **Rationale**: Standard de facto pour les CLI Node.js, excellent TypeScript support, API simple
- **Alternatives considered**:
  - `yargs` → Rejeté car API plus verbeuse
  - `oclif` → Rejeté car framework trop lourd pour nos besoins

### Validation

**Decision**: `zod` v3+
- **Rationale**: Excellente intégration TypeScript, inférence de types, messages d'erreur clairs
- **Alternatives considered**:
  - `joi` → Rejeté car pas d'inférence de types automatique
  - `ajv` (JSON Schema) → Rejeté car moins ergonomique avec TypeScript

### File Operations

**Decision**: Node.js built-in `fs/promises` + `glob` v10+
- **Rationale**: fs/promises est natif et performant, glob est léger et standard
- **Alternatives considered**:
  - `fs-extra` → Rejeté car fonctionnalités non nécessaires
  - `fast-glob` → Rejeté car glob standard suffit

### Terminal UI

**Decision**: `chalk` v5+ (colors) + `ora` v7+ (spinners)
- **Rationale**: Bibliothèques légères et standard, excellent support ESM
- **Alternatives considered**:
  - `ink` (React pour CLI) → Rejeté car overkill pour nos besoins
  - `enquirer` → Gardé en option si interactivité nécessaire plus tard

### Testing

**Decision**: `jest` v29+ avec `ts-jest`
- **Rationale**: Standard pour TypeScript, excellent support, mocking facile
- **Alternatives considered**:
  - `vitest` → Rejeté car Jest est plus mature et mieux documenté
  - `mocha` + `chai` → Rejeté car Jest offre tout intégré

## Structure hiérarchique (Folders)

### Stratégie

**Decision**: Mapper la structure de répertoires Bruno → structure de folders Postman
- Un dossier Bruno = un item Postman de type folder
- Les sous-dossiers deviennent des folders imbriqués
- Les fichiers .bru deviennent des items de type request

**Example**:
```
bruno/
├── users/
│   ├── get-user.bru
│   └── create-user.bru
└── products/
    └── list-products.bru
```

Devient:
```json
{
  "item": [
    {
      "name": "users",
      "item": [
        { "name": "get-user", "request": {...} },
        { "name": "create-user", "request": {...} }
      ]
    },
    {
      "name": "products",
      "item": [
        { "name": "list-products", "request": {...} }
      ]
    }
  ]
}
```

## Gestion des erreurs

### Messages d'erreur en anglais (open source international)

**Decision**: Créer un module `errorMessages.ts` avec des templates de messages en anglais
- Tous les messages utilisateur en anglais pour distribution open source mondiale
- Inclure le contexte (nom de fichier, ligne si possible)
- Suggérer des actions correctives

**Rationale**: L'outil est destiné à une distribution open source internationale. L'anglais maximise l'accessibilité globale et simplifie la maintenance.

**Exemple**:
```typescript
{
  INVALID_BRU_FILE: (file: string, reason: string) =>
    `❌ File ${file} is not a valid Bruno file.\n` +
    `   Reason: ${reason}\n` +
    `   💡 Verify the file contains a meta section and an HTTP method.`,

  FILE_NOT_FOUND: (path: string) =>
    `❌ File not found: ${path}\n` +
    `   💡 Check that the path is correct and you have read permissions.`
}
```

## Performance

### Stratégie d'optimisation

**Decision**: Processing asynchrone avec limite de concurrence
- Utiliser `Promise.all` avec chunking pour traiter plusieurs fichiers en parallèle
- Limite de 10 fichiers simultanés pour éviter la saturation mémoire
- Streaming pour les très gros fichiers (>5MB)

**Rationale**: Balance entre performance et utilisation mémoire, respecte les contraintes de <10s pour 50 fichiers

## Conclusion

Toutes les décisions techniques sont prises. Aucune clarification supplémentaire nécessaire. Prêt pour la Phase 1 (Design).
