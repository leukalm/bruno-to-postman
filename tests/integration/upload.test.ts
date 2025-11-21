import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { convertCommand } from '../../src/commands/convertCommand.js';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Upload Integration', () => {
  let testDir: string;
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;
  const originalExit = process.exit;
  const originalEnv = process.env;

  // Mock process.exit to prevent test from exiting
  const mockExit = jest.fn() as unknown as jest.Mock<(code?: number) => never>;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'bruno-upload-test-'));
    global.fetch = mockFetch;
    process.exit = mockExit;
    process.env = { ...originalEnv }; // Reset env vars
    delete process.env.POSTMAN_API_KEY; // Ensure no API key is set
    
    mockFetch.mockClear();
    mockExit.mockClear();
    mockExit.mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    // Create a dummy .bru file for all tests
    const bruContent = `
meta {
  name: Test Request
  type: http
}
get {
  url: https://api.example.com
}
`;
    await writeFile(join(testDir, 'request.bru'), bruContent);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    global.fetch = originalFetch;
    process.exit = originalExit;
    process.env = originalEnv;
  });

  it('should trigger upload when --upload flag is present', async () => {
    // Mock successful upload response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ collection: { uid: '12345' } }),
    } as Response);

    await convertCommand(join(testDir, 'request.bru'), {
      upload: true,
      postmanApiKey: 'test-api-key',
      collectionId: '12345',
      name: 'Test Collection'
    });

    // Verify fetch was called with correct arguments
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.getpostman.com/collections/12345',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'test-api-key',
        },
      })
    );

    // Verify payload contains the collection
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.collection.info.name).toBe('Test Collection');
    expect(body.collection.item[0].name).toBe('Test Request');
  });

  it('should fail if API key is missing', async () => {
    await expect(convertCommand(join(testDir, 'request.bru'), {
      upload: true,
      collectionId: '12345'
    })).rejects.toThrow('process.exit(1)');

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fail if Collection ID is missing', async () => {
    await expect(convertCommand(join(testDir, 'request.bru'), {
      upload: true,
      postmanApiKey: 'key'
    })).rejects.toThrow('process.exit(1)');

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
