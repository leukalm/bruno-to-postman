# Quickstart: Batch Conversion

## Basic Usage

### Convert a Directory

```bash
bruno-to-postman convert ./my-bruno-collection -o collection.json
```

This will:
1. Scan `./my-bruno-collection` for all `.bru` files
2. Preserve folder hierarchy
3. Parse `bruno.json` if present
4. Generate `collection.json`

---

## Examples

### 1. Simple Flat Collection

**Directory structure**:
```
api-requests/
├── get-users.bru
├── create-user.bru
└── delete-user.bru
```

**Command**:
```bash
bruno-to-postman convert ./api-requests -o users.json
```

**Result**: Collection named "api-requests" with 3 requests

---

### 2. Nested Collection

**Directory structure**:
```
my-api/
├── bruno.json
├── users/
│   ├── get-user.bru
│   └── create-user.bru
└── products/
    ├── list-products.bru
    └── details.bru
```

**Command**:
```bash
bruno-to-postman convert ./my-api -o my-api.json
```

**Result**: Collection with 2 folders ("users", "products"), name from bruno.json

---

### 3. Custom Collection Name

```bash
bruno-to-postman convert ./api-requests -o output.json -n "My Custom API"
```

Priority: CLI name > bruno.json > directory name

---

### 4. With AST Script Conversion

```bash
bruno-to-postman convert ./api-requests -o output.json --experimental-ast
```

Uses AST parsing for complex scripts (loops, closures, etc.)

---

### 5. Verbose Output

```bash
bruno-to-postman convert ./api-requests -o output.json -v
```

Shows:
- Files being processed
- Parse progress
- Conversion warnings
- Detailed error messages

---

### 6. JSON Report Mode

```bash
bruno-to-postman convert ./api-requests -o output.json --json
```

Outputs machine-readable report for CI/CD integration

---

## Common Scenarios

### Missing bruno.json

If `bruno.json` is not found:
- ⚠️ Warning logged
- ✅ Directory name used as collection name
- ✅ Conversion continues normally

### Invalid Files

If some `.bru` files are invalid:
- ✅ Valid files are converted
- ❌ Invalid files collected as errors
- 📊 Report shows success/failure breakdown
- Exit code: 1 (partial failure)

### Empty Directory

```bash
bruno-to-postman convert ./empty-dir -o output.json
```

Output: `Error: No .bru files found in ./empty-dir`

---

## Reading Reports

### Text Report (default)

```
Batch Conversion Report
=======================

Summary:
  Total files: 15
  Successful: 12 (80%)
  Failed: 3 (20%)
  Duration: 1.2s

Errors:
  1. invalid.bru (line 5)
     Parse error: Missing HTTP method

  2. malformed.bru (line 12)
     Validation error: Invalid JSON in body
```

### JSON Report (--json)

```json
{
  "totalFiles": 15,
  "successCount": 12,
  "failureCount": 3,
  "duration": 1200,
  "successRate": 80.0,
  "errors": [
    {
      "filePath": "invalid.bru",
      "message": "Missing HTTP method",
      "type": "parse",
      "line": 5
    }
  ]
}
```

---

## Troubleshooting

### Permission Errors

```bash
chmod +x /path/to/bruno-to-postman
```

### File Not Found

Use absolute paths or verify current directory:
```bash
bruno-to-postman convert $(pwd)/api-requests -o output.json
```

### Large Collections (100+ files)

Processing time scales linearly (~50ms per file):
- 100 files ≈ 5 seconds
- 500 files ≈ 25 seconds

For very large collections, use verbose mode to monitor progress.
