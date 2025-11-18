# Task Breakdown: Batch Conversion of Bruno Collections

**Feature**: 002-batch-conversion
**Branch**: `002-batch-conversion`
**Generated**: 2025-11-14

This document provides a detailed task breakdown for implementing User Story 3 - batch conversion of Bruno collections to Postman format.

---

## Overview

**Goal**: Enable conversion of entire directories of Bruno files into organized Postman collections with preserved hierarchy.

**Total Tasks**: 52
**Estimated Duration**: 3-4 days
**MVP Scope**: All 7 acceptance criteria (AC1-AC7) + AC8 for production quality

---

## Task Legend

- `- [ ]` Uncompleted task checkbox
- `[Txxx]` Sequential task ID
- `[P]` Parallelizable (can run with other [P] tasks in same phase)
- `[US3]` User Story 3 marker
- File paths indicate where code changes are needed

---

## Phase 1: Setup & Dependencies

**Goal**: Prepare project for batch conversion feature

- [ ] T001 Add glob dependency to package.json (already exists, verify version)
- [ ] T002 Create test fixture directories in tests/fixtures/batch-collections/
- [ ] T003 Create simple-collection fixture (5 flat .bru files)
- [ ] T004 Create nested-collection fixture (20 files, 5 levels deep)
- [ ] T005 Create with-bruno-json fixture (collection with bruno.json metadata)
- [ ] T006 Create invalid-files fixture (mixed valid/invalid .bru files)
- [ ] T007 Create empty-directory fixture (no .bru files)
- [ ] T008 Create brunoCollection.types.ts in src/types/ for bruno.json schema
- [ ] T009 Update .gitignore if needed (verify temp test outputs excluded)

---

## Phase 2: Core Services (Foundational)

**Goal**: Implement foundational services needed by all batch conversion features

### Directory Scanner Service

- [ ] T010 [P] Create directoryScanner.ts in src/services/
- [ ] T011 [P] Implement scanDirectory() function using glob with pattern **/*.bru
- [ ] T012 [P] Add error handling for permission errors and missing directories
- [ ] T013 [P] Add maxDepth limit (20 levels) and symlink protection (follow: false)

### bruno.json Parser Service

- [ ] T014 [P] Create brunoJsonParser.ts in src/services/
- [ ] T015 [P] Implement parseBrunoJson() with schema validation (version, name, type)
- [ ] T016 [P] Add fallback logic (CLI name > bruno.json > directory name)
- [ ] T017 [P] Handle missing/invalid bruno.json gracefully with warnings

### File Tree Builder

- [ ] T018 Create fileTreeBuilder.ts in src/utils/
- [ ] T019 Implement buildFileTree() to convert flat file list to hierarchical structure
- [ ] T020 Add sorting logic (alphabetical within folders)

---

## Phase 3: User Story 3 - Batch Conversion

**User Story**: Convert entire directories to Postman collections with hierarchy preservation

**Independent Test Criteria**: Can convert a directory with 20+ files and 3+ folder levels, output validates against Postman schema, hierarchy preserved exactly

### AC1: Basic Batch Conversion (5 files)

- [ ] T021 [US3] Enhance convertCommand.ts to detect directory vs file input (check fs.statSync)
- [ ] T022 [US3] Add directory conversion path in convertCommand that calls batch services
- [ ] T023 [US3] Integrate directoryScanner to get all .bru files from directory
- [ ] T024 [US3] Loop through files and call existing parseBrunoFile for each
- [ ] T025 [US3] Collect converted requests into array
- [ ] T026 [US3] Write integration test for simple-collection fixture (5 files, flat)

### AC2 & AC3: Hierarchical Structure (Multi-level)

- [ ] T027 [US3] Enhance collectionBuilder.ts to accept FileTreeNode instead of flat array
- [ ] T028 [US3] Implement recursive buildPostmanItems() that converts tree to nested items
- [ ] T029 [US3] Handle folders: create item-group with nested item array
- [ ] T030 [US3] Handle files: create request item at appropriate nesting level
- [ ] T031 [US3] Test with nested-collection fixture (20 files, 5 levels)
- [ ] T032 [US3] Validate Postman output preserves exact directory structure

### AC4 & AC5: bruno.json Support

- [ ] T033 [US3] In convertCommand, call parseBrunoJson before building collection
- [ ] T034 [US3] Pass resolved collection name to buildPostmanCollection
- [ ] T035 [US3] Add CLI option -n/--name for manual override
- [ ] T036 [US3] Implement priority resolution (CLI > bruno.json > directory)
- [ ] T037 [US3] Test with with-bruno-json fixture (name from metadata)
- [ ] T038 [US3] Test fallback with fixture missing bruno.json (directory name)

### AC6: Selective File Processing

- [ ] T039 [US3] Verify directoryScanner glob pattern only matches *.bru files
- [ ] T040 [US3] Test with fixture containing mixed file types (ignore non-.bru)

### AC7: Empty Directory Handling

- [ ] T041 [US3] Add validation in convertCommand: if scanDirectory returns empty array
- [ ] T042 [US3] Display clear error: "No .bru files found in <directory>"
- [ ] T043 [US3] Exit with code 1
- [ ] T044 [US3] Test with empty-directory fixture

### AC8: Error Collection and Reporting

- [ ] T045 [US3] Create batchReport.types.ts in src/types/ for report structures
- [ ] T046 [US3] Wrap each file conversion in try/catch, collect errors instead of failing
- [ ] T047 [US3] Implement BatchConversionReport with totalFiles, successCount, failureCount, errors[]
- [ ] T048 [US3] Create reportGenerator.ts in src/utils/ for formatting reports
- [ ] T049 [US3] Implement formatTextReport() for human-readable console output
- [ ] T050 [US3] Implement formatJsonReport() for --json mode
- [ ] T051 [US3] Display report after batch conversion completes
- [ ] T052 [US3] Test with invalid-files fixture (mixed valid/invalid, collect errors)

---

## Phase 4: Polish & Integration

**Goal**: Production-ready quality

- [ ] T053 [P] Add progress indicator using ora spinner for batch operations
- [ ] T054 [P] Update README.md with batch conversion examples
- [ ] T055 [P] Update CLI help text with directory conversion usage
- [ ] T056 [P] Add --force flag to skip overwrite confirmation
- [ ] T057 [P] Write E2E test: CLI invocation with nested-collection fixture
- [ ] T058 [P] Write E2E test: Verify exit code 0 for success, 1 for errors
- [ ] T059 [P] Run full test suite, verify ≥80% coverage for new code
- [ ] T060 [P] Run performance benchmark: 100 files should complete in <10 seconds

---

## Execution Strategy

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel after T001-T002
**Phase 2 (Services)**: T010-T013 || T014-T017 (two parallel tracks)
**Phase 3 (User Story)**:
- AC1, AC2/3, AC4/5, AC6, AC7 can start simultaneously if services complete
- AC8 depends on AC1-AC7 completion
**Phase 4 (Polish)**: All tasks T053-T060 can run in parallel

### Sequential Dependencies

```
T001-T009 (Setup)
  ↓
T010-T020 (Services) [Phase 2 blocks Phase 3]
  ↓
T021-T052 (User Story 3) [All ACs for MVP]
  ↓
T053-T060 (Polish)
```

### Implementation Approach

1. **Start with AC1** (T021-T026): Simplest case, validates end-to-end flow
2. **Add hierarchy** (T027-T032): Core value proposition
3. **Add metadata** (T033-T038): Production feature
4. **Handle edge cases** (T039-T044): Robustness
5. **Add reporting** (T045-T052): User experience
6. **Polish** (T053-T060): Production quality

---

## Testing Strategy

### Contract Tests (File System Interactions)

**Files**:
- `tests/contract/directoryScanner.test.ts`
- `tests/contract/brunoJsonParser.test.ts`

**Scenarios**:
1. Scan directory with .bru files recursively
2. Handle permission errors gracefully
3. Ignore non-.bru files
4. Parse valid bruno.json
5. Handle missing bruno.json (fallback)
6. Handle invalid bruno.json (fallback + warning)

### Integration Tests (Batch Workflows)

**File**: `tests/integration/batchConversion.test.ts`

**Scenarios**:
1. Convert simple collection (5 files flat)
2. Convert nested collection (20 files, 5 levels)
3. Convert with bruno.json metadata
4. Convert without bruno.json (directory name)
5. Handle invalid files (error collection)
6. Handle empty directory (clear error)

### E2E Tests (CLI Invocation)

**File**: `tests/integration/e2e-batch.test.ts`

**Scenarios**:
1. `bruno-to-postman convert ./fixtures/simple -o out.json`
2. `bruno-to-postman convert ./fixtures/nested -o out.json -v`
3. `bruno-to-postman convert ./fixtures/empty -o out.json` (should fail with exit code 1)
4. Verify generated collections validate against Postman schema v2.1

---

## Validation Checklist

Before marking feature complete:

- [ ] All 7 acceptance criteria (AC1-AC7) pass
- [ ] Error collection and reporting (AC8) works
- [ ] All integration tests pass
- [ ] E2E CLI tests pass
- [ ] Code coverage ≥80% for new batch code
- [ ] Performance: 100 files convert in <10 seconds
- [ ] Documentation updated (README, CLI help)
- [ ] No linting violations
- [ ] Constitution compliance verified

---

## Success Metrics

**Functionality**:
- ✅ Can convert directories with 50+ files
- ✅ Preserves 5+ level deep hierarchies
- ✅ Handles 95% of bruno.json variants
- ✅ Collects and reports all errors clearly

**Performance**:
- ✅ <100ms per file average
- ✅ 100 files in <10 seconds total
- ✅ Memory usage <500MB for 100 files

**Quality**:
- ✅ 80%+ code coverage
- ✅ All tests passing
- ✅ User-friendly error messages
- ✅ Complete documentation

---

## Notes

- **No TDD required**: Tests are integrated throughout but not written before implementation
- **Single user story**: All tasks contribute to User Story 3
- **Incremental delivery**: Each AC can be completed independently within the story
- **Reuse existing code**: Leverages Phase 1-2 infrastructure (single file conversion, AST parsing)
