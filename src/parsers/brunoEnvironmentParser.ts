import { BrunoEnvironment, BrunoVariable } from '../types/bruno.types.js';

/**
 * Parse a Bruno environment file content into a BrunoEnvironment object
 * @param content - The content of the .bru file
 * @returns Parsed BrunoEnvironment
 * @throws Error if the file is invalid
 */
export function parseBrunoEnvironmentFile(content: string): BrunoEnvironment {
  const lines = content.split('\n');
  let state: 'IDLE' | 'IN_VARS' = 'IDLE';
  let braceDepth = 0;
  
  // Collected data
  const variables: BrunoVariable[] = [];
  const name = 'Unknown Environment'; // Name is usually inferred from filename, but we return a structure that fits

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments in IDLE state
    if (state === 'IDLE' && (!trimmed || trimmed.startsWith('//'))) {
      continue;
    }

    // Detect vars section start
    if (trimmed === 'vars {' && braceDepth === 0) {
      state = 'IN_VARS';
      braceDepth = 1;
      continue;
    }

    // Track brace depth
    if (trimmed.includes('{')) {
      braceDepth += (trimmed.match(/{/g) || []).length;
    }
    if (trimmed.includes('}')) {
      braceDepth -= (trimmed.match(/}/g) || []).length;
    }

    // Section end
    if (braceDepth === 0 && state === 'IN_VARS') {
      state = 'IDLE';
      continue;
    }

    // Parse vars content
    if (state === 'IN_VARS' && braceDepth > 0) {
      // Format: key: value
      // or secret key: value
      
      // Skip braces on their own lines if any
      if (trimmed === '{' || trimmed === '}') continue;

      let isSecret = false;
      let lineToParse = trimmed;

      if (lineToParse.startsWith('secret ')) {
        isSecret = true;
        lineToParse = lineToParse.substring(7).trim();
      }

      const colonIndex = lineToParse.indexOf(':');
      if (colonIndex !== -1) {
        const key = lineToParse.slice(0, colonIndex).trim();
        const value = lineToParse.slice(colonIndex + 1).trim();

        variables.push({
          key,
          value,
          enabled: true,
          type: isSecret ? 'secret' : 'text',
        });
      }
    }
  }

  return {
    name, // Will be populated by the caller using the filename
    variables,
  };
}
