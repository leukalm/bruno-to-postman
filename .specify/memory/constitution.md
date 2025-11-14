# Bruno to Postman Converter Constitution

<!--
Version: 1.0.0 → 1.0.0
Modified Principles: N/A (Initial version)
Added Sections: All sections (Initial version)
Removed Sections: None
Templates Updated:
  ✅ plan-template.md - Constitution Check section aligned
  ✅ spec-template.md - Requirements and success criteria sections aligned
  ✅ tasks-template.md - Task categorization and testing discipline aligned
  ✅ agent-file-template.md - No updates needed (no constitution references)
  ✅ checklist-template.md - No updates needed (no constitution references)
Follow-up TODOs: None
-->

## Core Principles

### I. Code Quality First

Code MUST be maintainable, readable, and follow established patterns. Every piece of code written must:

- Use clear, descriptive names for variables, functions, and types
- Follow single responsibility principle - functions do one thing well
- Include inline comments for complex logic or non-obvious decisions
- Maintain consistent formatting and style throughout the codebase
- Avoid code duplication through proper abstraction
- Keep functions small and focused (prefer <50 lines)
- Use type safety where available (static typing preferred)

**Rationale**: Quality code reduces bugs, speeds up onboarding, and makes maintenance sustainable. Technical debt from poor code quality compounds exponentially and becomes increasingly expensive to fix.

### II. Test-Driven Development (NON-NEGOTIABLE)

Testing is mandatory before implementation. The test-first workflow MUST be followed:

1. Write tests that capture requirements and acceptance criteria
2. Get user/stakeholder approval on test scenarios
3. Verify tests fail (red state)
4. Implement minimal code to make tests pass (green state)
5. Refactor while keeping tests green

**Test Coverage Requirements**:
- All public APIs and functions MUST have unit tests
- Critical user journeys MUST have integration tests
- Contract tests MUST exist for all external interfaces (file I/O, APIs)
- Minimum 80% code coverage for core logic
- Edge cases and error paths MUST be explicitly tested

**Rationale**: Tests are living documentation and the safety net that enables confident refactoring. Writing tests first ensures we build what's needed, not what's easy. The TDD cycle catches design issues early when they're cheap to fix.

### III. User Experience Consistency

All user-facing features MUST provide a consistent, intuitive experience:

- Error messages MUST be clear, actionable, and user-friendly (not just stack traces)
- Success feedback MUST be explicit and confirmatory
- Progress indication MUST be provided for operations >2 seconds
- Input validation MUST happen early with helpful guidance
- Documentation MUST include real-world examples and common use cases
- CLI output MUST support both human-readable and machine-parseable formats (e.g., JSON)
- Default behaviors MUST be safe and sensible for most users

**Rationale**: Consistency reduces cognitive load and builds user trust. Every inconsistency is a friction point that degrades the user experience and increases support burden.

### IV. Performance Standards

Performance is a feature, not an afterthought. All implementations MUST meet these standards:

- File conversion operations MUST complete in <5 seconds for files up to 10MB
- Memory usage MUST stay under 500MB for typical workloads
- Startup time MUST be <1 second for CLI invocation
- Batch operations MUST support streaming/chunking for large datasets
- Performance-critical paths MUST be profiled and optimized
- Resource cleanup MUST be explicit (no memory leaks)

**Performance Degradation Policy**:
- Any change that degrades performance by >10% MUST be justified and documented
- Performance regressions MUST be caught in CI before merge
- Optimization work MUST be driven by profiling data, not assumptions

**Rationale**: Users abandon slow tools. Performance issues compound at scale and are harder to fix after launch. Proactive performance management prevents user churn and technical debt.

### V. Defensive Programming & Error Handling

Code MUST anticipate and handle failure gracefully:

- All external inputs MUST be validated (file paths, user data, environment variables)
- Error conditions MUST be explicitly handled (no bare try/catch blocks)
- Failures MUST preserve data integrity (atomic operations where possible)
- Errors MUST be logged with sufficient context for debugging
- Recovery paths MUST be provided where feasible
- Assumptions MUST be validated with assertions in development mode

**Error Message Requirements**:
- State what went wrong in plain language
- Explain why it happened if known
- Suggest concrete next steps to resolve
- Include relevant context (file names, line numbers, etc.)

**Rationale**: Production systems encounter unexpected conditions. Defensive programming turns crashes into recoverable errors and reduces mean time to resolution when issues occur.

## Quality Gates

All code changes MUST pass these gates before merge:

### Pre-Merge Checklist

- [ ] All tests pass (unit, integration, contract)
- [ ] Code coverage meets 80% threshold for modified code
- [ ] No linting or formatting violations
- [ ] Performance benchmarks show no >10% regression
- [ ] User-facing changes have updated documentation
- [ ] Breaking changes are documented in migration guide
- [ ] Error messages are user-friendly and actionable
- [ ] Edge cases have explicit tests

### Code Review Requirements

- All PRs MUST be reviewed by at least one other developer
- Reviewers MUST verify constitution compliance
- Reviewers MUST validate test quality, not just presence
- Reviewers MUST question complexity and suggest simpler alternatives
- Security implications MUST be explicitly considered
- Performance impact MUST be assessed for critical paths

## Development Standards

### Documentation Requirements

- Every public function/class MUST have documentation describing:
  - Purpose and behavior
  - Parameters and return values
  - Example usage
  - Error conditions and exceptions
- README MUST be kept current with:
  - Installation instructions
  - Quick start guide
  - Common use cases
  - Troubleshooting section
- Architecture decisions MUST be documented in ADR format

### Version Control Practices

- Commits MUST have clear, descriptive messages following conventional commits format
- Commit messages MUST explain WHY, not just WHAT
- Branches MUST follow naming convention: `feature/`, `fix/`, `refactor/`
- No force pushes to main/master branch
- Rebase before merge to maintain linear history (optional, team preference)

### Dependency Management

- Dependencies MUST be pinned to specific versions
- Dependency updates MUST be tested before merge
- Security vulnerabilities in dependencies MUST be addressed within 7 days
- Deprecated dependencies MUST be replaced proactively

## Governance

**Authority**: This constitution is the authoritative source for all development practices in this project. When practices conflict with this document, the constitution takes precedence.

**Amendment Procedure**:
1. Proposed changes MUST be documented in a PR
2. Team MUST review and discuss impacts
3. Approval requires consensus from maintainers
4. Migration plan MUST be provided for breaking changes
5. Version number MUST be updated following semantic versioning
6. All dependent templates MUST be updated to maintain consistency

**Compliance**:
- All PRs MUST be checked against constitution principles
- Violations MUST be justified and documented if approved
- Patterns that violate principles require explicit exception approval
- Constitution compliance is part of code review criteria

**Versioning Policy**:
- MAJOR: Backward-incompatible changes to core principles or removal of principles
- MINOR: Addition of new principles or sections, material expansions to existing guidance
- PATCH: Clarifications, wording improvements, typo fixes, non-semantic changes

**Review Cycle**: This constitution MUST be reviewed quarterly to ensure it remains relevant and practical as the project evolves.

**Version**: 1.0.0 | **Ratified**: 2025-11-14 | **Last Amended**: 2025-11-14
