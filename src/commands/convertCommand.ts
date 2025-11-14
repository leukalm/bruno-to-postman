import { readFile, writeFile, fileExists } from '../services/fileService.js';
import { Logger } from '../services/logger.js';
import { parseBrunoFile } from '../parsers/brunoParser.js';
import { validateBrunoRequest } from '../validators/brunoValidator.js';
import { buildPostmanCollection } from '../builders/collectionBuilder.js';
import { validatePostmanCollection } from '../validators/postmanValidator.js';
import { getFileExtension, normalizePath } from '../utils/pathUtils.js';
import path from 'path';

export interface ConvertOptions {
  output?: string;
  verbose?: boolean;
  json?: boolean;
  experimentalAst?: boolean;
}

/**
 * Convert a Bruno .bru file to a Postman collection
 * @param inputPath - Path to the .bru file
 * @param options - Conversion options
 */
export async function convertCommand(inputPath: string, options: ConvertOptions): Promise<void> {
  const logger = new Logger({
    jsonOutput: options.json || false,
    verbose: options.verbose || false,
  });

  try {
    // Normalize and validate input path
    const normalizedInput = normalizePath(inputPath);

    logger.verbose(`Input file: ${normalizedInput}`);

    // Check if input file exists
    if (!(await fileExists(normalizedInput))) {
      logger.error(`Input file not found: ${normalizedInput}`);
      process.exit(1);
    }

    // Validate input file extension
    const inputExt = getFileExtension(normalizedInput);
    if (inputExt !== '.bru') {
      logger.error(`Invalid input file: Expected .bru file, got ${inputExt}`);
      process.exit(1);
    }

    // Read Bruno file
    logger.verbose('Reading Bruno file...');
    const brunoContent = await readFile(normalizedInput);
    logger.verbose(`Read ${brunoContent.length} characters`);

    // Parse Bruno file
    logger.verbose('Parsing Bruno file...');
    const brunoRequest = parseBrunoFile(brunoContent);
    logger.verbose(`Parsed request: ${brunoRequest.method} ${brunoRequest.url}`);

    // Validate Bruno request
    logger.verbose('Validating Bruno request...');
    validateBrunoRequest(brunoRequest);
    logger.verbose('Bruno request is valid');

    // Build Postman collection
    logger.verbose('Building Postman collection...');
    const collectionName = brunoRequest.meta.name || path.basename(normalizedInput, '.bru');
    const useAST = options.experimentalAst || false;

    if (useAST) {
      logger.verbose('Using experimental AST-based script conversion');
    }

    const collection = buildPostmanCollection(
      collectionName,
      [
        {
          name: brunoRequest.meta.name,
          request: brunoRequest,
        },
      ],
      useAST
    );
    logger.verbose(`Built collection: ${collection.info.name}`);

    // Validate Postman collection
    logger.verbose('Validating Postman collection...');
    const validatedCollection = validatePostmanCollection(collection);
    logger.verbose('Postman collection is valid');

    // Determine output path
    let outputPath: string;
    if (options.output) {
      outputPath = normalizePath(options.output);
    } else {
      const inputDir = path.dirname(normalizedInput);
      const inputBase = path.basename(normalizedInput, '.bru');
      outputPath = path.join(inputDir, `${inputBase}.postman_collection.json`);
    }

    logger.verbose(`Output file: ${outputPath}`);

    // Validate output file extension
    const outputExt = getFileExtension(outputPath);
    if (outputExt !== '.json') {
      logger.error(`Invalid output file: Expected .json file, got ${outputExt}`);
      process.exit(1);
    }

    // Write Postman collection
    logger.verbose('Writing Postman collection...');
    const jsonContent = JSON.stringify(validatedCollection, null, 2);
    await writeFile(outputPath, jsonContent);
    logger.verbose(`Wrote ${jsonContent.length} characters`);

    // Success
    logger.success(`Conversion successful: ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Conversion failed: ${error.message}`);
      if (options.verbose) {
        logger.error(error.stack || '');
      }
    } else {
      logger.error(`Conversion failed with unknown error`);
    }
    process.exit(1);
  }
}
