# Implementation Plan: Convertisseur Bruno vers Postman

**Branch**: `001-bruno-to-postman` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bruno-to-postman/spec.md`

## Summary

Développer un outil CLI en TypeScript permettant de convertir des fichiers de requêtes REST Bruno (.bru) vers le format de collection Postman v2.1. L'outil doit supporter la conversion de fichiers individuels (MVP - Phase 1) et de dossiers entiers avec hiérarchie (Phase 2), préserver les variables d'environnement, et fournir des messages d'erreur clairs en **anglais** pour une distribution open source internationale. La solution utilisera des parsers personnalisés pour le format Bruno et des générateurs JSON pour le format Postman, avec un focus sur la performance (<2s pour 1 fichier, <10s pour 50 fichiers).

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 18+

**Primary Dependencies**:
- `commander` (CLI argument parsing)
- `chalk` (colored terminal output)
- `ora` (progress spinners)
- `zod` (runtime type validation)
- `glob` (file pattern matching)

**Storage**: File system (read .bru files, write .json files)

**Testing**: Jest with ts-jest for unit/integration tests

**Target Platform**: Cross-platform CLI (macOS, Linux, Windows via Node.js)

**Project Type**: Single CLI project

**Performance Goals**:
- <2 seconds for single file conversion
- <10 seconds for 50 files
- <1 second CLI startup time
- <500MB memory for typical workloads

**Constraints**:
- UTF-8 file encoding only
- Postman Collection v2.1 format compliance
- **All user-facing messages in English** (for international open source distribution)
- Zero external API dependencies (pure local processing)

**Scale/Scope**:
- Target: 1-1000 Bruno files per conversion
- File size: Up to 10MB per file
- Typical collection: 10-100 requests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Code Quality First
- TypeScript provides strong type safety (static typing)
- Will use clear naming conventions and single responsibility principle
- Functions will be kept small (<50 lines)
- ESLint + Prettier for consistent formatting

### ✅ Test-Driven Development (NON-NEGOTIABLE)
- Jest test suite with 80%+ coverage target
- Unit tests for parsers and converters
- Integration tests for CLI commands
- Contract tests for file I/O operations
- TDD workflow: write tests → fail → implement → pass → refactor

### ✅ User Experience Consistency
- CLI with clear, actionable error messages in English
- Progress indicators for operations >2s (using `ora`)
- Input validation with helpful guidance
- Both human-readable and JSON output modes supported
- Consistent command structure and options

### ✅ Performance Standards
- Meets all requirements: <2s single file, <10s for 50 files, <1s startup
- Streaming approach for batch operations
- No memory leaks (explicit cleanup, no circular references)
- Will profile critical paths if performance issues arise

### ✅ Defensive Programming & Error Handling
- All file paths validated before use
- Explicit error handling with try/catch blocks
- Zod schemas for runtime validation
- English error messages with context and next steps
- Graceful degradation for unsupported features

### 🟢 ALL GATES PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/001-bruno-to-postman/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Format research
├── data-model.md        # Phase 1: Type definitions
├── quickstart.md        # Phase 1: User guide
├── contracts/           # Phase 1: File format schemas
│   ├── bruno-format.md
│   └── postman-format.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── bruno.types.ts       # Bruno file format types
│   ├── postman.types.ts     # Postman collection types
│   └── cli.types.ts         # CLI option types
├── parsers/
│   ├── brunoParser.ts       # Parse .bru files
│   └── envParser.ts         # Parse Bruno env files
├── converters/
│   ├── requestConverter.ts  # Convert request data
│   ├── collectionBuilder.ts # Build Postman collection
│   ├── scriptConverter.ts   # Convert bru.* → pm.* scripts
│   └── envConverter.ts      # Convert environment vars
├── validators/
│   ├── brunoValidator.ts    # Validate Bruno format
│   └── postmanValidator.ts  # Validate Postman output
├── services/
│   ├── fileService.ts       # File I/O operations
│   ├── batchProcessor.ts    # Batch conversion logic
│   └── logger.ts            # Logging and English messages
├── cli/
│   ├── commands/
│   │   ├── convert.ts       # Convert single file command
│   │   └── batch.ts         # Batch convert command
│   └── index.ts             # CLI entry point
├── utils/
│   ├── errorMessages.ts     # English error message templates
│   └── pathUtils.ts         # Path manipulation
└── index.ts                 # Package entry point

tests/
├── fixtures/
│   ├── bruno/               # Sample .bru files
│   └── postman/             # Expected outputs
├── unit/
│   ├── parsers/
│   ├── converters/
│   └── validators/
├── integration/
│   ├── singleFile.test.ts
│   ├── batchConversion.test.ts
│   └── errorHandling.test.ts
└── contract/
    ├── brunoFormat.test.ts
    └── postmanFormat.test.ts
```

**Structure Decision**: Single CLI project structure chosen because this is a standalone command-line tool with no frontend, backend, or API components. All functionality is self-contained within a single Node.js application. The structure follows standard TypeScript CLI patterns with clear separation of concerns: types, parsers, converters, validators, services, and CLI interface.

## Development Phases

### Phase 1 (MVP): Single File Conversion

**Goal**: Convert one .bru file → one Postman collection with single request

**Deliverables**:
- `bruno-to-postman convert <file.bru> -o <output.json>`
- Basic parser for .bru format
- Converter for standard requests (GET, POST, PUT, DELETE)
- Script conversion (best-effort with English warnings)
- English CLI messages
- Basic error handling

### Phase 2: Batch Conversion with Hierarchy

**Goal**: Convert directory → Postman collection with folders

**Deliverables**:
- `bruno-to-postman batch <directory> -o <output.json>`
- Hierarchical folder mapping (level 1 = collection name, level 2+ = folders)
- Error recovery (continue on parse errors, collect all errors)
- Detailed conversion report (English, human-readable + JSON modes)

### Phase 3: Environment Support

**Goal**: Convert Bruno environments → Postman environments

**Deliverables**:
- `--env` flag to include environment conversion
- Multiple environment file support (dev, staging, prod)

## Key Implementation Decisions

### 1. Script Conversion Strategy (Most Complex Challenge)

**Decision**: Best-effort conversion with English warning comments

- Map common API calls: `bru.setVar()` → `pm.environment.set()`
- For unmappable constructions: insert `// WARNING: partial conversion - review manually`
- CLI displays English warning listing files with partial conversions
- Success metric: 80%+ automatic conversion rate

### 2. Directory Hierarchy Mapping

**Decision**: Unlimited nested folder support

- Level 1 directory = Postman collection name
- Level 2+ directories = nested Postman folders (no limit)
- Preserves complete organizational structure

### 3. Error Handling in Batch Mode

**Decision**: Continue on errors + detailed report

- Parse all files, skip invalid ones
- Collect all errors with file names and reasons
- Final report shows successes + failures
- Enables partial migration success

### 4. File Overwrite Behavior

**Decision**: Interactive confirmation with --force bypass

- Prompt (English): "File already exists. Overwrite? (y/n)"
- `--force` flag bypasses prompt for CI/CD
- Safe by default, automatable when needed

### 5. Output Formats

**Decision**: Dual format support

- Default: Human-readable English output with colors/symbols
- `--json`: Structured JSON for CI/CD integration

### 6. Internationalization

**Decision**: English-only for global open source distribution

- All CLI messages, prompts, errors in English
- Comments inserted in scripts in English
- Maximizes global accessibility
- Simplifies maintenance (single language)

## Complexity Tracking

> **No violations detected - this section intentionally left empty**

All constitution principles respected, no complexity justifications needed.
