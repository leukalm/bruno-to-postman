import { BrunoEnvironment } from '../types/bruno.types.js';
import { PostmanEnvironment, PostmanEnvironmentValue } from '../types/postman.types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Convert a Bruno environment to a Postman environment
 * @param brunoEnv - The Bruno environment to convert
 * @returns The converted Postman environment
 */
export function convertBrunoEnvironmentToPostman(brunoEnv: BrunoEnvironment): PostmanEnvironment {
  const values: PostmanEnvironmentValue[] = brunoEnv.variables.map((variable) => ({
    key: variable.key,
    value: variable.value,
    enabled: variable.enabled,
    type: variable.type === 'secret' ? 'secret' : 'default',
  }));

  return {
    id: uuidv4(),
    name: brunoEnv.name,
    values,
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: 'bruno-to-postman',
  };
}
