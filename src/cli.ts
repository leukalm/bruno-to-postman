#!/usr/bin/env node

import { Command } from 'commander';
import { convertCommand } from './commands/convertCommand.js';
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
  .description('Convert a Bruno .bru file to a Postman collection')
  .option('-o, --output <path>', 'Output file path (default: <input>.postman_collection.json)')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--json', 'Output logs in JSON format', false)
  .option('--experimental-ast', 'Use AST parsing for robust script conversion (experimental)', false)
  .action(async (input: string, options: any) => {
    await convertCommand(input, options);
  });

program.parse();
