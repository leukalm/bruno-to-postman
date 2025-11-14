import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdirSync, rmdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, writeFile, fileExists } from '../../src/services/fileService.js';

describe('fileService (Contract Tests)', () => {
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

  describe('readFile', () => {
    it('should read a .bru file with UTF-8 encoding', async () => {
      const filePath = join(testDir, 'test.bru');
      const content = 'meta {\n  name: Test Request\n}\n\nget {\n  url: https://api.example.com\n}';
      writeFileSync(filePath, content, 'utf-8');

      const result = await readFile(filePath);
      expect(result).toBe(content);
    });

    it('should handle UTF-8 special characters', async () => {
      const filePath = join(testDir, 'test.bru');
      const content = 'meta {\n  name: Test Request 测试 🚀\n}';
      writeFileSync(filePath, content, 'utf-8');

      const result = await readFile(filePath);
      expect(result).toContain('测试');
      expect(result).toContain('🚀');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = join(testDir, 'non-existent.bru');
      await expect(readFile(filePath)).rejects.toThrow();
    });

    it('should throw error for permission denied', async () => {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        return;
      }

      const filePath = join(testDir, 'no-permission.bru');
      writeFileSync(filePath, 'test content', 'utf-8');
      chmodSync(filePath, 0o000); // Remove all permissions

      await expect(readFile(filePath)).rejects.toThrow();

      // Restore permissions for cleanup
      chmodSync(filePath, 0o644);
    });

    it('should read empty file', async () => {
      const filePath = join(testDir, 'empty.bru');
      writeFileSync(filePath, '', 'utf-8');

      const result = await readFile(filePath);
      expect(result).toBe('');
    });
  });

  describe('writeFile', () => {
    it('should write a .json file with UTF-8 encoding', async () => {
      const filePath = join(testDir, 'output.json');
      const content = JSON.stringify({ name: 'Test Collection', item: [] }, null, 2);

      await writeFile(filePath, content);

      const result = await readFile(filePath);
      expect(result).toBe(content);
    });

    it('should handle UTF-8 special characters', async () => {
      const filePath = join(testDir, 'output.json');
      const content = JSON.stringify({ name: 'Collection 测试 🚀' });

      await writeFile(filePath, content);

      const result = await readFile(filePath);
      const parsed = JSON.parse(result) as { name: string };
      expect(parsed.name).toContain('测试');
      expect(parsed.name).toContain('🚀');
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = join(testDir, 'nested', 'dir', 'output.json');
      const content = '{"test": true}';

      await writeFile(filePath, content);

      const result = await readFile(filePath);
      expect(result).toBe(content);
    });

    it('should overwrite existing file', async () => {
      const filePath = join(testDir, 'output.json');
      await writeFile(filePath, 'first content');
      await writeFile(filePath, 'second content');

      const result = await readFile(filePath);
      expect(result).toBe('second content');
    });

    it('should throw error for permission denied', async () => {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        return;
      }

      const dirPath = join(testDir, 'no-write-dir');
      mkdirSync(dirPath);
      chmodSync(dirPath, 0o444); // Read-only directory

      const filePath = join(dirPath, 'output.json');
      await expect(writeFile(filePath, 'test content')).rejects.toThrow();

      // Restore permissions for cleanup
      chmodSync(dirPath, 0o755);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'exists.txt');
      writeFileSync(filePath, 'content');

      const result = await fileExists(filePath);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = join(testDir, 'does-not-exist.txt');
      const result = await fileExists(filePath);
      expect(result).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const result = await fileExists(testDir);
      expect(result).toBe(true);
    });

    it('should return false for empty path', async () => {
      const result = await fileExists('');
      expect(result).toBe(false);
    });
  });

  describe('UTF-8 encoding validation', () => {
    it('should correctly read and write complex UTF-8 content', async () => {
      const filePath = join(testDir, 'utf8-test.bru');
      const content = `meta {
  name: Complex UTF-8 Test 测试
  emoji: 🚀 💻 ✅
  special: Café résumé naïve
}

get {
  url: https://api.example.com/users
}`;

      await writeFile(filePath, content);
      const result = await readFile(filePath);

      expect(result).toContain('测试');
      expect(result).toContain('🚀 💻 ✅');
      expect(result).toContain('Café résumé naïve');
    });
  });
});
