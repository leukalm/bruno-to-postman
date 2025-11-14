import { normalize, extname, sep } from 'path';
import { stat, mkdir } from 'fs/promises';

/**
 * Normalize a file path to use forward slashes and remove redundant segments
 * @param path - The path to normalize
 * @returns The normalized path
 */
export function normalizePath(path: string): string {
  // Trim whitespace
  const trimmed = path.trim();

  // First convert all backslashes to forward slashes
  const withForwardSlashes = trimmed.replace(/\\/g, '/');

  // Then normalize the path (removes .., ., and handles slashes)
  let normalized = normalize(withForwardSlashes);

  // Convert any remaining platform-specific separators to forward slashes
  normalized = normalized.split(sep).join('/');

  return normalized;
}

/**
 * Extract the file extension from a path
 * @param path - The file path
 * @returns The file extension including the dot (e.g., '.bru'), or empty string if none
 */
export function getFileExtension(path: string): string {
  return extname(path);
}

/**
 * Check if a path points to a valid directory
 * @param path - The path to check
 * @returns True if the path is a valid directory, false otherwise
 */
export async function isValidDirectory(path: string): Promise<boolean> {
  if (!path) {
    return false;
  }

  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (error) {
    // Path doesn't exist or is inaccessible
    return false;
  }
}

/**
 * Ensure a directory exists, creating it recursively if needed
 * @param path - The directory path to ensure exists
 * @throws Error if the directory cannot be created
 */
export async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create directory ${path}: ${error.message}`);
    }
    throw error;
  }
}
