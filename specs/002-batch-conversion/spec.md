# Feature Specification: Batch Conversion of Bruno Collections

**Feature Branch**: `002-batch-conversion`
**Created**: 2025-11-14
**Status**: Draft
**Parent Feature**: 001-bruno-to-postman (Phase 3)

## Overview

Implement batch conversion capability to convert entire directories of Bruno request files into organized Postman collections, preserving folder hierarchy and supporting bruno.json metadata files.

## User Story

**User Story 3 - Conversion en lot d'un dossier Bruno (Priority: P3)**

Un développeur souhaite convertir un dossier entier de requêtes Bruno en une collection Postman organisée, pour migrer tout un projet en une seule opération.

**Why this priority**: Cette fonctionnalité répond au besoin exprimé "convertir tous les fichiers bruno utilisé par les dev". Elle offre une vraie valeur pratique pour l'adoption en équipe. Placée en P3 après le support AST (P2), elle bénéficie d'une conversion de scripts robuste dès le départ pour les utilisateurs qui utilisent le flag --experimental-ast.

## Acceptance Criteria

### AC1: Basic Batch Conversion
**Given** un dossier contenant 5 fichiers Bruno
**When** l'utilisateur exécute la commande de conversion en lot
**Then** une collection Postman unique est créée contenant les 5 requêtes

### AC2: Hierarchical Structure Preservation
**Given** un dossier avec une structure hiérarchique (sous-dossiers)
**When** l'utilisateur exécute la commande de conversion
**Then** la hiérarchie est préservée dans la collection Postman (folders/sub-folders)

### AC3: Multi-level Hierarchy
**Given** une structure `mon-api/users/admin/get.bru` (3 niveaux)
**When** l'utilisateur exécute la commande de conversion
**Then** une collection nommée "mon-api" est créée avec folder "users" contenant sous-folder "admin" contenant la requête "get"

### AC4: bruno.json Metadata Support
**Given** un dossier contenant un fichier `bruno.json` avec les métadonnées de collection (nom: "My API", version: "v1.0")
**When** l'utilisateur exécute la commande de conversion en lot
**Then** la collection Postman générée utilise les métadonnées du fichier bruno.json (nom "My API") plutôt que le nom du dossier

### AC5: Fallback to Directory Name
**Given** un dossier sans fichier `bruno.json`
**When** l'utilisateur exécute la commande de conversion en lot
**Then** le système utilise le nom du dossier comme nom de collection Postman par défaut

### AC6: Selective File Processing
**Given** un dossier contenant des fichiers Bruno et d'autres types de fichiers
**When** l'utilisateur exécute la commande de conversion
**Then** seuls les fichiers .bru sont traités et les autres sont ignorés silencieusement

### AC7: Empty Directory Handling
**Given** un dossier vide ou sans fichiers .bru
**When** l'utilisateur exécute la commande de conversion
**Then** un message clair indique qu'aucun fichier Bruno n'a été trouvé

### AC8: Error Collection and Reporting
**Given** un dossier contenant des fichiers Bruno valides et invalides
**When** l'utilisateur exécute la conversion en batch
**Then** les fichiers valides sont convertis, les erreurs sont collectées, et un rapport détaillé est affiché

## CLI Interface

### Command Structure
```bash
# Convert directory to collection
bruno-to-postman convert <directory> -o <output.json> [options]

# With custom collection name
bruno-to-postman convert ./api-requests -o ./collection.json -n "My API"

# With AST parsing and verbose output
bruno-to-postman convert ./api-requests -o ./collection.json --experimental-ast -v
```

### Options (existing + new)
- `<directory>` - Path to Bruno collection directory (NEW: can be directory or file)
- `-o, --output <path>` - Output file path
- `-n, --name <name>` - Collection name (overrides bruno.json)
- `-v, --verbose` - Detailed logging
- `--json` - JSON output format
- `--experimental-ast` - Use AST-based script conversion
- `--force` (NEW) - Overwrite existing output file without prompt

### Priority Resolution for Collection Name
1. CLI option `-n/--name` (highest priority)
2. `bruno.json` name field (if valid)
3. Directory name (fallback)

## Technical Requirements

### Bruno Collection Structure
```
api-collection/
├── bruno.json          # Optional: collection metadata
├── users/
│   ├── get-users.bru
│   ├── create-user.bru
│   └── admin/
│       └── delete-user.bru
└── products/
    ├── list-products.bru
    └── details.bru
```

### bruno.json Schema
```json
{
  "name": "My API Collection",
  "version": "1.0.0",
  "type": "collection"
}
```

**Parsing Rules:**
- Parse `name`, `version`, `type` fields only
- Ignore other fields (configuration, scripts, etc.)
- If invalid/corrupted: log warning and use directory name fallback

### Postman Output Structure
```json
{
  "info": {
    "name": "My API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "users",
      "item": [
        { "name": "get-users", "request": {...} },
        { "name": "create-user", "request": {...} },
        {
          "name": "admin",
          "item": [
            { "name": "delete-user", "request": {...} }
          ]
        }
      ]
    },
    {
      "name": "products",
      "item": [
        { "name": "list-products", "request": {...} },
        { "name": "details", "request": {...} }
      ]
    }
  ]
}
```

## Implementation Phases

### Phase 1: Directory Scanning
- Implement recursive directory traversal
- Filter .bru files
- Build file tree structure
- Handle symlinks and permissions errors

### Phase 2: bruno.json Parser
- Parse bruno.json metadata
- Validate schema
- Handle missing/invalid files gracefully
- Implement fallback logic

### Phase 3: Collection Builder Enhancement
- Extend existing collectionBuilder to support nested folders
- Convert file tree to Postman item hierarchy
- Preserve request order
- Handle name conflicts

### Phase 4: Batch Command
- Create batch conversion command
- Implement progress reporting
- Add error collection
- Generate conversion report

### Phase 5: Testing
- Unit tests for directory scanner
- Unit tests for bruno.json parser
- Integration tests for batch conversion
- E2E tests with complex directory structures

## Edge Cases

1. **Invalid bruno.json**: Log warning, use directory name
2. **Empty directories**: Skip silently or warn if no .bru found
3. **File system errors**: Collect and report in final summary
4. **Duplicate names**: Append number suffix (e.g., "request", "request-1")
5. **Deep nesting**: Support unlimited depth (Postman supports it)
6. **Mixed content**: Ignore non-.bru files silently
7. **Circular symlinks**: Detect and skip with warning
8. **Large collections**: Stream processing for memory efficiency

## Success Metrics

- ✅ Can convert directories with 50+ files
- ✅ Preserves 5+ level deep hierarchies
- ✅ Handles 95% of bruno.json variants
- ✅ Reports all errors clearly
- ✅ Performance: <100ms per file for avg request

## Non-Goals (Future Work)

- Collection splitting (one collection per subfolder)
- Selective file filtering (--include/--exclude patterns)
- Incremental updates (detect changes, update only modified)
- Collection merging (merge into existing collection)
