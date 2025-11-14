# Data Model: Batch Conversion

## Entities

### 1. BrunoCollectionMetadata

Represents metadata from bruno.json file.

```typescript
interface BrunoCollectionMetadata {
  version: '1';
  name: string;
  type: 'collection';
}
```

**Fields**:
- `version`: Bruno format version (always "1")
- `name`: Collection display name
- `type`: Resource type identifier (always "collection")

**Validation**:
- All fields required
- `version` must be "1"
- `type` must be "collection"
- `name` minimum 1 character

---

### 2. FileTreeNode

Hierarchical representation of directory structure.

```typescript
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  brunoRequest?: BrunoRequest;
  children: FileTreeNode[];
}
```

**Fields**:
- `name`: File or directory name
- `path`: Absolute path
- `type`: File or directory
- `brunoRequest`: Parsed Bruno request (only for files)
- `children`: Nested files/directories

**Relationships**: Recursive parent-child hierarchy

---

### 3. BatchConversionReport

Summary of batch conversion results.

```typescript
interface BatchConversionReport {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors: ConversionError[];
  warnings: string[];
  outputPath?: string;
  successRate: number;
}
```

**Fields**:
- `totalFiles`: Total .bru files found
- `successCount`: Successfully converted
- `failureCount`: Failed conversions
- `duration`: Total time in ms
- `errors`: Array of conversion errors
- `warnings`: Non-fatal warnings
- `outputPath`: Where collection was saved
- `successRate`: Percentage (0-100)

---

### 4. ConversionError

Detailed error information for failed conversions.

```typescript
interface ConversionError {
  filePath: string;
  message: string;
  type: 'parse' | 'validation' | 'conversion' | 'filesystem';
  line?: number;
  phase: 'read' | 'parse' | 'validate' | 'convert' | 'write';
  suggestion?: string;
  isRecoverable: boolean;
}
```

**Fields**:
- `filePath`: Which file failed
- `message`: Error description
- `type`: Error classification
- `line`: Location in file (optional)
- `phase`: Pipeline stage where error occurred
- `suggestion`: How to fix (optional)
- `isRecoverable`: User can fix and retry
