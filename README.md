# Bruno to Postman Converter

A CLI tool to convert Bruno REST request files (.bru) to Postman Collection format (v2.1).

## Features

- ✅ Convert single Bruno files to Postman collections
- ✅ Batch convert entire directories with folder hierarchy preservation
- ✅ Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- ✅ Preserve variables, headers, query parameters, and request bodies
- ✅ Convert authentication settings (Basic, Bearer, API Key)
- ✅ Best-effort script conversion (pre-request and test scripts)
- ✅ Environment file conversion support

## Installation

### Global Installation (Recommended)

```bash
npm install -g bruno-to-postman
```

### Local Installation

```bash
npm install --save-dev bruno-to-postman
```

### From Source

```bash
git clone <repository-url>
cd bruno-to-postman
npm install
npm run build
npm link
```

## Requirements

- Node.js 18.0.0 or higher
- npm 9.0 or higher

## Usage

### Convert a Single File

```bash
bruno-to-postman convert ./requests/get-user.bru -o ./output/collection.json
```

### Convert a Directory

```bash
bruno-to-postman convert ./bruno-requests -o ./my-collection.json -n "My API Collection"
```

### Convert with Environment Files

```bash
bruno-to-postman convert ./bruno-requests -o ./collection.json --env
```

## CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `./collection.postman.json` |
| `--name` | `-n` | Collection name | Source directory name |
| `--env` | `-e` | Include environment conversion | `false` |
| `--verbose` | `-v` | Detailed logging | `false` |
| `--json` | `-j` | JSON output format | `false` |
| `--force` | `-f` | Overwrite existing files | `false` |
| `--experimental-ast` | | Use AST-based script conversion (experimental) | `false` |

## Examples

See the [Quickstart Guide](./specs/001-bruno-to-postman/quickstart.md) for detailed examples.

## Supported Features

### ✅ Fully Supported

- All HTTP methods
- Headers and query parameters
- Variables (`{{variableName}}`)
- JSON, XML, text, form-urlencoded bodies
- Basic, Bearer, and API Key authentication
- Pre-request and test scripts (best-effort conversion)
- Folder hierarchy (unlimited nesting)

### ⚠️ Partially Supported

- Multipart/form-data (files require manual configuration)
- OAuth2 (basic configuration only)

### ❌ Not Supported

- GraphQL
- WebSocket
- gRPC

## Script Conversion

Bruno and Postman use different APIs for accessing request/response data and managing variables. This tool provides two approaches for converting Bruno scripts to Postman:

### Default: Regex-based Conversion (Stable)

The default converter uses regular expressions to transform Bruno script syntax to Postman equivalents.

**Conversions:**
- `bru.setVar()` → `pm.environment.set()`
- `bru.getVar()` → `pm.environment.get()`
- `res.status` → `pm.response.code`
- `res.body` → `pm.response.json()`
- `test()` → `pm.test()`
- `expect()` → `pm.expect()`

**Usage:**
```bash
bruno-to-postman convert ./request.bru -o ./collection.json
```

**Best for:** Simple scripts, production use, maximum stability

### Experimental: AST-based Conversion

The AST (Abstract Syntax Tree) converter uses Babel to parse, transform, and regenerate JavaScript code, providing more accurate conversion for complex scripts.

**Benefits:**
- ✅ Handles complex JavaScript constructs (loops, closures, async/await)
- ✅ Preserves code structure and formatting
- ✅ Maintains comments in original positions
- ✅ More accurate transformations for nested expressions
- ✅ Automatic fallback to regex converter on errors

**Usage:**
```bash
bruno-to-postman convert ./request.bru -o ./collection.json --experimental-ast
```

**Best for:**
- Scripts with for/while loops
- Arrow functions and closures
- Template literals with variables
- Destructuring assignments
- Async/await patterns
- Spread operators
- Class declarations

**Example transformations:**

```javascript
// Bruno script with complex constructs
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  bru.setVar(`item${i}`, item.id);

  if (item.status === "active") {
    const result = await processItem(item);
    bru.setVar("lastResult", result);
  }
}

// Correctly converted to Postman with AST
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  pm.environment.set(`item${i}`, item.id);

  if (item.status === "active") {
    const result = await processItem(item);
    pm.environment.set("lastResult", result);
  }
}
```

**Limitations:**
- Experimental feature - may have edge cases
- Slightly slower than regex converter
- Falls back to regex on parse errors

**Detection:** The tool automatically detects when AST parsing would be beneficial for a script, but requires the `--experimental-ast` flag to enable it.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT

## Support

For issues and feature requests, please visit the [issue tracker](<repository-url>/issues).
