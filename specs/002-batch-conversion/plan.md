# Implementation Plan: Batch Conversion of Bruno Collections

**Branch**: `002-batch-conversion` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-batch-conversion/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement batch conversion capability to convert entire directories of Bruno request files into organized Postman collections. The system will recursively scan directories, parse bruno.json metadata files, preserve folder hierarchy up to unlimited nesting levels, collect errors gracefully, and generate comprehensive conversion reports. This extends the existing single-file converter (Phase 1) and benefits from the robust AST-based script conversion (Phase 2).

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**: Existing (commander, @babel/parser, jest) + NEW (fast-glob for directory scanning)
**Storage**: File system (read .bru files, write .json collection)
**Testing**: Jest with contract tests for file I/O, unit tests for parsers, integration tests for batch workflows
**Target Platform**: CLI tool for macOS/Linux/Windows
**Project Type**: Single project (CLI tooling)
**Performance Goals**: <100ms per file for average request, support 50+ files per collection
**Constraints**: Memory efficient (stream processing for large collections), graceful error handling (collect errors, continue processing)
**Scale/Scope**: Support collections with 100+ requests, 5+ nesting levels, handle invalid files gracefully

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

**✅ Code Quality First**
- Clear separation of concerns: DirectoryScanner, BrunoJsonParser, CollectionBuilder enhancement
- Single responsibility maintained for each service
- Type-safe interfaces for bruno.json schema and collection structure
- Consistent error handling patterns across modules

**✅ Test-Driven Development (NON-NEGOTIABLE)**
- Contract tests for file system operations (directory scanning, bruno.json parsing)
- Unit tests for metadata parsing, hierarchy building
- Integration tests for full batch conversion workflow
- E2E tests with complex directory structures (5+ levels, 20+ files)
- Coverage target: 80%+ for new batch conversion code

**✅ User Experience Consistency**
- Clear progress indication for batch operations
- Detailed error messages with file paths and line numbers
- Conversion reports in both human-readable and JSON formats
- Graceful handling of partial failures (convert what's valid, report what's invalid)
- Consistent CLI interface extending existing `convert` command

**✅ Performance Standards**
- Streaming approach for large collections (avoid loading all files in memory)
- Parallel file parsing where possible (Promise.all for independent files)
- <100ms per file processing time
- Memory usage capped at 500MB for 100+ file collections

**✅ Defensive Programming & Error Handling**
- Validate bruno.json schema before parsing
- Handle file system errors (permissions, symlinks, missing directories)
- Collect errors without halting entire batch process
- Atomic file writes (use temp file + rename)
- Clear error context (file path, parse error location, suggested fixes)

### Quality Gates

- [ ] All tests pass (unit, integration, contract)
- [ ] Code coverage ≥80% for batch conversion modules
- [ ] No linting violations (ESLint + Prettier)
- [ ] Performance benchmarks: <100ms per file, <500MB memory for 100 files
- [ ] Documentation updated (README, CLI help, examples)
- [ ] Error messages tested with real-world invalid inputs

**GATE STATUS**: ✅ PASS - No constitution violations. All principles can be satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/002-batch-conversion/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (directory scanning best practices, bruno.json schema)
├── data-model.md        # Phase 1 output (bruno.json schema, directory tree structure)
├── quickstart.md        # Phase 1 output (batch conversion examples)
└── contracts/           # Phase 1 output (bruno.json schema, conversion report format)
```

### Source Code (repository root)

```text
src/
├── models/
│   └── brunoCollection.types.ts    # NEW: bruno.json schema types
├── services/
│   ├── directoryScanner.ts         # NEW: recursive directory traversal
│   ├── brunoJsonParser.ts          # NEW: bruno.json metadata parser
│   └── fileService.ts              # EXISTING: used for reading files
├── builders/
│   └── collectionBuilder.ts        # ENHANCED: support nested folders
├── commands/
│   └── convertCommand.ts           # ENHANCED: detect directory vs file input
├── utils/
│   ├── pathUtils.ts                # EXISTING: path normalization
│   └── reportGenerator.ts          # NEW: batch conversion report formatting
└── cli.ts                          # EXISTING: entry point

tests/
├── contract/
│   ├── directoryScanner.test.ts    # NEW: file system contract tests
│   └── brunoJsonParser.test.ts     # NEW: bruno.json parsing tests
├── integration/
│   └── batchConversion.test.ts     # NEW: end-to-end batch workflows
└── unit/
    ├── services/
    │   └── brunoJsonParser.test.ts # NEW: unit tests for metadata parsing
    └── builders/
        └── collectionBuilder.test.ts # ENHANCED: nested folder tests

tests/fixtures/
└── batch-collections/              # NEW: test data
    ├── simple-collection/          # 5 files, 1 level
    ├── nested-collection/          # 20 files, 5 levels deep
    ├── with-bruno-json/            # has bruno.json metadata
    ├── invalid-files/              # mixed valid/invalid .bru files
    └── empty-directory/            # no .bru files
```

**Structure Decision**: Single project structure maintained. Batch conversion is a natural extension of the existing CLI tool, reusing most infrastructure (parsers, validators, converters). New modules are added to services/ and builders/ with clear separation of concerns.

## Complexity Tracking

> **No violations requiring justification**

This feature does not introduce any patterns that violate constitution principles. All complexity is justified by core requirements:
- Recursive directory scanning: Required for hierarchical collection support (AC2, AC3)
- bruno.json parsing: Required for metadata support (AC4)
- Error collection: Required for graceful failure handling (AC8)

## Development Phases

### Phase 0: Research (Output: research.md)

**Objective**: Resolve all technical unknowns and establish best practices

**Research Tasks**:

1. **Directory Scanning Best Practices**
   - Research: Fast, memory-efficient recursive directory traversal in Node.js
   - Evaluate: `fs.promises.readdir` recursive vs `fast-glob` vs `glob`
   - Decision criteria: Performance (speed + memory), API simplicity, error handling
   - Output: Recommended approach with justification

2. **bruno.json Schema Investigation**
   - Research: Bruno official schema for bruno.json (check Bruno repo/docs)
   - Document: All fields and their semantics (name, version, type, etc.)
   - Identify: Required vs optional fields, validation rules
   - Output: Complete schema definition with examples

3. **Postman Nested Folders Patterns**
   - Research: Postman Collection v2.1 schema for nested items
   - Validate: Unlimited nesting depth support
   - Document: Best practices for folder ordering and naming
   - Output: Validated approach with schema examples

4. **Error Collection Strategies**
   - Research: Patterns for collecting errors without halting execution
   - Evaluate: Error aggregation, context preservation, report formatting
   - Consider: Memory efficiency for large batches with many errors
   - Output: Error handling pattern with code examples

**Deliverable**: `research.md` with all decisions documented and unknowns resolved

### Phase 1: Design & Contracts (Output: data-model.md, contracts/, quickstart.md)

**Objective**: Define data structures, API contracts, and usage patterns

**Data Model (data-model.md)**:

1. **bruno.json Schema**
   - Entity: BrunoCollectionMetadata
   - Fields: name (string), version (string), type (enum)
   - Validation: name required, type must be "collection"
   - Source: Research Phase 0

2. **Directory Tree Structure**
   - Entity: FileTreeNode
   - Fields: path, name, type (file/directory), children
   - Relationships: Recursive parent-child hierarchy
   - Usage: Intermediate representation before Postman conversion

3. **Conversion Report**
   - Entity: BatchConversionReport
   - Fields: totalFiles, successCount, failureCount, errors[], warnings[]
   - Formats: Human-readable text + JSON
   - Usage: Final output of batch conversion

**API Contracts (contracts/)**:

1. **bruno.json Schema** (`contracts/bruno-json.schema.json`):
   ```json
   {
     "type": "object",
     "properties": {
       "name": { "type": "string" },
       "version": { "type": "string" },
       "type": { "type": "string", "enum": ["collection"] }
     },
     "required": ["name", "type"]
   }
   ```

2. **Conversion Report Format** (`contracts/batch-report.schema.json`):
   ```json
   {
     "success": true,
     "totalFiles": 15,
     "successCount": 12,
     "failureCount": 3,
     "outputPath": "/path/to/collection.json",
     "errors": [
       {
         "file": "invalid.bru",
         "error": "Parse error: Missing method",
         "line": 5
       }
     ],
     "warnings": [
       "bruno.json not found, using directory name"
     ]
   }
   ```

**Quickstart Guide (quickstart.md)**:

- Basic batch conversion example
- Conversion with custom collection name
- Using AST mode for complex scripts
- Reading conversion reports
- Common error scenarios and fixes

**Agent Context Update**:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

Add to agent context:
- fast-glob: Directory scanning library
- batch conversion patterns
- bruno.json metadata handling

**Deliverables**:
- `data-model.md` with complete entity definitions
- `contracts/bruno-json.schema.json` and `contracts/batch-report.schema.json`
- `quickstart.md` with practical examples

### Phase 2: Implementation Breakdown (Output: tasks.md via /speckit.tasks)

**Note**: This phase is executed by the `/speckit.tasks` command, not by `/speckit.plan`.

The task breakdown will follow this logical flow:

1. **Setup Tasks** (T001-T010):
   - Add fast-glob dependency
   - Create bruno.json type definitions
   - Setup test fixtures for batch conversion

2. **Test Tasks** (T011-T030):
   - Write contract tests for directory scanner
   - Write contract tests for bruno.json parser
   - Write integration tests for batch conversion
   - Write E2E tests with nested structures

3. **Core Implementation** (T031-T060):
   - Implement DirectoryScanner service
   - Implement BrunoJsonParser service
   - Enhance CollectionBuilder for nested folders
   - Update ConvertCommand to detect directory input

4. **Error Handling & Reporting** (T061-T070):
   - Implement error collection mechanism
   - Implement conversion report generator
   - Add progress indicators for batch operations

5. **Documentation & Polish** (T071-T080):
   - Update README with batch conversion examples
   - Update CLI help text
   - Add batch conversion to quickstart guide

## Key Implementation Decisions

### 1. Directory Scanning Approach

**Decision**: Use `fast-glob` library for recursive directory traversal

**Rationale**:
- Fast and memory-efficient (streaming-based)
- Built-in .gitignore support (respects ignore files)
- Simple glob patterns for filtering .bru files: `**/*.bru`
- Better performance than recursive `fs.readdir`

**Alternative Rejected**: `fs.promises.readdir` with recursion
- Reason: More complex to implement, no built-in filtering, potential memory issues

### 2. bruno.json Parsing Strategy

**Decision**: Validate schema, fallback gracefully, log warnings

**Flow**:
1. Check if bruno.json exists
2. If exists: Parse JSON, validate against schema
3. If invalid: Log warning, use directory name fallback
4. If not exists: Use directory name directly

**Error Handling**: Never fail the entire conversion due to invalid bruno.json

### 3. Collection Name Priority

**Decision**: CLI option → bruno.json → directory name

**Implementation**:
```typescript
function resolveCollectionName(
  cliName: string | undefined,
  brunoJsonName: string | undefined,
  directoryName: string
): string {
  return cliName ?? brunoJsonName ?? directoryName;
}
```

**Rationale**: Explicit user intent (CLI) overrides everything, metadata file second, sensible fallback last

### 4. Nested Folder Conversion

**Decision**: Recursive tree transformation: FileTree → Postman items

**Algorithm**:
```typescript
function buildPostmanItems(node: FileTreeNode): PostmanItem[] {
  if (node.type === 'file') {
    return [convertBrunoToPostmanItem(node)];
  } else {
    return [{
      name: node.name,
      item: node.children.flatMap(buildPostmanItems)
    }];
  }
}
```

**Rationale**: Clean recursive pattern matches both Bruno and Postman structures naturally

### 5. Error Collection Pattern

**Decision**: Collect errors in array, continue processing, report at end

**Implementation**:
```typescript
interface ConversionError {
  file: string;
  error: string;
  line?: number;
  context?: string;
}

async function batchConvert(files: string[]): Promise<BatchReport> {
  const errors: ConversionError[] = [];
  const items: PostmanItem[] = [];

  for (const file of files) {
    try {
      const item = await convertFile(file);
      items.push(item);
    } catch (err) {
      errors.push({
        file,
        error: err.message,
        line: err.line
      });
    }
  }

  return { items, errors };
}
```

**Rationale**: Maximizes successful conversions, provides complete error visibility

## Testing Strategy

### Contract Tests (File System)

**Scope**: Interactions with file system (reading directories, parsing files)

**Tests**:
1. DirectoryScanner reads .bru files recursively
2. DirectoryScanner ignores non-.bru files
3. DirectoryScanner handles empty directories
4. DirectoryScanner handles permission errors
5. BrunoJsonParser reads valid bruno.json
6. BrunoJsonParser handles missing bruno.json
7. BrunoJsonParser handles invalid JSON

**Fixtures**: Real directory structures in `tests/fixtures/batch-collections/`

### Unit Tests

**Scope**: Pure logic without I/O

**Tests**:
1. BrunoJsonParser validates schema
2. BrunoJsonParser extracts name/version
3. CollectionBuilder builds nested folder hierarchy
4. ReportGenerator formats reports (text + JSON)
5. Collection name resolution follows priority rules

### Integration Tests

**Scope**: End-to-end workflows combining multiple services

**Tests**:
1. Convert simple collection (5 files, flat structure)
2. Convert nested collection (20 files, 5 levels)
3. Convert with bruno.json metadata
4. Convert with invalid files (collect errors)
5. Convert empty directory (clear error message)
6. Convert with AST mode enabled

**Validation**: Generated collections validate against Postman schema v2.1

### E2E Tests

**Scope**: CLI invocation with real fixtures

**Tests**:
1. `bruno-to-postman convert ./fixtures/simple -o out.json`
2. `bruno-to-postman convert ./fixtures/nested -o out.json -v`
3. `bruno-to-postman convert ./fixtures/with-metadata -o out.json`
4. CLI exit codes (0 for success, 1 for errors)
5. Report output (human-readable vs JSON mode)

## Success Criteria

Feature is complete when:

- ✅ All 7 acceptance criteria from spec.md pass
- ✅ All tests pass with ≥80% coverage
- ✅ Performance benchmarks met (<100ms per file)
- ✅ Documentation complete (README, quickstart, CLI help)
- ✅ Error handling validated with edge cases
- ✅ Code review approved (constitution compliance)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large collections exceed memory | High | Stream processing, chunked writes |
| Bruno schema changes | Medium | Version detection, graceful fallback |
| File system race conditions | Low | Atomic writes with temp files |
| Infinite symlink loops | Low | Track visited paths, max depth limit |
| Invalid UTF-8 in files | Low | Try multiple encodings, clear error |

## Post-Implementation

After this feature is complete:

1. Monitor performance with real user collections (>50 files)
2. Collect feedback on error messages clarity
3. Consider optimizations: parallel parsing, caching
4. Plan Phase 4: Environment file conversion
