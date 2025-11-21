import { readFile, writeFile, fileExists } from '../services/fileService.js';
import { Logger } from '../services/logger.js';
import { parseBrunoFile } from '../parsers/brunoParser.js';
import { validateBrunoRequest } from '../validators/brunoValidator.js';
import { buildPostmanCollection } from '../builders/collectionBuilder.js';
import { validatePostmanCollection } from '../validators/postmanValidator.js';
import { getFileExtension, normalizePath } from '../utils/pathUtils.js';
import { scanDirectory } from '../services/directoryScanner.js';
import { parseBrunoJson } from '../services/brunoJsonParser.js';
import { buildFileTree } from '../utils/fileTreeBuilder.js';
import { FileTreeNode, BatchConversionReport, ConversionError } from '../types/brunoCollection.types.js';
import { parseBrunoEnvironmentFile } from '../parsers/brunoEnvironmentParser.js';
import { convertBrunoEnvironmentToPostman } from '../converters/environmentConverter.js';
import { stat } from 'fs/promises';
import path from 'path';

export interface ConvertOptions {
  output?: string;
  verbose?: boolean;
  json?: boolean;
  experimentalAst?: boolean;
  name?: string; // Custom collection name (CLI override)
  env?: boolean;
}

/**
 * Convert a Bruno .bru file or directory to a Postman collection
 * @param inputPath - Path to the .bru file or directory
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

    logger.verbose(`Input path: ${normalizedInput}`);

    // Check if input exists
    if (!(await fileExists(normalizedInput))) {
      logger.error(`Input not found: ${normalizedInput}`);
      process.exit(1);
    }

    // Check if input is a directory or file
    const stats = await stat(normalizedInput);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
      // Directory batch conversion
      await convertDirectory(normalizedInput, options, logger);
    } else {
      // Single file conversion
      await convertSingleFile(normalizedInput, options, logger);
    }
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

/**
 * Convert a single .bru file to a Postman collection
 * @param filePath - Path to the .bru file
 * @param options - Conversion options
 * @param logger - Logger instance
 */
async function convertSingleFile(
  filePath: string,
  options: ConvertOptions,
  logger: Logger
): Promise<void> {
  // Validate input file extension
  const inputExt = getFileExtension(filePath);
  if (inputExt !== '.bru') {
    logger.error(`Invalid input file: Expected .bru file, got ${inputExt}`);
    process.exit(1);
  }

  // Read Bruno file
  logger.verbose('Reading Bruno file...');
  const brunoContent = await readFile(filePath);
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
  const collectionName = options.name || brunoRequest.meta.name || path.basename(filePath, '.bru');
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
    const inputDir = path.dirname(filePath);
    const inputBase = path.basename(filePath, '.bru');
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
}

/**
 * Convert a directory of .bru files to a Postman collection
 * @param directoryPath - Path to the directory
 * @param options - Conversion options
 * @param logger - Logger instance
 */
async function convertDirectory(
  directoryPath: string,
  options: ConvertOptions,
  logger: Logger
): Promise<void> {
  const startTime = Date.now();

  // Scan directory for .bru files
  logger.verbose('Scanning directory for .bru files...');
  const files = await scanDirectory(directoryPath);
  logger.verbose(`Found ${files.length} .bru files`);

  // Filter out environment files (usually in environments/ folder)
  // We don't want to try to convert them as requests
  const requestFiles = files.filter(f => !f.includes('/environments/') && !f.includes('\\environments\\'));
  
  if (files.length > requestFiles.length) {
    logger.verbose(`Excluded ${files.length - requestFiles.length} environment files from request conversion`);
  }

  // AC7: Handle empty directory
  if (requestFiles.length === 0) {
    logger.error(`No .bru request files found in ${directoryPath}`);
    process.exit(1);
  }

  // Parse bruno.json for collection name (AC4, AC5)
  logger.verbose('Parsing collection metadata...');
  const { name: collectionName, warnings } = await parseBrunoJson(directoryPath, options.name);
  logger.verbose(`Collection name: ${collectionName}`);

  // Display warnings
  for (const warning of warnings) {
    logger.warn(warning);
  }

  // Build file tree (AC2, AC3)
  logger.verbose('Building file tree...');
  const fileTree = buildFileTree(requestFiles, directoryPath);
  logger.verbose(`Built file tree with ${fileTree.children.length} top-level items`);

  // Convert files and collect errors (AC8)
  const errors: ConversionError[] = [];
  let successCount = 0;
  const useAST = options.experimentalAst || false;

  logger.verbose('Converting files...');
  await processFileTree(fileTree, errors, logger, useAST);

  // Count successes
  successCount = requestFiles.length - errors.length;

  // Build Postman collection
  logger.verbose('Building Postman collection from file tree...');
  const collection = buildPostmanCollection(collectionName, fileTree, useAST);
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
    outputPath = path.join(directoryPath, `${collectionName}.postman_collection.json`);
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

  // Handle environment conversion if requested
  if (options.env) {
    logger.verbose('Scanning for environment files...');
    // Look for environments folder or .bru files that look like environments
    // For now, we'll scan the whole directory for .bru files again, but check if they are environments
    // Ideally, we should have identified them during the initial scan, but scanDirectory returns file paths.
    // We can re-use the files list if we want, but we need to parse them to know if they are environments.
    // However, typical Bruno structure has an 'environments' folder.
    
    const envDir = path.join(directoryPath, 'environments');
    if (await fileExists(envDir)) {
      const envFiles = await scanDirectory(envDir);
      logger.verbose(`Found ${envFiles.length} potential environment files in environments/`);
      
      for (const envFile of envFiles) {
        try {
          if (getFileExtension(envFile) !== '.bru') continue;
          
          const content = await readFile(envFile);
          // We try to parse as environment. If it fails or doesn't look like one, we skip.
          // Our parser is lenient, but let's check if it has vars.
          if (!content.includes('vars {')) {
             continue;
          }
          
          const brunoEnv = parseBrunoEnvironmentFile(content);
          // Use filename as name if not parsed (though parser currently doesn't extract name from file content usually)
          brunoEnv.name = path.basename(envFile, '.bru');
          
          const postmanEnv = convertBrunoEnvironmentToPostman(brunoEnv);
          
          const envOutputPath = path.join(directoryPath, `${brunoEnv.name}.postman_environment.json`);
          await writeFile(envOutputPath, JSON.stringify(postmanEnv, null, 2));
          logger.success(`Converted environment: ${envOutputPath}`);
          
        } catch (err) {
          logger.warn(`Failed to convert environment ${envFile}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
        logger.verbose('No environments folder found, skipping environment conversion');
    }
  }

  // Generate report (AC8)
  const duration = Date.now() - startTime;
  const report: BatchConversionReport = {
    totalFiles: requestFiles.length,
    successCount,
    failureCount: errors.length,
    duration,
    errors,
    warnings,
    outputPath,
    successRate: requestFiles.length > 0 ? (successCount / requestFiles.length) * 100 : 0,
  };

  // Display report
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    displayTextReport(report, logger);
  }

  // Exit with appropriate code
  if (errors.length > 0) {
    process.exit(1);
  }
}

/**
 * Recursively process file tree and parse Bruno files
 * @param node - Current file tree node
 * @param errors - Array to collect errors
 * @param logger - Logger instance
 * @param useAST - Use AST-based script conversion
 */
async function processFileTree(
  node: FileTreeNode,
  errors: ConversionError[],
  logger: Logger,
  useAST: boolean
): Promise<void> {
  if (node.type === 'file') {
    // Parse the .bru file
    try {
      logger.verbose(`Processing: ${node.path}`);
      const content = await readFile(node.path);
      const brunoRequest = parseBrunoFile(content);
      validateBrunoRequest(brunoRequest);
      node.brunoRequest = brunoRequest;
    } catch (error) {
      // Collect error instead of failing
      const conversionError: ConversionError = {
        filePath: node.path,
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'parse',
        phase: 'parse',
        isRecoverable: true,
        suggestion: 'Check the .bru file syntax and ensure all required sections are present',
      };
      errors.push(conversionError);
      logger.verbose(`Failed to process: ${node.path}`);
    }
  } else {
    // Recursively process children
    for (const child of node.children) {
      await processFileTree(child, errors, logger, useAST);
    }
  }
}

/**
 * Display batch conversion report in text format
 * @param report - Batch conversion report
 * @param logger - Logger instance
 */
function displayTextReport(report: BatchConversionReport, logger: Logger): void {
  console.log('\nBatch Conversion Report');
  console.log('=======================\n');
  console.log('Summary:');
  console.log(`  Total files: ${report.totalFiles}`);
  console.log(`  Successful: ${report.successCount} (${report.successRate.toFixed(1)}%)`);
  console.log(`  Failed: ${report.failureCount} (${(100 - report.successRate).toFixed(1)}%)`);
  console.log(`  Duration: ${(report.duration / 1000).toFixed(2)}s`);

  if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.filePath}`);
      console.log(`     ${error.message}`);
      if (error.suggestion) {
        console.log(`     Suggestion: ${error.suggestion}`);
      }
    });
  }

  if (report.successCount > 0) {
    logger.success(`\nConversion completed: ${report.outputPath}`);
  }
}
