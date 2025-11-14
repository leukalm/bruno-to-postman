import { readFile as fsReadFile, writeFile as fsWriteFile, access } from 'fs/promises';
import { dirname } from 'path';
import { ensureDirectoryExists } from '../utils/pathUtils.js';

/**
 * Read a file from the filesystem with UTF-8 encoding
 * @param path - The file path to read
 * @returns The file content as a string
 * @throws Error if the file cannot be read
 */
export async function readFile(path: string): Promise<string> {
  try {
    const content = await fsReadFile(path, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Write content to a file with UTF-8 encoding
 * Creates parent directories if they don't exist
 * @param path - The file path to write to
 * @param content - The content to write
 * @throws Error if the file cannot be written
 */
export async function writeFile(path: string, content: string): Promise<void> {
  try {
    // Ensure parent directory exists
    const dir = dirname(path);
    await ensureDirectoryExists(dir);

    // Write the file
    await fsWriteFile(path, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a file or directory exists
 * @param path - The path to check
 * @returns True if the path exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  if (!path) {
    return false;
  }

  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
