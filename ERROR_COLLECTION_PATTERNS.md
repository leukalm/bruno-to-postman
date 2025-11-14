# Error Collection Patterns for Batch Processing in Node.js/TypeScript

## Overview
This document provides research-backed patterns for collecting, managing, and reporting errors during batch file processing (50+ files). These patterns are designed to handle partial failures, preserve context, manage memory efficiently, and provide clear user feedback.

---

## 1. Error Collection Strategies

### 1.1 Strategy Comparison

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **Try/Catch + Array Accumulation** | Simple, sequential, full control | Blocks on each error, slower | Small batches, order matters |
| **Promise.allSettled** | Parallel execution, guaranteed completion | Memory overhead with many errors | Medium-large batches (50-500) |
| **Queue-based (p-queue, bull)** | Handles concurrency limits, backpressure | Complex setup, overkill for simple cases | Very large batches (1000+), rate limiting |
| **Streaming + Error Collection** | Memory efficient, handles unbounded streams | Complex implementation | Extremely large batches (10000+) |
| **Hybrid (allSettled + Chunking)** | Balanced performance/memory | Moderate complexity | Production batch processing |

### 1.2 Recommended Pattern: Hybrid Approach with allSettled + Chunking

```typescript
/**
 * Process files in controlled chunks with Promise.allSettled
 * Handles 50+ files efficiently while managing memory
 */
async function batchProcessWithChunking<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  options: {
    chunkSize?: number;
    maxErrors?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<{
  succeeded: T[];
  failed: Map<T, Error>;
  stoppedEarly: boolean;
}> {
  const chunkSize = options.chunkSize ?? 10; // Process 10 files concurrently
  const maxErrors = options.maxErrors ?? Infinity;

  const succeeded: T[] = [];
  const failed = new Map<T, Error>();

  for (let i = 0; i < items.length; i += chunkSize) {
    // Stop if error limit reached
    if (failed.size >= maxErrors) {
      return {
        succeeded,
        failed,
        stoppedEarly: true,
      };
    }

    const chunk = items.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map(item => processor(item).then(() => ({ item, success: true })))
    );

    // Process results
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const item = chunk[j];

      if (result.status === 'fulfilled') {
        succeeded.push(item);
      } else {
        failed.set(item, result.reason);
      }
    }

    // Report progress
    options.onProgress?.(succeeded.length + failed.size, items.length);
  }

  return { succeeded, failed, stoppedEarly: false };
}
```

---

## 2. Context Preservation Per Error

### 2.1 TypeScript Error Context Interface

```typescript
/**
 * Rich error context captured during batch processing
 */
export interface ProcessingError {
  // Identification
  id: string; // UUID for error correlation
  timestamp: Date;

  // File/Item Context
  filePath: string;
  relativePath?: string;
  fileName: string;

  // Error Classification
  type: 'parse' | 'validation' | 'conversion' | 'filesystem' | 'unknown';
  severity: 'error' | 'warning';

  // Error Details
  message: string;
  stack?: string;

  // Location Information
  line?: number;
  column?: number;
  context?: {
    snippet?: string; // Show surrounding code
    errorMarker?: string; // Visual marker
  };

  // Additional Context
  duration?: number; // Time spent on this file (ms)
  attemptNumber?: number;
  phase?: 'read' | 'parse' | 'validate' | 'convert' | 'write';

  // Recovery Metadata
  isRecoverable: boolean;
  suggestion?: string;
  alternative?: string;
}

/**
 * Batch error report with summary
 */
export interface BatchErrorReport {
  timestamp: Date;
  totalFiles: number;
  successful: number;
  failed: number;
  warnings: number;

  errors: ProcessingError[];

  // Summary statistics
  errorsByType: Record<ProcessingError['type'], number>;
  errorsByPhase: Record<ProcessingError['phase'], number>;

  // Overall status
  partialSuccess: boolean;
  stoppedEarly: boolean;
  stopReason?: string;
}
```

### 2.2 Error Context Capture Pattern

```typescript
/**
 * Capture rich context when an error occurs
 */
function captureErrorContext(
  error: unknown,
  context: {
    filePath: string;
    phase: 'read' | 'parse' | 'validate' | 'convert' | 'write';
    attemptNumber?: number;
    duration?: number;
  }
): ProcessingError {
  const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let message = 'Unknown error';
  let stack: string | undefined;
  let type: ProcessingError['type'] = 'unknown';

  if (error instanceof SyntaxError) {
    type = 'parse';
    message = error.message;
    stack = error.stack;
  } else if (error instanceof Error) {
    message = error.message;
    stack = error.stack;

    // Classify based on message
    if (message.includes('ENOENT') || message.includes('not found')) {
      type = 'filesystem';
    } else if (message.includes('validation') || message.includes('invalid')) {
      type = 'validation';
    } else if (message.includes('convert')) {
      type = 'conversion';
    }
  } else {
    message = String(error);
  }

  const fileName = path.basename(context.filePath);

  return {
    id,
    timestamp: new Date(),
    filePath: context.filePath,
    fileName,
    type,
    severity: 'error',
    message,
    stack,
    phase: context.phase,
    duration: context.duration,
    attemptNumber: context.attemptNumber,
    isRecoverable: isRecoverableError(error),
    suggestion: getSuggestion(type, message),
  };
}

function isRecoverableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Recoverable: validation errors, unsupported features
    // Not recoverable: filesystem permission, disk full, out of memory
    return !(
      msg.includes('EACCES') ||
      msg.includes('ENOSPC') ||
      msg.includes('out of memory')
    );
  }
  return false;
}

function getSuggestion(type: ProcessingError['type'], message: string): string {
  switch (type) {
    case 'parse':
      return 'Verify file follows Bruno format specification';
    case 'validation':
      return 'Fix validation errors and retry conversion';
    case 'filesystem':
      return 'Check file permissions and disk space';
    case 'conversion':
      return 'Some features may require manual adjustment in Postman';
    default:
      return 'Check error details and contact support if issue persists';
  }
}
```

---

## 3. Memory Efficiency

### 3.1 Memory Management Strategies

| Technique | Memory Impact | Complexity | When to Use |
|-----------|---------------|-----------|------------|
| **Error Count Limit** | O(n) with cap | Very low | Always (safety net) |
| **Sampling** | O(log n) | Low | 1000+ errors |
| **Compression** | O(n) reduced | Medium | Very large batches |
| **Streaming Report** | O(1) | High | Extremely large batches |

### 3.2 Memory-Efficient Error Collector

```typescript
/**
 * Memory-efficient error collector with configurable limits
 */
export class ErrorCollector {
  private errors: ProcessingError[] = [];
  private errorsByType: Map<string, number> = new Map();
  private totalProcessed: number = 0;
  private totalFailed: number = 0;

  constructor(
    private maxErrors: number = 1000,
    private maxMemoryMB: number = 256
  ) {}

  /**
   * Add error with memory check
   */
  addError(error: ProcessingError): boolean {
    // Check if we've hit error limit
    if (this.errors.length >= this.maxErrors) {
      this.totalFailed++;
      return false; // Error not stored, but counted
    }

    // Check approximate memory usage
    const currentMemory = this.estimateMemoryUsage();
    const maxBytes = this.maxMemoryMB * 1024 * 1024;

    if (currentMemory > maxBytes) {
      // Memory limit reached, compress or drop oldest errors
      this.compressErrors();
    }

    this.errors.push(error);
    this.totalFailed++;

    // Update type counts
    const count = this.errorsByType.get(error.type) || 0;
    this.errorsByType.set(error.type, count + 1);

    return true; // Error stored
  }

  /**
   * Get all collected errors (with fallback for lost errors)
   */
  getErrors(): ProcessingError[] {
    return this.errors;
  }

  /**
   * Check if error limits were reached
   */
  isLimitReached(): boolean {
    return this.totalFailed > this.errors.length;
  }

  /**
   * Get count of errors that weren't stored due to limits
   */
  getDiscardedErrorCount(): number {
    return this.totalFailed - this.errors.length;
  }

  /**
   * Compress errors: keep first, last, and sample middle ones
   */
  private compressErrors(): void {
    if (this.errors.length < 100) return;

    const compressed: ProcessingError[] = [];

    // Keep first 10 (early context)
    compressed.push(...this.errors.slice(0, 10));

    // Sample middle 20% evenly
    const sampleSize = Math.floor(this.errors.length * 0.1);
    const step = Math.floor((this.errors.length - 20) / sampleSize);
    for (let i = 10; i < this.errors.length - 10; i += step) {
      if (compressed.length < 80) {
        compressed.push(this.errors[i]);
      }
    }

    // Keep last 10 (recent context)
    compressed.push(...this.errors.slice(-10));

    this.errors = compressed;
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: ~500 bytes per error object + stack trace
    return this.errors.reduce((sum, err) => {
      const baseSize = 500;
      const stackSize = (err.stack || '').length;
      const messageSize = err.message.length;
      return sum + baseSize + stackSize + messageSize;
    }, 0);
  }

  /**
   * Reset for next batch
   */
  reset(): void {
    this.errors = [];
    this.errorsByType.clear();
    this.totalFailed = 0;
  }
}
```

---

## 4. Report Formatting

### 4.1 Text Report Format

```typescript
export function formatTextReport(report: BatchErrorReport): string {
  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(70));
  lines.push('BATCH CONVERSION REPORT');
  lines.push('═'.repeat(70));
  lines.push('');

  // Summary
  lines.push(`Timestamp:  ${report.timestamp.toISOString()}`);
  lines.push(`Total files: ${report.totalFiles}`);
  lines.push(`Successful: ${report.successful} (${((report.successful / report.totalFiles) * 100).toFixed(1)}%)`);
  lines.push(`Failed:     ${report.failed} (${((report.failed / report.totalFiles) * 100).toFixed(1)}%)`);
  lines.push('');

  // Error breakdown
  lines.push('ERROR BREAKDOWN BY TYPE:');
  lines.push('─'.repeat(70));
  for (const [type, count] of Object.entries(report.errorsByType)) {
    if (count > 0) {
      lines.push(`  ${type.padEnd(20)} ${count}`);
    }
  }
  lines.push('');

  // Error breakdown by phase
  lines.push('ERROR BREAKDOWN BY PHASE:');
  lines.push('─'.repeat(70));
  for (const [phase, count] of Object.entries(report.errorsByPhase)) {
    if (count > 0) {
      lines.push(`  ${phase?.padEnd(20) || 'unknown'.padEnd(20)} ${count}`);
    }
  }
  lines.push('');

  // Detailed errors (limited to first 50)
  if (report.errors.length > 0) {
    lines.push('ERRORS (showing first 50):');
    lines.push('─'.repeat(70));
    lines.push('');

    for (let i = 0; i < Math.min(50, report.errors.length); i++) {
      const err = report.errors[i];
      lines.push(`[${i + 1}] ${err.fileName}`);
      lines.push(`    Type:     ${err.type}`);
      lines.push(`    Phase:    ${err.phase || 'unknown'}`);
      lines.push(`    Message:  ${err.message}`);

      if (err.line) {
        lines.push(`    Location: Line ${err.line}${err.column ? `, Column ${err.column}` : ''}`);
      }

      if (err.suggestion) {
        lines.push(`    Suggestion: ${err.suggestion}`);
      }

      lines.push('');
    }

    if (report.errors.length > 50) {
      lines.push(`... and ${report.errors.length - 50} more errors`);
      lines.push('See JSON report for complete details.');
      lines.push('');
    }
  }

  // Footer
  lines.push('═'.repeat(70));

  return lines.join('\n');
}
```

### 4.2 JSON Report Format

```typescript
export function formatJsonReport(report: BatchErrorReport): object {
  return {
    metadata: {
      timestamp: report.timestamp.toISOString(),
      version: '1.0',
    },
    summary: {
      totalFiles: report.totalFiles,
      successful: report.successful,
      failed: report.failed,
      warnings: report.warnings,
      successRate: (report.successful / report.totalFiles) * 100,
      partialSuccess: report.partialSuccess,
      stoppedEarly: report.stoppedEarly,
      stopReason: report.stopReason,
    },
    breakdown: {
      byType: report.errorsByType,
      byPhase: report.errorsByPhase,
    },
    errors: report.errors.map(err => ({
      id: err.id,
      file: {
        path: err.filePath,
        relative: err.relativePath,
        name: err.fileName,
      },
      error: {
        type: err.type,
        severity: err.severity,
        message: err.message,
        location: err.line ? { line: err.line, column: err.column } : undefined,
      },
      processing: {
        phase: err.phase,
        duration: err.duration,
        attemptNumber: err.attemptNumber,
      },
      recovery: {
        isRecoverable: err.isRecoverable,
        suggestion: err.suggestion,
        alternative: err.alternative,
      },
      stack: err.stack, // Include only for detailed debugging
    })),
  };
}

/**
 * Write reports to files
 */
export async function writeReports(
  report: BatchErrorReport,
  outputDir: string,
  baseName: string = 'batch-report'
): Promise<{ textPath: string; jsonPath: string }> {
  const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');

  // Text report
  const textPath = path.join(outputDir, `${baseName}-${timestamp}.txt`);
  const textContent = formatTextReport(report);
  await fs.promises.writeFile(textPath, textContent, 'utf-8');

  // JSON report
  const jsonPath = path.join(outputDir, `${baseName}-${timestamp}.json`);
  const jsonContent = JSON.stringify(formatJsonReport(report), null, 2);
  await fs.promises.writeFile(jsonPath, jsonContent, 'utf-8');

  return { textPath, jsonPath };
}
```

---

## 5. Complete Implementation Example

### 5.1 Batch Processor Service

```typescript
import path from 'path';
import { glob } from 'glob';

/**
 * Complete batch processor with error collection
 */
export class BatchProcessor {
  private errorCollector: ErrorCollector;
  private report: BatchErrorReport;

  constructor(
    private logger: Logger,
    private options: {
      chunkSize?: number;
      maxErrors?: number;
      maxMemoryMB?: number;
      concurrency?: number;
    } = {}
  ) {
    this.errorCollector = new ErrorCollector(
      options.maxErrors || 1000,
      options.maxMemoryMB || 256
    );

    this.report = {
      timestamp: new Date(),
      totalFiles: 0,
      successful: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      errorsByType: {},
      errorsByPhase: {},
      partialSuccess: false,
      stoppedEarly: false,
    };
  }

  /**
   * Process multiple Bruno files
   */
  async processBatch(
    inputPattern: string,
    convertFn: (filePath: string) => Promise<void>
  ): Promise<BatchErrorReport> {
    // Find all matching files
    const files = await glob(inputPattern, { nodir: true });
    this.report.totalFiles = files.length;

    this.logger.info(`Processing ${files.length} files...`);

    // Process in chunks with concurrency control
    const chunkSize = this.options.chunkSize || 10;

    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);

      const results = await Promise.allSettled(
        chunk.map(file => this.processFile(file, convertFn))
      );

      // Process results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          this.report.successful++;
        } else {
          this.report.failed++;
          this.logger.verbose(`Failed: ${chunk[j]}`);
        }
      }

      // Check error limit
      if (this.errorCollector.getDiscardedErrorCount() > 0) {
        this.report.stoppedEarly = true;
        this.report.stopReason = `Error limit reached (${this.report.failed} errors)`;
        break;
      }

      // Progress
      const processed = Math.min(i + chunkSize, files.length);
      this.logger.info(`Processed ${processed}/${files.length}`);
    }

    this.report.errors = this.errorCollector.getErrors();
    this.report.partialSuccess = this.report.successful > 0 && this.report.failed > 0;

    // Calculate breakdowns
    this.report.errorsByType = this.calculateErrorsByType();
    this.report.errorsByPhase = this.calculateErrorsByPhase();

    return this.report;
  }

  /**
   * Process single file with error handling
   */
  private async processFile(
    filePath: string,
    convertFn: (filePath: string) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Phase: read
      const duration = Date.now() - startTime;
      await convertFn(filePath);
    } catch (error) {
      const duration = Date.now() - startTime;

      const processingError = captureErrorContext(error, {
        filePath,
        phase: 'convert',
        duration,
      });

      this.errorCollector.addError(processingError);
      throw error; // Re-throw for Promise.allSettled
    }
  }

  /**
   * Generate error breakdown by type
   */
  private calculateErrorsByType(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const error of this.report.errors) {
      breakdown[error.type] = (breakdown[error.type] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Generate error breakdown by phase
   */
  private calculateErrorsByPhase(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const error of this.report.errors) {
      const phase = error.phase || 'unknown';
      breakdown[phase] = (breakdown[phase] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Generate and output reports
   */
  async generateReports(outputDir: string): Promise<void> {
    // Text report for console
    this.logger.info(formatTextReport(this.report));

    // JSON report for programmatic access
    const reports = await writeReports(this.report, outputDir);
    this.logger.info(`Reports written to:`);
    this.logger.info(`  Text: ${reports.textPath}`);
    this.logger.info(`  JSON: ${reports.jsonPath}`);
  }
}
```

### 5.2 Integration with ConvertCommand

```typescript
/**
 * Updated convert command with batch processing support
 */
export async function convertBatchCommand(
  inputPattern: string,
  options: ConvertOptions & { batch?: boolean }
): Promise<void> {
  const logger = new Logger({
    jsonOutput: options.json || false,
    verbose: options.verbose || false,
  });

  try {
    const processor = new BatchProcessor(logger, {
      chunkSize: 10,
      maxErrors: 1000,
      maxMemoryMB: 256,
    });

    const report = await processor.processBatch(
      inputPattern,
      async (filePath: string) => {
        // Your existing convert logic
        const content = await readFile(filePath);
        const bruno = parseBrunoFile(content);
        validateBrunoRequest(bruno);

        const collection = buildPostmanCollection(
          bruno.meta.name || path.basename(filePath, '.bru'),
          [{ name: bruno.meta.name, request: bruno }]
        );

        validatePostmanCollection(collection);

        const outputPath = options.output ||
          path.join(path.dirname(filePath), `${path.basename(filePath, '.bru')}.postman_collection.json`);

        await writeFile(outputPath, JSON.stringify(collection, null, 2));
      }
    );

    // Generate reports
    const outputDir = options.output ? path.dirname(options.output) : process.cwd();
    await processor.generateReports(outputDir);

    // Exit with appropriate code
    process.exit(report.partialSuccess || report.successful > 0 ? 0 : 1);
  } catch (error) {
    logger.error(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
```

---

## 6. Best Practices Summary

### Memory Management
- **Error Limit**: Cap stored errors at 1000 (reduces memory to ~500KB-1MB)
- **Memory Limit**: Set max memory per batch (e.g., 256MB)
- **Compression**: Sample errors when limit reached (keep first, last, random middle)
- **Streaming**: For truly massive batches, stream errors to disk

### Error Context
- **Always capture**: file path, error type, message, stack trace
- **When possible**: line numbers, processing phase, duration, suggestions
- **Unique IDs**: Enable error tracking and correlation
- **Classification**: Use predictable error types for reporting

### Performance
- **Concurrency**: Use Promise.allSettled with chunk size 5-20
- **Parallel processing**: Don't process sequentially (much slower)
- **Early stopping**: Stop after max errors to avoid wasted processing

### Reporting
- **Dual format**: Text for humans (console), JSON for automation
- **Summaries first**: Show counts before details
- **Actionable**: Include suggestions and recovery options
- **Compression**: Show first 50 errors, reference JSON for rest

### Error Handling
- **Classify errors**: Parse, validation, conversion, filesystem
- **Mark recoverable**: Can user fix and retry?
- **Continue on error**: Don't stop the whole batch
- **Track success rate**: Calculate and report percentage

---

## 7. References

### Node.js Error Handling
- Promise.allSettled() vs Promise.all()
- Error inheritance and instanceof checks
- Stack trace preservation

### TypeScript Patterns
- Discriminated unions for error types
- Generic error collectors
- Type-safe error handling with zod

### Performance
- Chunking strategies for memory efficiency
- Concurrency limits with pq-queue, p-limit
- Memory profiling with --max-old-space-size

### Reporting Formats
- Structured logging (JSON)
- Machine-readable error codes
- Human-friendly summaries
