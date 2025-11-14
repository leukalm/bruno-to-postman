# Contract: Format Postman Collection v2.1

**Version**: 2.1.0
**Format**: JSON
**Extension**: `.json`
**Schema**: https://schema.getpostman.com/json/collection/v2.1.0/collection.json

## Description

Le format Postman Collection v2.1 est un format JSON standardisé pour représenter des collections de requêtes HTTP organisées hiérarchiquement.

## Structure racine

```json
{
  "info": { ... },      // Obligatoire - Métadonnées collection
  "item": [ ... ],      // Obligatoire - Array de requêtes/folders
  "auth": { ... },      // Optionnel - Auth par défaut
  "variable": [ ... ],  // Optionnel - Variables collection
  "event": [ ... ]      // Optionnel - Scripts globaux
}
```

## Section `info` (obligatoire)

Métadonnées de la collection.

```json
{
  "info": {
    "name": "Ma Collection",
    "_postman_id": "uuid-v4",
    "description": "Description de la collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "version": {
      "major": 1,
      "minor": 0,
      "patch": 0
    }
  }
}
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom de la collection |
| `_postman_id` | string | ❌ | UUID unique (généré par Postman) |
| `description` | string | ❌ | Description markdown |
| `schema` | string | ✅ | URL du schéma v2.1 |
| `version` | object | ❌ | Version sémantique |

## Section `item` (obligatoire)

Array d'items pouvant être des requêtes ou des folders.

### Item de type Requête

```json
{
  "name": "Get Users",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{baseUrl}}/api/users?page=1",
      "host": ["{{baseUrl}}"],
      "path": ["api", "users"],
      "query": [
        {
          "key": "page",
          "value": "1",
          "disabled": false
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
    },
    "auth": {
      "type": "bearer",
      "bearer": [
        {
          "key": "token",
          "value": "{{authToken}}",
          "type": "string"
        }
      ]
    },
    "description": "Récupère la liste des utilisateurs"
  },
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          "pm.environment.set('timestamp', Date.now());"
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          "pm.test('Status is 200', () => {",
          "  pm.response.to.have.status(200);",
          "});"
        ]
      }
    }
  ]
}
```

### Item de type Folder

```json
{
  "name": "Users",
  "description": "Endpoints liés aux utilisateurs",
  "item": [
    { ... },  // Requêtes ou sous-folders
    { ... }
  ]
}
```

**Distinction** : Un item est un folder si et seulement si il contient `item[]` et pas de `request`. Sinon c'est une requête.

## Objet `request`

### Méthode HTTP

```json
{
  "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "COPY" | "LINK" | "UNLINK" | "PURGE" | "LOCK" | "UNLOCK" | "PROPFIND" | "VIEW"
}
```

### Headers

```json
{
  "header": [
    {
      "key": "Content-Type",
      "value": "application/json",
      "type": "text",
      "disabled": false,
      "description": "Type du contenu"
    }
  ]
}
```

### URL

#### Format simple (string)
```json
{
  "url": "https://api.example.com/users"
}
```

#### Format détaillé (object - recommandé)
```json
{
  "url": {
    "raw": "{{baseUrl}}/api/users/:userId?page=1#section",
    "protocol": "https",
    "host": ["{{baseUrl}}"],
    "port": "443",
    "path": ["api", "users", ":userId"],
    "query": [
      {
        "key": "page",
        "value": "1",
        "disabled": false,
        "description": "Numéro de page"
      }
    ],
    "variable": [
      {
        "key": "userId",
        "value": "123",
        "description": "ID de l'utilisateur"
      }
    ],
    "hash": "section"
  }
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `raw` | string | URL complète brute |
| `protocol` | string | http, https, ftp, etc. |
| `host` | string[] | Domaine découpé (ex: ["api", "example", "com"]) |
| `port` | string | Port (optionnel) |
| `path` | string[] | Chemin découpé (ex: ["api", "users"]) |
| `query` | array | Paramètres de query string |
| `variable` | array | Variables de path (`:var`) |
| `hash` | string | Fragment d'ancre |

### Body

```json
{
  "body": {
    "mode": "raw" | "urlencoded" | "formdata" | "file" | "graphql",

    // Si mode = "raw"
    "raw": "{\"key\": \"value\"}",
    "options": {
      "raw": {
        "language": "json" | "xml" | "html" | "text" | "javascript"
      }
    },

    // Si mode = "urlencoded"
    "urlencoded": [
      {
        "key": "username",
        "value": "john",
        "disabled": false,
        "type": "text"
      }
    ],

    // Si mode = "formdata"
    "formdata": [
      {
        "key": "file",
        "type": "file",
        "src": "/path/to/file.pdf"
      },
      {
        "key": "description",
        "value": "Mon fichier",
        "type": "text"
      }
    ],

    // Si mode = "file"
    "file": {
      "src": "/path/to/file.bin"
    }
  }
}
```

### Authentification

```json
{
  "auth": {
    "type": "noauth" | "basic" | "bearer" | "apikey" | "oauth2" | "awsv4" | "digest" | "hawk" | "ntlm",

    // Si type = "basic"
    "basic": [
      { "key": "username", "value": "{{user}}", "type": "string" },
      { "key": "password", "value": "{{pass}}", "type": "string" }
    ],

    // Si type = "bearer"
    "bearer": [
      { "key": "token", "value": "{{token}}", "type": "string" }
    ],

    // Si type = "apikey"
    "apikey": [
      { "key": "key", "value": "api-key", "type": "string" },
      { "key": "value", "value": "{{apiKey}}", "type": "string" },
      { "key": "in", "value": "header" | "query", "type": "string" }
    ]
  }
}
```

## Events (Scripts)

### Pre-request scripts

```json
{
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "id": "unique-id",
        "type": "text/javascript",
        "exec": [
          "// Code JavaScript ligne par ligne",
          "pm.environment.set('timestamp', Date.now());",
          "console.log('Pre-request executed');"
        ]
      }
    }
  ]
}
```

### Test scripts

```json
{
  "event": [
    {
      "listen": "test",
      "script": {
        "id": "unique-id",
        "type": "text/javascript",
        "exec": [
          "pm.test('Status is 200', () => {",
          "  pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test('Response has data', () => {",
          "  const json = pm.response.json();",
          "  pm.expect(json).to.have.property('data');",
          "});"
        ]
      }
    }
  ]
}
```

### API Postman dans les scripts

```javascript
// Variables
pm.environment.set("key", "value");
pm.environment.get("key");
pm.environment.unset("key");

pm.globals.set("key", "value");
pm.globals.get("key");

pm.variables.get("key"); // Résout l'ordre: global, collection, env, data

// Tests
pm.test("Test name", () => {
  pm.expect(value).to.equal(expected);
});

// Réponse
pm.response.code // Status code
pm.response.status // Status text
pm.response.headers.get("Header-Name")
pm.response.json() // Parse JSON
pm.response.text() // Raw text
pm.response.responseTime // Time in ms
pm.response.responseSize // Size in bytes

// Requête
pm.request.method
pm.request.url
pm.request.headers
pm.request.body

// Utilitaires
pm.sendRequest(url, callback); // HTTP request
pm.info.requestName
pm.info.eventName
```

## Variables de collection

```json
{
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.example.com",
      "type": "string",
      "disabled": false
    },
    {
      "key": "timeout",
      "value": "5000",
      "type": "number"
    }
  ]
}
```

## Format d'environnement Postman

Fichier séparé `.postman_environment.json` :

```json
{
  "id": "uuid",
  "name": "Development",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://dev.api.example.com",
      "enabled": true,
      "type": "default"
    },
    {
      "key": "apiKey",
      "value": "secret-key",
      "enabled": true,
      "type": "secret"
    }
  ],
  "_postman_variable_scope": "environment",
  "_postman_exported_at": "2025-11-14T10:30:00.000Z",
  "_postman_exported_using": "Postman/10.0.0"
}
```

## Validation

Une collection Postman v2.1 valide DOIT :
- Avoir un objet `info` avec `name` et `schema`
- Avoir un array `item` (peut être vide)
- Respecter le schéma JSON : https://schema.getpostman.com/json/collection/v2.1.0/collection.json
- Utiliser un encodage UTF-8
- Être un JSON valide

## Compatibilité

- **Postman Desktop** : v9.0+
- **Postman Web** : Toutes versions récentes
- **Newman** : v5.0+
- **Postman API** : v1.0+

## Références

- [Postman Collection Format Documentation](https://learning.postman.com/collection-format/)
- [Collection SDK](https://www.postmanlabs.com/postman-collection/)
- [JSON Schema](https://schema.getpostman.com/json/collection/v2.1.0/collection.json)
