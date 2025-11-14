import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { convertCommand } from '../../../src/commands/convertCommand.js';
import { readFile, writeFile, fileExists } from '../../../src/services/fileService.js';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('convertCommand (Integration)', () => {
  let testDir: string;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'bruno-convert-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    await rm(testDir, { recursive: true, force: true });
  });

  it('should convert a simple .bru file to Postman collection', async () => {
    const brunoContent = `meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}`;

    const inputPath = join(testDir, 'test.bru');
    const outputPath = join(testDir, 'test.postman_collection.json');

    await writeFile(inputPath, brunoContent);

    await convertCommand(inputPath, {});

    expect(await fileExists(outputPath)).toBe(true);

    const outputContent = await readFile(outputPath);
    const collection = JSON.parse(outputContent);

    expect(collection.info.name).toBe('Get Users');
    expect(collection.item).toHaveLength(1);
    expect(collection.item[0].request.method).toBe('GET');
    expect(collection.item[0].request.url.raw).toBe('https://api.example.com/users');
  });

  it('should respect custom output path', async () => {
    const brunoContent = `meta {
  name: Test Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}`;

    const inputPath = join(testDir, 'input.bru');
    const customOutputPath = join(testDir, 'custom-output.json');

    await writeFile(inputPath, brunoContent);

    await convertCommand(inputPath, { output: customOutputPath });

    expect(await fileExists(customOutputPath)).toBe(true);

    const outputContent = await readFile(customOutputPath);
    const collection = JSON.parse(outputContent);

    expect(collection.info.name).toBe('Test Request');
  });

  it('should convert request with body and headers', async () => {
    const brunoContent = `meta {
  name: Create User
  type: http
  seq: 1
}

post {
  url: https://api.example.com/users
}

headers {
  Content-Type: application/json
  Accept: application/json
}

body:json {
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
}`;

    const inputPath = join(testDir, 'create-user.bru');
    await writeFile(inputPath, brunoContent);

    await convertCommand(inputPath, {});

    const outputPath = join(testDir, 'create-user.postman_collection.json');
    const outputContent = await readFile(outputPath);
    const collection = JSON.parse(outputContent);

    expect(collection.item[0].request.method).toBe('POST');
    expect(collection.item[0].request.header).toHaveLength(2);
    expect(collection.item[0].request.body.mode).toBe('raw');
    expect(collection.item[0].request.body.raw).toContain('John Doe');
  });

  it('should convert request with authentication', async () => {
    const brunoContent = `meta {
  name: Protected Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/protected
}

auth:bearer {
  token: mySecretToken
}`;

    const inputPath = join(testDir, 'protected.bru');
    await writeFile(inputPath, brunoContent);

    await convertCommand(inputPath, {});

    const outputPath = join(testDir, 'protected.postman_collection.json');
    const outputContent = await readFile(outputPath);
    const collection = JSON.parse(outputContent);

    expect(collection.item[0].request.auth.type).toBe('bearer');
    expect(collection.item[0].request.auth.bearer[0].value).toBe('mySecretToken');
  });

  it('should convert request with scripts', async () => {
    const brunoContent = `meta {
  name: Request with Scripts
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}

script:pre-request {
  bru.setVar("timestamp", Date.now());
}

script:test {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
}`;

    const inputPath = join(testDir, 'with-scripts.bru');
    await writeFile(inputPath, brunoContent);

    await convertCommand(inputPath, {});

    const outputPath = join(testDir, 'with-scripts.postman_collection.json');
    const outputContent = await readFile(outputPath);
    const collection = JSON.parse(outputContent);

    expect(collection.item[0].event).toHaveLength(2);

    const preRequestEvent = collection.item[0].event.find((e: any) => e.listen === 'prerequest');
    expect(preRequestEvent.script.exec.join('\n')).toContain('pm.environment.set');

    const testEvent = collection.item[0].event.find((e: any) => e.listen === 'test');
    expect(testEvent.script.exec.join('\n')).toContain('pm.response.code');
  });

  it('should fail for non-existent input file', async () => {
    const nonExistentPath = join(testDir, 'does-not-exist.bru');

    await convertCommand(nonExistentPath, {});

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should fail for invalid input file extension', async () => {
    const invalidPath = join(testDir, 'test.txt');
    await writeFile(invalidPath, 'not a bruno file');

    await convertCommand(invalidPath, {});

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should fail for invalid Bruno syntax', async () => {
    const invalidBruno = `invalid bruno file content`;
    const inputPath = join(testDir, 'invalid.bru');
    await writeFile(inputPath, invalidBruno);

    await convertCommand(inputPath, {});

    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
