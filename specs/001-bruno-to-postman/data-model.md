# Data Model: Types TypeScript

**Date**: 2025-11-14
**Phase**: 1 - Design
**Status**: Complete

## Vue d'ensemble

Ce document définit les types TypeScript qui représentent les structures de données pour les formats Bruno et Postman, ainsi que les types internes utilisés pour la conversion.

## Types Bruno (bruno.types.ts)

### BrunoRequest

Représente une requête HTTP complète parsée depuis un fichier .bru.

```typescript
interface BrunoRequest {
  meta: BrunoMeta;
  method: HttpMethod;
  url: string;
  headers: BrunoHeader[];
  queryParams: BrunoQueryParam[];
  pathParams: BrunoPathParam[];
  body?: BrunoBody;
  auth?: BrunoAuth;
  preRequestScript?: string;
  testScript?: string;
  docs?: string;
}

interface BrunoMeta {
  name: string;
  type: 'http' | 'graphql';
  seq?: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

interface BrunoHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface BrunoQueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

interface BrunoPathParam {
  key: string;
  value: string;
}

interface BrunoBody {
  mode: 'json' | 'xml' | 'text' | 'multipart' | 'form-urlencoded' | 'none';
  content: string;
  formData?: FormDataEntry[];
}

interface FormDataEntry {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

interface BrunoAuth {
  type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2';
  basic?: {
    username: string;
    password: string;
  };
  bearer?: {
    token: string;
  };
  apikey?: {
    key: string;
    value: string;
    in: 'header' | 'query';
  };
}
```

### BrunoEnvironment

Représente un fichier d'environnement Bruno.

```typescript
interface BrunoEnvironment {
  name: string;
  variables: BrunoVariable[];
}

interface BrunoVariable {
  key: string;
  value: string;
  enabled: boolean;
  type: 'text' | 'secret';
}
```

### BrunoCollection

Représente une structure de collection Bruno (dossier de fichiers).

```typescript
interface BrunoCollection {
  name: string;
  items: BrunoCollectionItem[];
}

interface BrunoCollectionItem {
  type: 'request' | 'folder';
  name: string;
  path: string; // File system path
  request?: BrunoRequest; // If type is 'request'
  items?: BrunoCollectionItem[]; // If type is 'folder'
}
```

## Types Postman (postman.types.ts)

### PostmanCollection

Représente une collection Postman v2.1 complète.

```typescript
interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}

interface PostmanInfo {
  name: string;
  _postman_id?: string;
  description?: string;
  schema: string; // "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  version?: string;
}

interface PostmanItem {
  name: string;
  description?: string;
  item?: PostmanItem[]; // For folders
  request?: PostmanRequest; // For requests
  event?: PostmanEvent[];
  protocolProfileBehavior?: Record<string, any>;
}

interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  url: PostmanUrl | string;
  body?: PostmanBody;
  auth?: PostmanAuth;
  description?: string;
}

interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  port?: string;
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanPathVariable[];
  hash?: string;
}

interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanPathVariable {
  key: string;
  value: string;
  description?: string;
}

interface PostmanBody {
  mode: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql';
  raw?: string;
  urlencoded?: PostmanKeyValue[];
  formdata?: PostmanFormData[];
  file?: {
    src: string;
  };
  options?: {
    raw?: {
      language?: 'json' | 'xml' | 'html' | 'text' | 'javascript';
    };
  };
}

interface PostmanKeyValue {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanFormData {
  key: string;
  value?: string;
  src?: string;
  type: 'text' | 'file';
  disabled?: boolean;
  description?: string;
}

interface PostmanAuth {
  type: 'noauth' | 'basic' | 'bearer' | 'apikey' | 'oauth2' | 'awsv4' | 'digest' | 'hawk';
  basic?: Array<{ key: string; value: string; type: string }>;
  bearer?: Array<{ key: string; value: string; type: string }>;
  apikey?: Array<{ key: string; value: string; type: string }>;
}

interface PostmanEvent {
  listen: 'prerequest' | 'test';
  script: PostmanScript;
}

interface PostmanScript {
  type: 'text/javascript';
  exec: string[];
  id?: string;
}

interface PostmanVariable {
  key: string;
  value: string;
  type?: 'string' | 'boolean' | 'any' | 'number';
  disabled?: boolean;
}
```

### PostmanEnvironment

Représente un environnement Postman.

```typescript
interface PostmanEnvironment {
  id?: string;
  name: string;
  values: PostmanEnvironmentValue[];
  _postman_variable_scope: 'environment';
  _postman_exported_at: string; // ISO date
  _postman_exported_using: string; // Tool version
}

interface PostmanEnvironmentValue {
  key: string;
  value: string;
  enabled: boolean;
  type?: 'default' | 'secret';
}
```

## Types CLI (cli.types.ts)

### ConvertOptions

Options pour la commande de conversion.

```typescript
interface ConvertOptions {
  input: string; // File or directory path
  output: string; // Output file path
  collectionName?: string; // Custom collection name
  includeEnv: boolean; // Include environment conversion
  verbose: boolean; // Verbose logging
  json: boolean; // JSON output format
  force: boolean; // Overwrite existing files
}

interface BatchConvertOptions extends ConvertOptions {
  recursive: boolean; // Process subdirectories
  concurrency: number; // Max concurrent conversions
}
```

### ConversionResult

Résultat d'une conversion.

```typescript
interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  requestsConverted: number;
  errors: ConversionError[];
  warnings: ConversionWarning[];
  duration: number; // milliseconds
}

interface ConversionError {
  type: 'parse' | 'validation' | 'conversion' | 'filesystem';
  file?: string;
  line?: number;
  message: string;
  details?: string;
}

interface ConversionWarning {
  type: 'unsupported-feature' | 'data-loss' | 'compatibility';
  file?: string;
  message: string;
  suggestion?: string;
}
```

## Types Utilitaires

### ParsedUrl

URL décomposée pour faciliter la conversion.

```typescript
interface ParsedUrl {
  raw: string;
  protocol?: string;
  host: string[];
  port?: string;
  path: string[];
  query: Array<{ key: string; value: string }>;
  variables: string[]; // List of {{variable}} found
  hash?: string;
}
```

### FileSystemEntry

Entrée du système de fichiers pour le parcours de dossiers.

```typescript
interface FileSystemEntry {
  type: 'file' | 'directory';
  name: string;
  path: string; // Absolute path
  relativePath: string; // Relative to root
  extension?: string;
}
```

## Schémas Zod

Tous ces types seront accompagnés de schémas Zod pour la validation runtime :

```typescript
// bruno.types.ts
import { z } from 'zod';

export const BrunoRequestSchema = z.object({
  meta: z.object({
    name: z.string(),
    type: z.enum(['http', 'graphql']),
    seq: z.number().optional(),
  }),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  url: z.string().url(),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string(),
    enabled: z.boolean(),
  })),
  // ... etc
});

// Infer TypeScript type from Zod schema
export type BrunoRequest = z.infer<typeof BrunoRequestSchema>;
```

## Relations entre entités

```
BrunoCollection
  └── items: BrunoCollectionItem[]
        ├── type: 'folder' → items: BrunoCollectionItem[] (recursif)
        └── type: 'request' → request: BrunoRequest

BrunoRequest
  ├── meta: BrunoMeta
  ├── method: HttpMethod
  ├── headers: BrunoHeader[]
  ├── queryParams: BrunoQueryParam[]
  ├── body: BrunoBody
  └── auth: BrunoAuth

PostmanCollection
  ├── info: PostmanInfo
  ├── item: PostmanItem[]
  │     ├── type folder → item: PostmanItem[] (recursif)
  │     └── type request → request: PostmanRequest
  └── variable: PostmanVariable[]

PostmanRequest
  ├── method: string
  ├── url: PostmanUrl
  ├── header: PostmanHeader[]
  ├── body: PostmanBody
  └── event: PostmanEvent[]
```

## Validation des contraintes

Les schémas Zod incluront des validations pour :

1. **Formats d'URL** : Validation avec `z.string().url()` ou regex personnalisé pour supporter les variables `{{var}}`
2. **Méthodes HTTP** : Enum stricte des méthodes supportées
3. **Types de body** : Validation selon le mode (ex: JSON valide pour mode 'json')
4. **Chemins de fichiers** : Validation de l'existence et des permissions
5. **Noms de variables** : Format alphanumérique + underscore
6. **Scripts JavaScript** : Validation syntaxique basique (optionnel)

## Migration de données

Le processus de conversion suit ce flux :

```
.bru file (text)
  → Parser
  → BrunoRequest (validated)
  → Converter
  → PostmanRequest (validated)
  → Collection Builder
  → PostmanCollection (validated)
  → JSON Serializer
  → .json file
```

Chaque étape valide les données pour assurer l'intégrité.
