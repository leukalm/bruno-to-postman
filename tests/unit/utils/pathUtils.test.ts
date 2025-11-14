import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, rmdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  normalizePath,
  getFileExtension,
  isValidDirectory,
  ensureDirectoryExists,
} from '../../../src/utils/pathUtils.js';

describe('pathUtils', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `bruno-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      rmdirSync(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('normalizePath', () => {
    it('should normalize absolute paths', () => {
      const path = '/path/to/file.bru';
      const normalized = normalizePath(path);
      expect(normalized).toBe('/path/to/file.bru');
    });

    it('should normalize relative paths', () => {
      const path = './path/../to/file.bru';
      const normalized = normalizePath(path);
      expect(normalized).toContain('to/file.bru');
      expect(normalized).not.toContain('..');
    });

    it('should handle paths with backslashes (Windows)', () => {
      const path = 'path\\to\\file.bru';
      const normalized = normalizePath(path);
      // Should always convert to forward slashes for consistency
      expect(normalized).toBe('path/to/file.bru');
    });

    it('should handle paths with multiple slashes', () => {
      const path = '/path//to///file.bru';
      const normalized = normalizePath(path);
      expect(normalized).toBe('/path/to/file.bru');
    });

    it('should trim whitespace', () => {
      const path = '  /path/to/file.bru  ';
      const normalized = normalizePath(path);
      expect(normalized).toBe('/path/to/file.bru');
    });
  });

  describe('getFileExtension', () => {
    it('should extract .bru extension', () => {
      const ext = getFileExtension('/path/to/file.bru');
      expect(ext).toBe('.bru');
    });

    it('should extract .json extension', () => {
      const ext = getFileExtension('/path/to/collection.json');
      expect(ext).toBe('.json');
    });

    it('should handle files without extension', () => {
      const ext = getFileExtension('/path/to/file');
      expect(ext).toBe('');
    });

    it('should handle hidden files', () => {
      const ext = getFileExtension('/path/to/.gitignore');
      // extname returns '' for files starting with dot without other extension
      expect(ext).toBe('');
    });

    it('should handle files with multiple dots', () => {
      const ext = getFileExtension('/path/to/file.test.ts');
      expect(ext).toBe('.ts');
    });

    it('should return empty string for directories ending with dot', () => {
      const ext = getFileExtension('/path/to/directory.');
      expect(ext).toBe('.');
    });
  });

  describe('isValidDirectory', () => {
    it('should return true for existing directory', async () => {
      const result = await isValidDirectory(testDir);
      expect(result).toBe(true);
    });

    it('should return false for non-existent directory', async () => {
      const nonExistent = join(testDir, 'non-existent');
      const result = await isValidDirectory(nonExistent);
      expect(result).toBe(false);
    });

    it('should return false for a file', async () => {
      const filePath = join(testDir, 'test-file.txt');
      writeFileSync(filePath, 'test content');

      const result = await isValidDirectory(filePath);
      expect(result).toBe(false);

      unlinkSync(filePath);
    });

    it('should return false for empty path', async () => {
      const result = await isValidDirectory('');
      expect(result).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = join(testDir, 'new-directory');
      await ensureDirectoryExists(newDir);

      const exists = await isValidDirectory(newDir);
      expect(exists).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      await expect(ensureDirectoryExists(testDir)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedDir = join(testDir, 'level1', 'level2', 'level3');
      await ensureDirectoryExists(nestedDir);

      const exists = await isValidDirectory(nestedDir);
      expect(exists).toBe(true);
    });

    it('should throw error for invalid path', async () => {
      // Null byte is invalid in paths
      const invalidPath = 'invalid\x00path';
      await expect(ensureDirectoryExists(invalidPath)).rejects.toThrow();
    });
  });
});
