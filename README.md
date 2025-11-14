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
