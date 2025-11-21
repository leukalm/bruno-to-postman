import { join } from 'path';
import { readFile, fileExists } from './fileService.js';
import { basename } from 'path';

/**
 * Parse bruno.json metadata file with fallback logic
 * @param directoryPath - The directory containing bruno.json
 * @param cliName - Optional name provided via CLI
 * @returns Collection name and warnings if any
 */
interface RawBrunoCollectionMetadata {
  version?: string;
  name?: string;
  type?: string;
}

export async function parseBrunoJson(
  directoryPath: string,
  cliName?: string
): Promise<{ name: string; warnings: string[] }> {
  const warnings: string[] = [];

  // Priority 1: CLI name override
  if (cliName) {
    return { name: cliName, warnings };
  }

  // Priority 2: bruno.json metadata
  const brunoJsonPath = join(directoryPath, 'bruno.json');
  const exists = await fileExists(brunoJsonPath);

  if (exists) {
    try {
      const content = await readFile(brunoJsonPath);
      const metadata = JSON.parse(content) as RawBrunoCollectionMetadata;

      // Validate schema
      if (!metadata.version || metadata.version !== '1') {
        warnings.push(`bruno.json has invalid version (expected "1", got "${metadata.version}")`);
      }
      if (!metadata.type || metadata.type !== 'collection') {
        warnings.push(`bruno.json has invalid type (expected "collection", got "${metadata.type}")`);
      }
      if (!metadata.name || metadata.name.trim().length === 0) {
        warnings.push('bruno.json has empty name, falling back to directory name');
        return { name: basename(directoryPath), warnings };
      }

      return { name: metadata.name, warnings };
    } catch (error) {
      if (error instanceof Error) {
        warnings.push(`Failed to parse bruno.json: ${error.message}. Using directory name instead.`);
      }
    }
  } else {
    warnings.push('bruno.json not found, using directory name');
  }

  // Priority 3: Directory name fallback
  return { name: basename(directoryPath), warnings };
}
