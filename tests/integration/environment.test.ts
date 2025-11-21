import { describe, it, expect } from '@jest/globals';
import { parseBrunoEnvironmentFile } from '../../src/parsers/brunoEnvironmentParser.js';
import { convertBrunoEnvironmentToPostman } from '../../src/converters/environmentConverter.js';

describe('Environment Conversion', () => {
  it('should parse and convert a Bruno environment file to Postman format', () => {
    // Given: A Bruno environment file content
    const brunoEnvContent = `vars {
  baseUrl: https://api.example.com
  apiKey: 123456
  secret secretKey: mySecretKey
}`;

    // When: Parsed and converted
    const brunoEnv = parseBrunoEnvironmentFile(brunoEnvContent);
    brunoEnv.name = 'TestEnv'; // Name is usually set from filename in CLI
    
    const postmanEnv = convertBrunoEnvironmentToPostman(brunoEnv);

    // Then: Valid Postman environment is produced
    expect(postmanEnv.name).toBe('TestEnv');
    expect(postmanEnv._postman_variable_scope).toBe('environment');
    expect(postmanEnv.values).toHaveLength(3);

    const baseUrl = postmanEnv.values.find(v => v.key === 'baseUrl');
    expect(baseUrl).toBeDefined();
    expect(baseUrl?.value).toBe('https://api.example.com');
    expect(baseUrl?.type).toBe('default');
    expect(baseUrl?.enabled).toBe(true);

    const secretKey = postmanEnv.values.find(v => v.key === 'secretKey');
    expect(secretKey).toBeDefined();
    expect(secretKey?.value).toBe('mySecretKey');
    expect(secretKey?.type).toBe('secret');
  });

  it('should handle empty environment files', () => {
    const brunoEnvContent = `vars {
}`;
    const brunoEnv = parseBrunoEnvironmentFile(brunoEnvContent);
    brunoEnv.name = 'EmptyEnv';
    const postmanEnv = convertBrunoEnvironmentToPostman(brunoEnv);

    expect(postmanEnv.values).toHaveLength(0);
  });
});
