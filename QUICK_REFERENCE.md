# Error Collection Patterns - Quick Reference

**For batch processing 50+ files with comprehensive error reporting.**

---

## TL;DR - The Winning Pattern

```typescript
// 1. Use Promise.allSettled with chunking
// 2. Capture error context (file, phase, message)
// 3. Store errors with limits (1000 max, 256MB max)
// 4. Report in text (human) + JSON (machine) formats

const processor = new BatchProcessor(logger, {
  chunkSize: 10,
  maxErrors: 1000,
  maxMemoryMB: 256
});

const report = await processor.processBatch(files, convertFn);
processor.displayReport();
await processor.saveReports(outputDir);
```

---

## Files & Locations

### Implementation (Production-Ready)
- **`/src/utils/errorCollector.ts`** (415 lines)
  - `ErrorCollector` class - memory-efficient storage
  - `ProcessingError` interface - rich error context
  - `formatTextReport()` / `formatJsonReport()` - output formatting

- **`/src/services/batchProcessor.ts`** (300 lines)
  - `BatchProcessor` class - orchestrates batch processing
  - `processBatch()` - Promise.allSettled implementation

- **`/src/types/batchProcessing.types.ts`** (250 lines)
  - TypeScript interfaces with Zod validation
  - Type-safe configurations

### Documentation
- **`/ERROR_COLLECTION_PATTERNS.md`** (700+ lines)
  - Detailed patterns, strategy comparison, memory management

- **`/BATCH_PROCESSING_EXAMPLE.md`** (400+ lines)
  - 6 runnable examples from basic to advanced

- **`/RESEARCH_SUMMARY.md`** (400+ lines)
  - Executive summary, decision matrix, best practices

- **`/QUICK_REFERENCE.md`** (this file)
  - Quick lookup and copy-paste examples

---

## One-Minute Tutorial

### Step 1: Import
```typescript
import { BatchProcessor } from './services/batchProcessor';
import { captureErrorContext } from './utils/errorCollector';
import { Logger } from './services/logger';
```

### Step 2: Create Processor
```typescript
const logger = new Logger({ verbose: true });
const processor = new BatchProcessor(logger, {
  chunkSize: 10,        // Concurrent files
  maxErrors: 1000,      // Max errors stored
  maxMemoryMB: 256      // Memory budget
});
```

### Step 3: Process Batch
```typescript
const report = await processor.processBatch(
  files,  // Array of file paths
  async (filePath) => {
    const startTime = Date.now();
    try {
      // Your conversion logic
      await convertFile(filePath);
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
```

### Step 4: Report
```typescript
processor.displayReport();      // Console
await processor.saveReports('.'); // Save to files
```

---

## Error Context Structure

**Capture this when error occurs:**

```typescript
captureErrorContext(error, {
  filePath: '/path/to/file.bru',
  phase: 'parse',              // 'read' | 'parse' | 'validate' | 'convert' | 'write'
  duration: 234,               // milliseconds
  attemptNumber: 1             // retry count
})
```

**Returns comprehensive error object with:**
- `id` - Unique ID for tracking
- `filePath` / `fileName` - Which file failed
- `type` - Classified error type (parse, validation, conversion, filesystem)
- `message` - Human-readable message
- `phase` - Where in pipeline it failed
- `suggestion` - How to fix it
- `isRecoverable` - Can user retry?
- `stack` - Full stack trace

---

## Error Types & Recovery

```typescript
type ErrorType = 'parse' | 'validation' | 'conversion' | 'filesystem' | 'unknown';

// Automatic classification based on error message:
'parse'        // SyntaxError, parse errors → File syntax is invalid
'validation'   // Invalid schema, validation errors → User can fix
'conversion'   // Conversion logic errors → May need Postman adjustment
'filesystem'   // File I/O, permissions → System issue (not recoverable)
'unknown'      // Unclassified
```

---

## Report Output Examples

### Text Report (Console)
```
═══════════════════════════════════════════════════════════════════
BATCH CONVERSION REPORT
═══════════════════════════════════════════════════════════════════

Timestamp:      2024-11-14T10:30:45.123Z
Total files:    50
Successful:     45 (90.0%)
Failed:         5 (10.0%)

ERROR BREAKDOWN BY TYPE:
  parse            2 (40.0%)
  validation       2 (40.0%)
  filesystem       1 (20.0%)

ERROR BREAKDOWN BY PHASE:
  parse            2 (40.0%)
  validate         2 (40.0%)
  write            1 (20.0%)

[1] missing-auth.bru
    Type:       parse
    Phase:      parse
    Message:    Unexpected token '}' at line 12
    Suggestion: Verify file follows Bruno format specification
```

### JSON Report (Programmatic Access)
```json
{
  "summary": {
    "totalFiles": 50,
    "successful": 45,
    "failed": 5,
    "successRate": 90.0,
    "partialSuccess": true
  },
  "breakdown": {
    "byType": {
      "parse": 2,
      "validation": 2,
      "filesystem": 1
    }
  },
  "errors": [
    {
      "file": { "path": "/path/to/file.bru", "name": "file.bru" },
      "error": {
        "type": "parse",
        "message": "Unexpected token '}' at line 12",
        "location": { "line": 12, "column": 8 }
      },
      "recovery": {
        "suggestion": "Verify file follows Bruno format specification"
      }
    }
  ]
}
```

---

## Configuration Presets

### Standard (Recommended for 50-500 files)
```typescript
{
  chunkSize: 10,        // Good speed
  maxErrors: 1000,      // Reasonable memory
  maxMemoryMB: 256      // Typical budget
}
```

### Conservative (For important data)
```typescript
{
  chunkSize: 5,         // Careful processing
  maxErrors: 500,       // Tighter limit
  maxMemoryMB: 128,     // Low memory
  stopAfterErrors: 10   // Fail fast
}
```

### Aggressive (For speed)
```typescript
{
  chunkSize: 20,        // Parallel processing
  maxErrors: 100,       // Minimal errors
  maxMemoryMB: 512      // Generous budget
}
```

### Massive (1000+ files)
```typescript
{
  chunkSize: 30,
  maxErrors: 100,       // Only keep first 100
  maxMemoryMB: 256,
  stopAfterErrors: 50   // Stop early to avoid waste
}
```

---

## Memory Management

**Three-tier approach:**

1. **Error count cap** (safest)
   ```typescript
   maxErrors: 1000  // Hard limit
   ```

2. **Memory budget** (recommended)
   ```typescript
   maxMemoryMB: 256  // Adaptive compression if exceeded
   ```

3. **Check if limits were reached**
   ```typescript
   if (report.stoppedEarly) {
     console.log(report.stopReason);
   }
   ```

**Memory consumption estimate:**
- ~500 bytes per error (base)
- +stack trace size
- ~1000 errors ≈ 500KB-1MB total

---

## Error Processing Steps

```
Files (50+)
    ↓
[Split into chunks of 10]
    ↓
[Promise.allSettled each chunk]
    ├─ Success → count++
    │
    └─ Error → captureErrorContext()
              → ErrorCollector.addError()
              → Check memory limits
              → Store or compress
    ↓
[Continue next chunk]
    ↓
[All done]
    ↓
[Generate reports]
├─ Text (console)
├─ JSON (file)
└─ Summaries
```

---

## Copy-Paste Examples

### Example 1: Basic Batch Processing
```typescript
const processor = new BatchProcessor(logger);
const report = await processor.processBatch(files, async (file) => {
  try {
    await convertFile(file);
    return { filePath: file, success: true, duration: 0 };
  } catch (error) {
    return {
      filePath: file,
      success: false,
      duration: 0,
      error: captureErrorContext(error, { filePath: file, phase: 'convert' })
    };
  }
});
processor.displayReport();
```

### Example 2: With Progress Tracking
```typescript
const processor = new BatchProcessor(logger, {
  onProgress: (completed, total) => {
    logger.info(`Progress: ${completed}/${total}`);
  }
});
const report = await processor.processBatch(files, convertFile);
```

### Example 3: With Error Limit
```typescript
const processor = new BatchProcessor(logger, {
  stopAfterErrors: 50  // Stop after 50 errors
});
const report = await processor.processBatch(files, convertFile);
if (report.stoppedEarly) {
  logger.warn(`Stopped: ${report.stopReason}`);
}
```

### Example 4: With Retry Logic
```typescript
const report = await processor.processBatch(files, async (file) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await convertFile(file);
      return { filePath: file, success: true, duration: 0 };
    } catch (error) {
      if (attempt === 3) {
        return {
          filePath: file,
          success: false,
          duration: 0,
          error: captureErrorContext(error, {
            filePath: file,
            phase: 'convert',
            attemptNumber: 3
          })
        };
      }
      await sleep(100 * attempt);  // Backoff
    }
  }
});
```

### Example 5: JSON Report for CI/CD
```typescript
const report = await processor.processBatch(files, convertFile);
const reports = await processor.saveReports(outputDir);

// Output for CI/CD parsing
console.log(JSON.stringify({
  status: report.successful > 0 ? 'success' : 'failure',
  files: {
    total: report.totalFiles,
    successful: report.successful,
    failed: report.failed
  },
  report: reports
}));
```

---

## Troubleshooting

### Problem: Out of Memory with Large Batches
**Solution:** Reduce limits
```typescript
{
  chunkSize: 5,
  maxErrors: 100,
  maxMemoryMB: 64,
  stopAfterErrors: 20
}
```

### Problem: Too Slow Processing
**Solution:** Increase concurrency
```typescript
{
  chunkSize: 30,  // Process 30 at a time
  maxErrors: 50   // Accept fewer stored errors
}
```

### Problem: Missing Error Details
**Solution:** Enable verbose and save reports
```typescript
const logger = new Logger({ verbose: true });
const reports = await processor.saveReports(outputDir);
// Check JSON report for complete error details
```

### Problem: Reports Not Saving
**Solution:** Check directory permissions
```typescript
import { mkdir } from 'fs/promises';
await mkdir(outputDir, { recursive: true });
await processor.saveReports(outputDir);
```

---

## Key Statistics

| Metric | Value |
|--------|-------|
| **Error limit** | 1000 max (configurable) |
| **Memory budget** | 256MB default (configurable) |
| **Typical concurrency** | 10 files at a time |
| **Memory per error** | ~500 bytes (+ stack) |
| **Total errors for 1000 files** | ~300 (30% failure rate) |
| **Report generation time** | <100ms |
| **Processing overhead** | <5% |

---

## Integration Checklist

- [ ] Copy `/src/utils/errorCollector.ts`
- [ ] Copy `/src/services/batchProcessor.ts`
- [ ] Copy `/src/types/batchProcessing.types.ts`
- [ ] Import in your convert command
- [ ] Create BatchProcessor instance
- [ ] Call processBatch() with file array
- [ ] Display report with processor.displayReport()
- [ ] Save reports with processor.saveReports()
- [ ] Test with 50+ files
- [ ] Configure parameters for your use case
- [ ] Integrate with CI/CD (use JSON report)

---

## Best Practices Summary

1. Always use `Promise.allSettled` for batch processing (not Promise.all)
2. Process in chunks (10-20 files concurrently is sweet spot)
3. Capture error context (file path, phase, duration)
4. Set error limits (prevent memory issues)
5. Continue on error (don't stop the whole batch)
6. Report in both formats (text + JSON)
7. Include recovery suggestions
8. Track success rate as percentage
9. Save detailed reports to files
10. Monitor memory usage with large batches

---

## Next Steps

1. **Read** `/RESEARCH_SUMMARY.md` for executive overview
2. **Reference** `/ERROR_COLLECTION_PATTERNS.md` for detailed theory
3. **Copy examples** from `/BATCH_PROCESSING_EXAMPLE.md`
4. **Integrate** implementation files into your project
5. **Test** with your 50+ file collection
6. **Customize** parameters based on results
7. **Monitor** error patterns to improve file quality

---

## Links to Detailed Documentation

- **Strategy comparison**: `/ERROR_COLLECTION_PATTERNS.md#1-error-collection-strategies`
- **Memory management**: `/ERROR_COLLECTION_PATTERNS.md#3-memory-efficiency`
- **Report formatting**: `/ERROR_COLLECTION_PATTERNS.md#4-report-formatting`
- **Implementation examples**: `/BATCH_PROCESSING_EXAMPLE.md`
- **Decision matrix**: `/RESEARCH_SUMMARY.md#decision-matrix-when-to-use-each-pattern`
- **Complete runnable code**: `/src/services/batchProcessor.ts`

---

**Last Updated**: November 14, 2024
**Tested with**: Node.js 18+, TypeScript 5.3+, Zod 3.25+
