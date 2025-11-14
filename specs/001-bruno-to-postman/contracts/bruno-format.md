# Contract: Format de fichier Bruno (.bru)

**Version**: 1.0
**Format**: Text-based (Bru format)
**Extension**: `.bru`
**Encoding**: UTF-8

## Description

Les fichiers Bruno utilisent un format texte personnalisé appelé "Bru" pour définir des requêtes HTTP. Chaque fichier représente une seule requête.

## Structure du fichier

Un fichier .bru est composé de sections délimitées par des accolades. Chaque section commence par un mot-clé suivi d'une accolade ouvrante et se termine par une accolade fermante.

### Sections disponibles

| Section | Obligatoire | Description |
|---------|-------------|-------------|
| `meta` | ✅ | Métadonnées de la requête |
| `get/post/put/delete/patch/head/options` | ✅ | Méthode HTTP et URL |
| `headers` | ❌ | En-têtes HTTP |
| `params:query` | ❌ | Paramètres de query string |
| `params:path` | ❌ | Variables de chemin d'URL |
| `body:json` | ❌ | Corps JSON |
| `body:xml` | ❌ | Corps XML |
| `body:text` | ❌ | Corps texte brut |
| `body:form-urlencoded` | ❌ | Corps form-urlencoded |
| `body:multipart` | ❌ | Corps multipart/form-data |
| `auth:basic` | ❌ | Authentification Basic |
| `auth:bearer` | ❌ | Authentification Bearer Token |
| `auth:apikey` | ❌ | Authentification API Key |
| `script:pre-request` | ❌ | Script JavaScript pré-requête |
| `tests` | ❌ | Script JavaScript de tests |
| `docs` | ❌ | Documentation |

## Exemples

### Requête GET simple

```bru
meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
  body: none
  auth: none
}
```

### Requête POST avec headers et body JSON

```bru
meta {
  name: Create User
  type: http
  seq: 2
}

post {
  url: https://api.example.com/users
  body: json
  auth: bearer
}

headers {
  Content-Type: application/json
  Accept: application/json
}

auth:bearer {
  token: {{authToken}}
}

body:json {
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Requête avec query parameters et variables

```bru
meta {
  name: Search Users
  type: http
  seq: 3
}

get {
  url: {{baseUrl}}/api/users
  body: none
  auth: none
}

params:query {
  search: john
  page: 1
  limit: 10
}
```

### Requête avec scripts

```bru
meta {
  name: Get User Profile
  type: http
  seq: 4
}

get {
  url: {{baseUrl}}/api/users/{{userId}}
  body: none
  auth: bearer
}

auth:bearer {
  token: {{token}}
}

script:pre-request {
  // Set timestamp variable
  bru.setVar("timestamp", Date.now().toString());

  // Log request
  console.log("Fetching user profile...");
}

tests {
  // Test status code
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });

  // Test response body
  test("Response has user data", function() {
    expect(res.body).to.have.property("id");
    expect(res.body).to.have.property("name");
  });

  // Save user ID
  bru.setVar("currentUserId", res.body.id);
}
```

### Requête avec form-data

```bru
meta {
  name: Upload File
  type: http
  seq: 5
}

post {
  url: {{baseUrl}}/api/upload
  body: multipart-form
  auth: bearer
}

auth:bearer {
  token: {{token}}
}

body:multipart-form {
  file: @file(/path/to/file.pdf)
  description: Important document
  category: reports
}
```

## Syntaxe des variables

Les variables sont définies avec la syntaxe `{{variableName}}` et peuvent être utilisées partout :
- Dans les URLs
- Dans les headers
- Dans les query parameters
- Dans les bodies
- Dans les scripts

## API des scripts

### Pre-request scripts (bru.*)

```javascript
// Définir une variable
bru.setVar("name", "value");

// Récupérer une variable
const value = bru.getVar("name");

// Supprimer une variable
bru.deleteVar("name");

// Définir une variable d'environnement
bru.setEnvVar("name", "value");

// Récupérer une variable d'environnement
const envValue = bru.getEnvVar("name");
```

### Test scripts

```javascript
// Tests
test("Description", function() {
  expect(res.status).to.equal(200);
});

// Assertions disponibles
expect(res.status).to.equal(200);
expect(res.body).to.have.property("key");
expect(res.headers["content-type"]).to.contain("json");
expect(res.time).to.be.below(1000);

// Accès à la réponse
res.status      // HTTP status code
res.body        // Response body (parsed if JSON)
res.headers     // Response headers object
res.time        // Response time in ms
```

## Format des fichiers d'environnement

Les environnements Bruno sont stockés dans `environments/*.bru` :

```bru
vars {
  baseUrl: https://api.example.com
  authToken: abc123xyz
  timeout: 5000
}

vars:secret {
  apiKey: secret-key-value
}
```

## Règles de parsing

1. **Sections** : Identifiées par mot-clé + accolades
2. **Propriétés** : Format `key: value` sur une ligne
3. **Corps multiligne** : Contenu entre accolades de section body
4. **Commentaires** : `//` pour les scripts JavaScript uniquement
5. **Espaces** : Ignorés avant et après les `:` dans les propriétés
6. **Lignes vides** : Ignorées
7. **Encodage** : UTF-8 obligatoire

## Validation

Un fichier .bru valide DOIT :
- Contenir une section `meta` avec au moins `name` et `type`
- Contenir exactement une section de méthode HTTP (get/post/put/delete/patch/head/options)
- Avoir des accolades équilibrées
- Utiliser un encodage UTF-8
- Avoir l'extension `.bru`

Un fichier .bru valide PEUT :
- Avoir ou non des sections optionnelles
- Utiliser des variables `{{var}}`
- Contenir des scripts JavaScript
- Définir plusieurs types de body (un seul sera utilisé selon la section spécifiée dans la méthode)

## Edge cases

1. **Caractères spéciaux** : Les accolades `{}` dans les valeurs doivent être considérées comme littérales si pas en début de ligne
2. **Variables non définies** : `{{undefinedVar}}` reste tel quel dans la sortie
3. **JSON invalide** : Le parser ne valide pas le JSON du body, c'est la responsabilité de l'utilisateur
4. **Scripts avec erreurs** : Les erreurs de syntaxe JavaScript sont ignorées lors du parsing, mais seront visibles à l'exécution
