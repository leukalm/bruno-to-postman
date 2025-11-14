import { glob } from 'glob';
import { stat } from 'fs/promises';

/**
 * Scan a directory for .bru files recursively
 * @param directoryPath - The directory to scan
 * @returns Array of absolute paths to .bru files
 * @throws Error if directory doesn't exist or permission denied
 */
export async function scanDirectory(directoryPath: string): Promise<string[]> {
  try {
    // Verify directory exists and is accessible
    const stats = await stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${directoryPath}`);
    }

    // Scan for .bru files with protection against symlinks and depth limit
    const files = await glob('**/*.bru', {
      cwd: directoryPath,
      absolute: true,
      follow: false, // Don't follow symlinks for security
      maxDepth: 20, // Limit directory traversal depth
      nodir: true, // Only return files, not directories
      dot: false, // Don't include hidden files
    });

    return files.sort(); // Sort for consistent ordering
  } catch (error) {
    if (error instanceof Error) {
      // Handle permission errors
      if ('code' in error && error.code === 'EACCES') {
        throw new Error(`Permission denied accessing directory: ${directoryPath}`);
      }
      // Handle not found errors
      if ('code' in error && error.code === 'ENOENT') {
        throw new Error(`Directory not found: ${directoryPath}`);
      }
      throw new Error(`Failed to scan directory ${directoryPath}: ${error.message}`);
    }
    throw error;
  }
}
