# Tasks: Bruno to Postman Converter

**Feature**: 001-bruno-to-postman
**Generated**: 2025-11-14
**Status**: Ready for implementation

## Task Organization

Tasks are organized by phase and user story:
- **Phase 1**: Project setup and tooling
- **Phase 2**: Foundational code (blocking prerequisites)
- **Phase 3**: User Story 1 (P1) - Single file conversion
- **Phase 4**: User Story 2 (P2) - Batch conversion with hierarchy
- **Phase 5**: User Story 3 (P3) - Environment support
- **Final Phase**: Polish, documentation, and release prep

**Legend**:
- `[P]` = Parallelizable (can be done concurrently with other [P] tasks in same phase)
- `[US1]` / `[US2]` / `[US3]` = User Story 1/2/3
- File paths indicate where implementation goes

---

## Phase 1: Project Setup

**Goal**: Initialize project structure, dependencies, and tooling

- [x] T001 [P] Initialize TypeScript project with tsconfig.json in project root, targeting ES2022, strict mode enabled, and output to dist/
- [x] T002 [P] Create package.json with project metadata (name: bruno-to-postman, version: 1.0.0, type: module, engines: node >=18.0.0)
- [x] T003 [P] Install core dependencies: commander@11+, chalk@5+, ora@7+, zod@3+, glob@10+
- [x] T004 [P] Install dev dependencies: typescript@5.3+, @types/node, jest@29+, ts-jest, eslint, prettier
- [x] T005 Configure Jest with ts-jest in jest.config.js (testEnvironment: node, coverage threshold 80%, ignore node_modules and dist)
- [x] T006 Configure ESLint and Prettier in .eslintrc.json and .prettierrc with TypeScript rules
- [x] T007 Create project directory structure: src/types/, src/parsers/, src/converters/, src/validators/, src/services/, src/cli/, src/utils/, tests/fixtures/, tests/unit/, tests/integration/, tests/contract/
- [x] T008 [P] Add npm scripts to package.json: build (tsc), test (jest), lint (eslint), format (prettier), dev (ts-node)
- [x] T009 [P] Create .gitignore with node_modules/, dist/, coverage/, *.log, .env
- [x] T010 Create README.md with project description, installation instructions, and basic usage examples in English

---

## Phase 2: Foundational Code (Blocking Prerequisites)

**Goal**: Build core types, validators, and utilities needed by all features

### Type Definitions (TDD: Define schemas first)

- [x] T011 [P] Create src/types/bruno.types.ts with BrunoRequest, BrunoMeta, BrunoHeader, BrunoQueryParam, BrunoBody, BrunoAuth interfaces and Zod schemas
- [x] T012 [P] Create src/types/postman.types.ts with PostmanCollection, PostmanInfo, PostmanItem, PostmanRequest, PostmanUrl, PostmanBody, PostmanAuth, PostmanEvent interfaces and Zod schemas
- [x] T013 [P] Create src/types/cli.types.ts with ConvertOptions, BatchConvertOptions, ConversionResult, ConversionError, ConversionWarning interfaces and Zod schemas
- [x] T014 [P] Create src/types/index.ts to export all types from bruno.types, postman.types, and cli.types

### Error Messages (English)

- [x] T015 Write src/utils/errorMessages.ts with English message templates: INVALID_BRU_FILE, FILE_NOT_FOUND, PARSE_ERROR, VALIDATION_ERROR, WRITE_ERROR, PERMISSION_DENIED, UNSUPPORTED_FEATURE

### Utilities

- [x] T016 [P] Write tests/unit/utils/pathUtils.test.ts with test cases for path normalization, extension checking, directory validation
- [x] T017 [P] Implement src/utils/pathUtils.ts with functions: normalizePath(path: string), getFileExtension(path: string), isValidDirectory(path: string), ensureDirectoryExists(path: string)

### Logging Service

- [x] T018 Write tests/unit/services/logger.test.ts with test cases for info, warn, error, success messages in English, and JSON output mode
- [x] T019 Implement src/services/logger.ts with Logger class supporting human-readable English output (with chalk colors) and JSON output mode

### File I/O Service

- [x] T020 Write tests/contract/fileService.test.ts with test cases for reading .bru files, writing .json files, handling UTF-8 encoding, permission errors
- [x] T021 Implement src/services/fileService.ts with functions: readFile(path: string), writeFile(path: string, content: string), fileExists(path: string), using fs/promises

---

## Phase 3: User Story 1 (P1) - Single File Conversion

**Goal**: MVP - Convert one .bru file to one Postman collection with single request

**User Story**: A developer wants to convert a single Bruno request file to Postman format

**Acceptance**: Given a valid .bru file, when user runs convert command, then a valid Postman JSON is created with correct method, URL, headers, body

### Bruno Parser (Core TDD)

- [ ] T022 [US1] Create tests/fixtures/bruno/simple-get.bru with minimal GET request (meta + get sections)
- [ ] T023 [US1] Create tests/fixtures/bruno/post-with-body.bru with POST request including headers and JSON body
- [ ] T024 [US1] Create tests/fixtures/bruno/with-variables.bru with request containing {{baseUrl}} and {{token}} variables
- [ ] T025 [US1] Write tests/unit/parsers/brunoParser.test.ts with test cases: parse simple GET, parse POST with JSON body, parse headers, parse query params, parse variables, handle invalid files, handle missing meta section
- [ ] T026 [US1] Implement src/parsers/brunoParser.ts with parseBrunoFile(content: string): BrunoRequest function using state machine approach (states: IDLE, IN_META, IN_METHOD, IN_HEADERS, IN_BODY, etc.)
- [ ] T027 [US1] Add section parsers in src/parsers/brunoParser.ts: parseMetaSection(), parseMethodSection(), parseHeadersSection(), parseQueryParamsSection(), parseBodySection()
- [ ] T028 [US1] Add authentication parsing in src/parsers/brunoParser.ts: parseAuthSection() supporting basic, bearer, apikey

### Bruno Validator

- [ ] T029 [US1] Write tests/unit/validators/brunoValidator.test.ts with test cases for validating parsed Bruno requests against BrunoRequestSchema
- [ ] T030 [US1] Implement src/validators/brunoValidator.ts with validateBrunoRequest(request: unknown): BrunoRequest function using Zod validation

### URL Parser Utility

- [ ] T031 [US1] Write tests/unit/utils/urlParser.test.ts with test cases: parse simple URL, parse URL with {{variables}}, extract protocol/host/path, parse query params, handle path variables
- [ ] T032 [US1] Implement src/utils/urlParser.ts with parseUrl(rawUrl: string): ParsedUrl function that decomposes URL into Postman format components

### Request Converter

- [ ] T033 [US1] Create tests/fixtures/postman/expected-simple-get.json with expected Postman output for simple-get.bru
- [ ] T034 [US1] Create tests/fixtures/postman/expected-post-with-body.json with expected Postman output for post-with-body.bru
- [ ] T035 [US1] Write tests/unit/converters/requestConverter.test.ts with test cases: convert GET request, convert POST with body, convert headers, convert query params, preserve variables
- [ ] T036 [US1] Implement src/converters/requestConverter.ts with convertBrunoToPostmanRequest(bruno: BrunoRequest): PostmanRequest function
- [ ] T037 [US1] Implement body conversion in src/converters/requestConverter.ts: convertBody(brunoBody: BrunoBody): PostmanBody supporting json, xml, text, form-urlencoded modes
- [ ] T038 [US1] Implement auth conversion in src/converters/requestConverter.ts: convertAuth(brunoAuth: BrunoAuth): PostmanAuth supporting basic, bearer, apikey

### Script Converter (Best-effort with warnings)

- [ ] T039 [US1] Write tests/unit/converters/scriptConverter.test.ts with test cases: convert bru.setVar to pm.environment.set, convert bru.getVar to pm.environment.get, handle unmappable code with WARNING comments, convert test() calls, preserve expect() assertions
- [ ] T040 [US1] Implement src/converters/scriptConverter.ts with convertPreRequestScript(brunoScript: string): { script: string[], warnings: string[] }
- [ ] T041 [US1] Implement test script conversion in src/converters/scriptConverter.ts: convertTestScript(brunoScript: string): { script: string[], warnings: string[] }
- [ ] T042 [US1] Add API mapping table in src/converters/scriptConverter.ts: map bru.* calls to pm.* equivalents, insert English `// WARNING: partial conversion - review manually` comments for unmappable code

### Collection Builder

- [ ] T043 [US1] Write tests/unit/converters/collectionBuilder.test.ts with test cases: build collection with single request, set collection name, generate valid info section with schema URL, include variables
- [ ] T044 [US1] Implement src/converters/collectionBuilder.ts with buildPostmanCollection(name: string, requests: PostmanRequest[]): PostmanCollection
- [ ] T045 [US1] Add UUID generation for _postman_id in src/converters/collectionBuilder.ts using crypto.randomUUID()

### Postman Validator

- [ ] T046 [US1] Write tests/unit/validators/postmanValidator.test.ts with test cases for validating generated Postman collections against PostmanCollectionSchema
- [ ] T047 [US1] Implement src/validators/postmanValidator.ts with validatePostmanCollection(collection: unknown): PostmanCollection using Zod validation

### CLI - Convert Command (Single File)

- [ ] T048 [US1] Write tests/integration/singleFile.test.ts with end-to-end test: read fixture .bru, run convert, verify output JSON matches expected, check file is written to disk
- [ ] T049 [US1] Implement src/cli/commands/convert.ts with convertCommand(inputPath: string, options: ConvertOptions) function
- [ ] T050 [US1] Add file validation in src/cli/commands/convert.ts: check input file exists, check .bru extension, check output path is writable
- [ ] T051 [US1] Add file overwrite logic in src/cli/commands/convert.ts: if output exists and not --force, show English prompt "File exists. Overwrite? (y/n)", wait for user input
- [ ] T052 [US1] Implement conversion pipeline in src/cli/commands/convert.ts: readFile → parseBrunoFile → validateBrunoRequest → convertToPostmanRequest → buildCollection → validatePostmanCollection → writeFile
- [ ] T053 [US1] Add error handling in src/cli/commands/convert.ts: wrap in try/catch, use English error messages from errorMessages.ts, show actionable suggestions
- [ ] T054 [US1] Add success reporting in src/cli/commands/convert.ts: show "✓ Conversion successful" with English summary (requests converted, duration, output path)

### CLI - Main Entry Point

- [ ] T055 [US1] Implement src/cli/index.ts with commander setup: define convert command, parse arguments (input, --output, --name, --force, --json, --verbose), set version
- [ ] T056 [US1] Wire convert command in src/cli/index.ts to call convertCommand from src/cli/commands/convert.ts
- [ ] T057 [US1] Add global error handler in src/cli/index.ts: catch unhandled errors, show English error message, exit with code 1
- [ ] T058 [US1] Create src/index.ts as package entry point exporting CLI and optionally parser/converter functions for programmatic use

### CLI Binary Setup

- [ ] T059 [US1] Create bin/bruno-to-postman.js with shebang #!/usr/bin/env node and import from dist/cli/index.js
- [ ] T060 [US1] Add bin field to package.json pointing to bin/bruno-to-postman.js
- [ ] T061 [US1] Test CLI binary locally with npm link, run bruno-to-postman convert tests/fixtures/bruno/simple-get.bru -o test-output.json

### Integration Tests for US1

- [ ] T062 [US1] Write tests/integration/errorHandling.test.ts with test cases: invalid .bru file shows English error, missing file shows English error, permission denied shows English error, output exists without --force prompts user
- [ ] T063 [US1] Add test in tests/integration/singleFile.test.ts for --verbose flag showing detailed English logs
- [ ] T064 [US1] Add test in tests/integration/singleFile.test.ts for --json flag outputting structured JSON result

### US1 Validation

- [ ] T065 [US1] Run full test suite: npm test, verify 80%+ coverage, all tests passing
- [ ] T066 [US1] Manual acceptance testing: convert real Bruno file from Bruno app, import generated JSON into Postman desktop, verify request works correctly
- [ ] T067 [US1] Performance test: convert single file <2 seconds (SC-001)

---

## Phase 4: User Story 2 (P2) - Batch Conversion with Hierarchy

**Goal**: Convert directory of .bru files to Postman collection with nested folders

**User Story**: A developer wants to convert a folder of Bruno requests to a single organized Postman collection

**Acceptance**: Given a directory with subdirectories, when user runs batch command, then a collection is created with level 1 = collection name, level 2+ = nested folders

### Batch File Discovery

- [ ] T068 [US2] Create tests/fixtures/bruno/batch-collection/ directory with structure: users/get.bru, users/admin/list.bru, products/list.bru (3 levels deep)
- [ ] T069 [US2] Write tests/unit/services/batchProcessor.test.ts with test cases: discover all .bru files in directory, ignore non-.bru files, respect --recursive flag, build hierarchy tree
- [ ] T070 [US2] Implement src/services/batchProcessor.ts with discoverBrunoFiles(rootPath: string, recursive: boolean): FileSystemEntry[] using glob package
- [ ] T071 [US2] Implement hierarchy building in src/services/batchProcessor.ts: buildHierarchy(files: FileSystemEntry[], rootPath: string): BrunoCollectionItem[] to create tree structure

### Collection Builder Enhancement for Folders

- [ ] T072 [US2] Write tests/unit/converters/collectionBuilder.test.ts with additional test cases: build collection with nested folders, preserve folder hierarchy unlimited depth, level 1 = collection name, level 2+ = PostmanItem folders
- [ ] T073 [US2] Enhance src/converters/collectionBuilder.ts with buildPostmanCollectionFromHierarchy(name: string, hierarchy: BrunoCollectionItem[]): PostmanCollection
- [ ] T074 [US2] Implement recursive folder conversion in src/converters/collectionBuilder.ts: convertItemToPostman(item: BrunoCollectionItem): PostmanItem supporting both request and folder types

### Batch Processing Logic

- [ ] T075 [US2] Write tests/unit/services/batchProcessor.test.ts with additional test cases: process multiple files in parallel (max 10 concurrent), collect errors for invalid files, continue on errors
- [ ] T076 [US2] Implement src/services/batchProcessor.ts with processBatch(files: FileSystemEntry[], options: BatchConvertOptions): Promise<ConversionResult> using Promise.all with chunking
- [ ] T077 [US2] Add error recovery in src/services/batchProcessor.ts: wrap each file conversion in try/catch, collect errors with file path and reason, continue processing remaining files
- [ ] T078 [US2] Add progress reporting in src/services/batchProcessor.ts: use ora spinner, update with "Processing X/Y files..." in English

### CLI - Batch Command

- [ ] T079 [US2] Implement src/cli/commands/batch.ts with batchCommand(inputPath: string, options: BatchConvertOptions)
- [ ] T080 [US2] Add directory validation in src/cli/commands/batch.ts: check input is directory, check directory exists, check directory readable
- [ ] T081 [US2] Add collection naming logic in src/cli/commands/batch.ts: if --name provided use it, else use level 1 directory name as collection name
- [ ] T082 [US2] Implement batch pipeline in src/cli/commands/batch.ts: discoverFiles → buildHierarchy → processBatch → buildCollectionFromHierarchy → validateCollection → writeFile
- [ ] T083 [US2] Add detailed English report in src/cli/commands/batch.ts: show total files found, successful conversions, failed conversions with reasons, warnings for partial script conversions, duration

### Report Formatting

- [ ] T084 [US2] Write tests/unit/services/logger.test.ts with additional test cases: format human-readable English report with colors/symbols, format JSON report with all data
- [ ] T085 [US2] Implement report formatting in src/services/logger.ts: formatBatchReport(result: ConversionResult, jsonMode: boolean): string
- [ ] T086 [US2] Add color-coded output in src/services/logger.ts: green ✓ for success, red ✗ for errors, yellow ⚠ for warnings in human-readable mode

### CLI Integration

- [ ] T087 [US2] Wire batch command in src/cli/index.ts: add batch subcommand with same options as convert plus --recursive
- [ ] T088 [US2] Update help text in src/cli/index.ts with English descriptions and examples for batch command

### Integration Tests for US2

- [ ] T089 [US2] Write tests/integration/batchConversion.test.ts with test cases: convert directory with 3-level hierarchy, verify folder structure in output, verify all requests present
- [ ] T090 [US2] Add test in tests/integration/batchConversion.test.ts: directory with some invalid .bru files continues and reports errors in English
- [ ] T091 [US2] Add test in tests/integration/batchConversion.test.ts: --json flag outputs structured batch report
- [ ] T092 [US2] Create tests/fixtures/postman/expected-batch-collection.json with expected output for batch-collection/ fixture

### US2 Validation

- [ ] T093 [US2] Run full test suite: npm test, verify 80%+ coverage maintained
- [ ] T094 [US2] Manual acceptance testing: convert real Bruno directory with multiple levels, import into Postman, verify folder hierarchy matches
- [ ] T095 [US2] Performance test: convert 50 files <10 seconds (SC-003)

---

## Phase 5: User Story 3 (P3) - Environment Support

**Goal**: Convert Bruno environment files to Postman environment format

**User Story**: A developer wants to export Bruno environments (dev, staging, prod) to Postman environment files

**Acceptance**: Given Bruno environment files, when user runs convert --env, then Postman environment JSON files are created with all variables

### Environment Parser

- [ ] T096 [US3] Create tests/fixtures/bruno/environments/dev.bru with vars and vars:secret sections
- [ ] T097 [US3] Create tests/fixtures/bruno/environments/prod.bru with different variable values
- [ ] T098 [US3] Write tests/unit/parsers/envParser.test.ts with test cases: parse vars section, parse vars:secret section, handle multiple environments, extract key-value pairs
- [ ] T099 [US3] Implement src/parsers/envParser.ts with parseBrunoEnv(content: string, envName: string): BrunoEnvironment function
- [ ] T100 [US3] Add section parsing in src/parsers/envParser.ts: parseVarsSection(), parseSecretVarsSection()

### Environment Converter

- [ ] T101 [US3] Create tests/fixtures/postman/expected-dev-environment.json with expected Postman environment format
- [ ] T102 [US3] Write tests/unit/converters/envConverter.test.ts with test cases: convert variables to Postman format, mark secret variables with type: 'secret', set enabled: true, add metadata fields
- [ ] T103 [US3] Implement src/converters/envConverter.ts with convertBrunoEnvToPostman(brunoEnv: BrunoEnvironment): PostmanEnvironment
- [ ] T104 [US3] Add metadata generation in src/converters/envConverter.ts: set _postman_variable_scope: 'environment', _postman_exported_at: current ISO date, _postman_exported_using: 'bruno-to-postman/1.0.0'

### Environment Discovery

- [ ] T105 [US3] Write tests/unit/services/batchProcessor.test.ts with additional test cases: discover environment files in environments/ directory, extract environment names from filenames
- [ ] T106 [US3] Implement environment discovery in src/services/batchProcessor.ts: discoverEnvironments(rootPath: string): string[] function looking for environments/*.bru

### CLI Enhancement for Environments

- [ ] T107 [US3] Update src/cli/commands/convert.ts and batch.ts: add --env flag handling, discover and convert environments if flag present
- [ ] T108 [US3] Add environment conversion pipeline in src/cli/commands/batch.ts: discoverEnvironments → parseEnv → convertEnv → writeEnvironmentFile for each environment
- [ ] T109 [US3] Update English success message in src/cli/commands/batch.ts to list environment files created

### Integration Tests for US3

- [ ] T110 [US3] Write tests/integration/environmentConversion.test.ts with test cases: convert environments with --env flag, verify multiple .postman_environment.json files created, verify variables present
- [ ] T111 [US3] Add test in tests/integration/environmentConversion.test.ts: environments in subdirectory are discovered correctly

### US3 Validation

- [ ] T112 [US3] Run full test suite: npm test, verify 80%+ coverage maintained
- [ ] T113 [US3] Manual acceptance testing: convert Bruno environments, import into Postman, verify variables work correctly in requests
- [ ] T114 [US3] Verify SC-007: 100% of variables converted correctly

---

## Final Phase: Polish, Documentation, and Release Prep

**Goal**: Finalize documentation, examples, CI/CD, and prepare for open source release

### Documentation

- [ ] T115 [P] Update README.md with complete installation instructions, usage examples, CLI reference, troubleshooting section in English
- [ ] T116 [P] Create CONTRIBUTING.md with contribution guidelines, code standards, PR process in English
- [ ] T117 [P] Create LICENSE file (choose MIT, Apache 2.0, or other open source license)
- [ ] T118 [P] Add CHANGELOG.md with v1.0.0 release notes listing all features in English
- [ ] T119 Update quickstart guide in specs/001-bruno-to-postman/quickstart.md with actual CLI examples tested against implementation

### Example Files

- [ ] T120 [P] Create examples/ directory with sample-bruno-collection/ containing realistic .bru files for demo
- [ ] T121 [P] Add examples/README.md with English instructions on running examples and expected output

### CI/CD

- [ ] T122 Create .github/workflows/test.yml with GitHub Actions workflow: run tests on Node 18, 20, 22 on push and PR
- [ ] T123 Add .github/workflows/release.yml with automated npm publish on tag push (requires npm token secret)

### Performance Optimization

- [ ] T124 Profile conversion of 50 files, ensure <10s target met (SC-003), optimize if needed
- [ ] T125 Check memory usage with large files (5-10MB), ensure <500MB total (performance goal)
- [ ] T126 Verify CLI startup time <1s (performance goal)

### Final Testing

- [ ] T127 Run npm run lint and fix all linting errors
- [ ] T128 Run npm run format to ensure consistent code style
- [ ] T129 Generate test coverage report: npm test -- --coverage, verify ≥80% coverage (SC-008 implies high quality through testing)
- [ ] T130 Test on all target platforms: macOS, Linux, Windows (via Node.js cross-platform compatibility)

### Contract Testing

- [ ] T131 Write tests/contract/brunoFormat.test.ts with test cases validating parser handles all Bruno format edge cases from contracts/bruno-format.md
- [ ] T132 Write tests/contract/postmanFormat.test.ts with test cases validating generated JSON matches Postman v2.1 schema from contracts/postman-format.md
- [ ] T133 Add schema validation test in tests/contract/postmanFormat.test.ts: fetch official Postman schema, validate generated collections against it

### Success Criteria Validation

- [ ] T134 Validate SC-001: Single file conversion <2s
- [ ] T135 Validate SC-002: 100% of standard requests (GET, POST, PUT, DELETE) convert without data loss
- [ ] T136 Validate SC-003: 50 files convert <10s
- [ ] T137 Validate SC-004: Test import of generated collection into Postman Desktop v9.0+, verify 95%+ import without errors
- [ ] T138 Validate SC-005: User testing - do English error messages allow 90% self-service problem resolution?
- [ ] T139 Validate SC-006: Folder hierarchy preserved at 100% (manual verification of multi-level examples)
- [ ] T140 Validate SC-007: 100% of variables converted correctly
- [ ] T141 Validate SC-008: ≥80% of scripts auto-converted, 100% of partial conversions have English WARNING comments

### Package Preparation

- [ ] T142 Set package.json version to 1.0.0, verify all fields correct (description, keywords, repository, author, license)
- [ ] T143 Test npm pack, inspect tarball contents, ensure only necessary files included (use .npmignore if needed)
- [ ] T144 Create .npmignore to exclude tests/, specs/, .github/, examples/ from published package

### Pre-Release Checklist

- [ ] T145 Verify all acceptance criteria from spec.md are met for US1, US2, US3
- [ ] T146 Review all English user-facing messages for clarity, consistency, actionability
- [ ] T147 Run full test suite one final time: npm test
- [ ] T148 Perform end-to-end manual test: convert real-world Bruno collection, import to Postman, execute requests successfully
- [ ] T149 Tag release in git: git tag v1.0.0, prepare for npm publish

---

## Task Summary

**Total Tasks**: 149
**Phase 1 (Setup)**: 10 tasks
**Phase 2 (Foundational)**: 11 tasks
**Phase 3 (US1 - P1)**: 46 tasks
**Phase 4 (US2 - P2)**: 28 tasks
**Phase 5 (US3 - P3)**: 19 tasks
**Final Phase (Polish)**: 35 tasks

**Parallelizable Tasks**: 23 tasks marked with [P]

**Estimated Timeline** (based on 1 developer):
- Phase 1: 1-2 days
- Phase 2: 2-3 days
- Phase 3: 5-7 days (MVP)
- Phase 4: 4-5 days
- Phase 5: 2-3 days
- Final: 3-4 days
**Total**: ~18-24 days (3-4 weeks)

---

## Dependencies Graph (Key Blocking Tasks)

```
T001-T010 (Setup) → All subsequent tasks
T011-T014 (Types) → All implementation tasks
T015 (Error Messages) → All CLI and service tasks
T022-T028 (Parser) → T033-T038 (Converter)
T033-T038 (Converter) → T043-T045 (Collection Builder)
T043-T045 (Collection Builder) → T048-T054 (CLI)
T048-T054 (CLI US1) → T062-T067 (US1 Validation)
T065-T067 (US1 Complete) → T068-T095 (US2 start)
T093-T095 (US2 Complete) → T096-T114 (US3 start)
T112-T114 (US3 Complete) → T115-T149 (Final Phase)
```

---

## Notes for Implementation

1. **TDD Workflow**: For each feature, write tests first (test files listed before implementation files in task order). Verify tests fail (red), implement code to pass (green), then refactor.

2. **English Messages**: All user-facing output must be in English per FR-009, FR-015, FR-016, SC-005. Use templates from src/utils/errorMessages.ts.

3. **Script Conversion**: Target 80% automatic conversion (SC-008). Insert `// WARNING: partial conversion - review manually` in English for unmappable code.

4. **Performance**: Monitor during development. Phase 3 tasks must meet <2s for single file, Phase 4 must meet <10s for 50 files.

5. **Parallelization**: Tasks marked [P] can be worked on concurrently if multiple developers available, or tackled in any order within their phase.

6. **Constitution Compliance**: Maintain 80%+ test coverage throughout. Follow defensive programming practices (input validation, error handling). Keep functions <50 lines where possible.
