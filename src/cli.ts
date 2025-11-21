#!/usr/bin/env node

import { Command } from 'commander';
import { convertCommand, ConvertOptions } from './commands/convertCommand.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('bruno-to-postman')
  .description('Convert Bruno API collections to Postman collections')
  .version(packageJson.version);

program
  .command('convert <input>')
  .description('Convert a Bruno .bru file or directory to a Postman collection')
  .option('-o, --output <path>', 'Output file path (default: <input>.postman_collection.json)')
  .option('-n, --name <name>', 'Custom collection name (overrides bruno.json)')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--json', 'Output logs in JSON format', false)
  .option('--env', 'Include environment conversion', false)
  .option('--upload', 'Upload to Postman Cloud (overwrites existing collection)', false)
  .option('--postman-api-key <key>', 'Postman API Key (defaults to POSTMAN_API_KEY env var)')
  .option('--collection-id <id>', 'Postman Collection ID (required for upload)')
  .option('--experimental-ast', 'Use AST parsing for robust script conversion (experimental)', false)
  .action(async (input: string, options: ConvertOptions) => {
    await convertCommand(input, options);
  });

program.parse();
