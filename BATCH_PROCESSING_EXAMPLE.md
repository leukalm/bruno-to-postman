# Batch Processing Usage Examples

This document demonstrates how to use the error collection patterns in your bruno-to-postman converter.

## Quick Start

### Basic Batch Processing

```typescript
import { BatchProcessor } from './services/batchProcessor';
import { Logger } from './services/logger';
import { glob } from 'glob';
import { readFile, writeFile } from './services/fileService';
import { parseBrunoFile } from './parsers/brunoParser';
import { buildPostmanCollection } from './builders/collectionBuilder';

async function convertBatch(inputDir: string, outputDir: string) {
  const logger = new Logger({ verbose: true });

  // Find all .bru files
  const files = await glob(`${inputDir}/**/*.bru`);

  // Create batch processor
  const processor = new BatchProcessor(logger, {
    chunkSize: 10,        // Process 10 files concurrently
    maxErrors: 1000,      // Store max 1000 errors
    maxMemoryMB: 256,     // Use max 256MB for error storage
    onProgress: (completed, total) => {
      logger.info(`Progress: ${completed}/${total}`);
    }
  });

  // Process batch
  const report = await processor.processBatch(
    files,
    async (filePath) => {
      const startTime = Date.now();

      try {
        const content = await readFile(filePath);
        const bruno = parseBrunoFile(content);

        const collection = buildPostmanCollection(
          bruno.meta.name || path.basename(filePath, '.bru'),
          [{ name: bruno.meta.name, request: bruno }]
        );

        const outputFile = path.join(
          outputDir,
          path.basename(filePath, '.bru') + '.postman_collection.json'
        );

        await writeFile(outputFile, JSON.stringify(collection, null, 2));

        return {
          filePath,
          success: true,
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          filePath,
          success: false,
          duration: Date.now() - startTime,
          error: captureErrorContext(error, {
            filePath,
            phase: 'convert',
            duration: Date.now() - startTime
          })
        };
      }
    },
    (file) => path.relative(inputDir, file)  // Display relative paths
  );

  // Display and save reports
  processor.displayReport();
  await processor.saveReports(outputDir);

  return report.partialSuccess || report.successful > 0;
}
```

## Advanced Usage

### With Error Recovery and Retry Logic

```typescript
async function convertBatchWithRetry(
  inputDir: string,
  outputDir: string,
  maxRetries: number = 2
) {
  const logger = new Logger({ verbose: true, jsonOutput: false });
  const processor = new BatchProcessor(logger, {
    chunkSize: 5,
    maxErrors: 500,
    stopAfterErrors: 100  // Stop after 100 errors
  });

  const files = await glob(`${inputDir}/**/*.bru`);

  const report = await processor.processBatch(
    files,
    async (filePath, index) => {
      const startTime = Date.now();
      const relativePath = path.relative(inputDir, filePath);

      let lastError: Error | undefined;

      // Retry logic
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const content = await readFile(filePath);
          const bruno = parseBrunoFile(content);
          validateBrunoRequest(bruno);

          const collection = buildPostmanCollection(
            bruno.meta.name || path.basename(filePath, '.bru'),
            [{ name: bruno.meta.name, request: bruno }]
          );

          validatePostmanCollection(collection);

          const outputFile = path.join(
            outputDir,
            path.basename(filePath, '.bru') + '.postman_collection.json'
          );

          await writeFile(outputFile, JSON.stringify(collection, null, 2));

          return {
            filePath: relativePath,
            success: true,
            duration: Date.now() - startTime
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          logger.verbose(
            `Attempt ${attempt}/${maxRetries} failed for ${relativePath}: ${lastError.message}`
          );

          // Exponential backoff
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      }

      // All retries exhausted
      return {
        filePath: relativePath,
        success: false,
        duration: Date.now() - startTime,
        error: captureErrorContext(lastError, {
          filePath,
          phase: 'convert',
          attemptNumber: maxRetries,
          duration: Date.now() - startTime
        })
      };
    },
    (file) => path.basename(file, '.bru')
  );

  processor.displayReport();
  const reports = await processor.saveReports(outputDir);

  return {
    success: report.partialSuccess || report.successful > 0,
    successRate: processor.getSuccessRate(),
    report,
    reportFiles: reports
  };
}
```

### With Phase-based Processing

```typescript
/**
 * More granular processing with phase tracking
 */
async function convertBatchWithPhases(
  inputDir: string,
  outputDir: string
) {
  const logger = new Logger({ verbose: true });
  const processor = new BatchProcessor(logger, {
    chunkSize: 10,
    maxErrors: 1000
  });

  const files = await glob(`${inputDir}/**/*.bru`);

  const report = await processor.processBatch(
    files,
    async (filePath) => {
      const startTime = Date.now();
      let currentPhase: 'read' | 'parse' | 'validate' | 'convert' | 'write' = 'read';

      try {
        // Phase 1: Read
        currentPhase = 'read';
        const content = await readFile(filePath);

        // Phase 2: Parse
        currentPhase = 'parse';
        const bruno = parseBrunoFile(content);

        // Phase 3: Validate
        currentPhase = 'validate';
        validateBrunoRequest(bruno);

        // Phase 4: Convert
        currentPhase = 'convert';
        const collection = buildPostmanCollection(
          bruno.meta.name || path.basename(filePath, '.bru'),
          [{ name: bruno.meta.name, request: bruno }]
        );
        validatePostmanCollection(collection);

        // Phase 5: Write
        currentPhase = 'write';
        const outputFile = path.join(
          outputDir,
          path.basename(filePath, '.bru') + '.postman_collection.json'
        );
        await writeFile(outputFile, JSON.stringify(collection, null, 2));

        return {
          filePath,
          success: true,
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          filePath,
          success: false,
          duration: Date.now() - startTime,
          error: captureErrorContext(error, {
            filePath,
            phase: currentPhase,
            duration: Date.now() - startTime
          })
        };
      }
    }
  );

  // Print report
  processor.displayReport();

  // Analyze errors by phase for debugging
  const errorsByPhase = report.errorsByPhase;
  if (Object.keys(errorsByPhase).length > 0) {
    logger.warn('Errors by processing phase:');
    for (const [phase, count] of Object.entries(errorsByPhase)) {
      logger.warn(`  ${phase}: ${count}`);
    }
  }

  return report;
}
```

### With JSON Output for CI/CD Integration

```typescript
async function convertBatchWithJsonLogging(
  inputDir: string,
  outputDir: string
) {
  const logger = new Logger({
    verbose: true,
    jsonOutput: true  // Output logs as JSON for parsing
  });

  const processor = new BatchProcessor(logger, {
    chunkSize: 10,
    maxErrors: 1000
  });

  const files = await glob(`${inputDir}/**/*.bru`);

  logger.info(`Starting batch conversion of ${files.length} files`);

  const report = await processor.processBatch(
    files,
    async (filePath) => {
      const startTime = Date.now();
      try {
        const content = await readFile(filePath);
        const bruno = parseBrunoFile(content);
        const collection = buildPostmanCollection(
          bruno.meta.name || path.basename(filePath, '.bru'),
          [{ name: bruno.meta.name, request: bruno }]
        );
        const outputFile = path.join(
          outputDir,
          path.basename(filePath, '.bru') + '.postman_collection.json'
        );
        await writeFile(outputFile, JSON.stringify(collection, null, 2));
        return {
          filePath,
          success: true,
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          filePath,
          success: false,
          duration: Date.now() - startTime,
          error: captureErrorContext(error, {
            filePath,
            phase: 'convert'
          })
        };
      }
    }
  );

  // Save JSON report for CI/CD parsing
  const reports = await processor.saveReports(outputDir);

  // Output structured result for CI/CD systems
  logger.info(JSON.stringify({
    status: report.partialSuccess || report.successful > 0 ? 'success' : 'failure',
    summary: {
      total: report.totalFiles,
      successful: report.successful,
      failed: report.failed,
      successRate: processor.getSuccessRate()
    },
    report: reports
  }));

  return report;
}
```

## Memory Management Example

```typescript
/**
 * Handling very large batches (1000+ files) with memory constraints
 */
async function convertBatchMemoryEfficient(
  inputDir: string,
  outputDir: string
) {
  const logger = new Logger({ verbose: false });
  const processor = new BatchProcessor(logger, {
    chunkSize: 20,           // Larger chunks for throughput
    maxErrors: 500,          // Cap errors at 500
    maxMemoryMB: 128,        // Only use 128MB for errors
    stopAfterErrors: 50      // Stop after 50 errors (fail fast)
  });

  const files = await glob(`${inputDir}/**/*.bru`);

  const report = await processor.processBatch(
    files,
    async (filePath) => {
      const startTime = Date.now();
      try {
        // ... conversion logic ...
        return {
          filePath,
          success: true,
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          filePath,
          success: false,
          duration: Date.now() - startTime,
          error: captureErrorContext(error, { filePath, phase: 'convert' })
        };
      }
    }
  );

  // Display summary (not full report for 1000+ files)
  logger.info(`
Batch Conversion Complete
========================
Total:       ${report.totalFiles}
Successful:  ${report.successful}
Failed:      ${report.failed}
Success Rate: ${processor.getSuccessRate().toFixed(1)}%
Stopped Early: ${report.stoppedEarly}
  `);

  // Still save detailed reports to files
  await processor.saveReports(outputDir);

  return report;
}
```

## Integration with CLI Command

```typescript
// Update convertCommand to support batch processing
import { BatchProcessor } from './services/batchProcessor';

export async function convertBatchCommand(
  inputPattern: string,
  options: ConvertOptions & { batch?: boolean }
): Promise<void> {
  const logger = new Logger({
    jsonOutput: options.json || false,
    verbose: options.verbose || false,
  });

  try {
    const files = await glob(inputPattern, { nodir: true });

    if (files.length === 0) {
      logger.error(`No files matching pattern: ${inputPattern}`);
      process.exit(1);
    }

    if (files.length === 1 && !options.batch) {
      // Single file - use existing logic
      return convertCommand(files[0], options);
    }

    // Batch processing
    logger.info(`Processing ${files.length} files in batch mode`);

    const processor = new BatchProcessor(logger, {
      chunkSize: 10,
      maxErrors: 1000,
      onProgress: (completed, total) => {
        logger.verbose(`${completed}/${total} processed`);
      }
    });

    const outputDir = options.output || process.cwd();

    const report = await processor.processBatch(
      files,
      async (filePath) => {
        const startTime = Date.now();
        try {
          // Your conversion logic here
          await convertSingleFile(filePath, options);
          return {
            filePath,
            success: true,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            filePath,
            success: false,
            duration: Date.now() - startTime,
            error: captureErrorContext(error, {
              filePath,
              phase: 'convert'
            })
          };
        }
      },
      (file) => path.relative(process.cwd(), file)
    );

    // Display report
    processor.displayReport();

    // Save reports
    await processor.saveReports(outputDir);

    // Exit with appropriate code
    process.exit(report.partialSuccess || report.successful > 0 ? 0 : 1);
  } catch (error) {
    logger.error(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Update CLI to expose batch command
program
  .command('batch <pattern>')
  .description('Convert multiple Bruno files to Postman collections')
  .option('-o, --output <path>', 'Output directory')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--json', 'Output logs in JSON format')
  .action((pattern: string, options: any) => {
    convertBatchCommand(pattern, options);
  });
```

## Error Handling Patterns

### Pattern 1: Basic Error Reporting

```typescript
// Simple: collect errors and report at end
const processor = new BatchProcessor(logger);
const report = await processor.processBatch(files, convert);
processor.displayReport();  // Shows summary + details
```

### Pattern 2: Fail Fast on Critical Errors

```typescript
// Stop if too many errors occur
const processor = new BatchProcessor(logger, {
  stopAfterErrors: 10  // Stop after 10 errors
});
const report = await processor.processBatch(files, convert);
if (report.stoppedEarly) {
  logger.error(`Processing stopped: ${report.stopReason}`);
}
```

### Pattern 3: Phase-Aware Error Handling

```typescript
// Track errors by phase for debugging
const report = await processor.processBatch(files, async (file) => {
  try {
    // Each phase can fail independently
    const content = await readFile(file);  // Phase: read
    const parsed = parseBrunoFile(content); // Phase: parse
    const validated = validate(parsed);     // Phase: validate
    const converted = convert(validated);   // Phase: convert
    await write(converted);                  // Phase: write
    return { filePath: file, success: true };
  } catch (error) {
    return {
      filePath: file,
      success: false,
      error: captureErrorContext(error, {
        filePath: file,
        phase: 'convert' // Track which phase failed
      })
    };
  }
});

// Analyze results
logger.info('Errors by phase:', report.errorsByPhase);
```

### Pattern 4: Recovery Suggestions

```typescript
// Errors include recovery suggestions
const error = captureErrorContext(parseError, { filePath, phase: 'parse' });
// error.suggestion = "Verify file follows Bruno format specification"
// error.isRecoverable = true (user can fix and retry)

// User sees in report:
// Message: Unexpected token '}' at line 5
// Suggestion: Verify file follows Bruno format specification
```

## Testing Error Handling

```typescript
import { test, expect } from '@jest/globals';

test('batch processor collects errors efficiently', async () => {
  const logger = new Logger({ verbose: false });
  const processor = new BatchProcessor(logger, {
    maxErrors: 100,
    maxMemoryMB: 10  // Small limit for testing
  });

  const items = Array(1000).fill(null).map((_, i) => `file-${i}.bru`);

  const report = await processor.processBatch(
    items,
    async (file) => {
      // Simulate 30% failure rate
      if (Math.random() < 0.3) {
        throw new Error(`Parse error in ${file}`);
      }
      return { filePath: file, success: true, duration: 10 };
    }
  );

  // Should have processed all items
  expect(report.totalFiles).toBe(1000);
  expect(report.successful + report.failed).toBe(1000);

  // Should have limited stored errors
  expect(report.errors.length).toBeLessThanOrEqual(100);

  // Should continue despite errors
  expect(report.successful).toBeGreaterThan(0);
  expect(report.failed).toBeGreaterThan(0);
});
```

## Summary

Use the batch processing patterns when:

1. Converting 50+ files - enables parallel processing
2. Some files may fail - continue with valid files
3. Need comprehensive error reports - automatic collection and formatting
4. Memory is limited - error compression and limits
5. Need to understand failure patterns - breakdown by type and phase
6. Want to integrate with CI/CD - JSON report format available

Key files:
- `/src/utils/errorCollector.ts` - Core error collection logic
- `/src/services/batchProcessor.ts` - Batch processing orchestration
- `/ERROR_COLLECTION_PATTERNS.md` - Detailed patterns and theory
