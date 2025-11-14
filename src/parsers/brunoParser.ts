import {
  BrunoRequest,
  BrunoMeta,
  BrunoHeader,
  BrunoQueryParam,
  BrunoBody,
  BrunoAuth,
  HttpMethod,
} from '../types/bruno.types.js';

type ParserState =
  | 'IDLE'
  | 'IN_META'
  | 'IN_METHOD'
  | 'IN_HEADERS'
  | 'IN_QUERY_PARAMS'
  | 'IN_PATH_PARAMS'
  | 'IN_BODY'
  | 'IN_AUTH'
  | 'IN_PRE_REQUEST_SCRIPT'
  | 'IN_TESTS'
  | 'IN_DOCS';

/**
 * Parse a Bruno file content into a BrunoRequest object
 * @param content - The content of the .bru file
 * @returns Parsed BrunoRequest
 * @throws Error if the file is invalid
 */
export function parseBrunoFile(content: string): BrunoRequest {
  const lines = content.split('\n');
  let state: ParserState = 'IDLE';
  let braceDepth = 0;
  let currentSection: string[] = [];
  let currentSectionName = '';

  // Collected data
  let meta: BrunoMeta | null = null;
  let method: HttpMethod | null = null;
  let url = '';
  const headers: BrunoHeader[] = [];
  const queryParams: BrunoQueryParam[] = [];
  const pathParams: BrunoQueryParam[] = [];
  let body: BrunoBody | undefined;
  let auth: BrunoAuth | undefined;
  let preRequestScript: string | undefined;
  let testScript: string | undefined;
  let docs: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments in IDLE state
    if (state === 'IDLE' && (!trimmed || trimmed.startsWith('//'))) {
      continue;
    }

    // Detect section start
    if (trimmed.endsWith('{') && braceDepth === 0) {
      const sectionName = trimmed.slice(0, -1).trim();
      currentSectionName = sectionName;
      currentSection = [];
      braceDepth = 1;

      // Determine state based on section name
      if (sectionName === 'meta') {
        state = 'IN_META';
      } else if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(sectionName)) {
        state = 'IN_METHOD';
        method = sectionName.toUpperCase() as HttpMethod;
      } else if (sectionName === 'headers') {
        state = 'IN_HEADERS';
      } else if (sectionName === 'params:query') {
        state = 'IN_QUERY_PARAMS';
      } else if (sectionName === 'params:path') {
        state = 'IN_PATH_PARAMS';
      } else if (sectionName.startsWith('body:')) {
        state = 'IN_BODY';
      } else if (sectionName.startsWith('auth:')) {
        state = 'IN_AUTH';
      } else if (sectionName === 'script:pre-request') {
        state = 'IN_PRE_REQUEST_SCRIPT';
      } else if (sectionName === 'tests' || sectionName === 'script:test') {
        state = 'IN_TESTS';
      } else if (sectionName === 'docs') {
        state = 'IN_DOCS';
      }
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
    if (braceDepth === 0 && state !== 'IDLE') {
      // Process collected section
      switch (state) {
        case 'IN_META':
          meta = parseMetaSection(currentSection);
          break;
        case 'IN_METHOD':
          url = parseMethodSection(currentSection);
          break;
        case 'IN_HEADERS':
          headers.push(...parseHeadersSection(currentSection));
          break;
        case 'IN_QUERY_PARAMS':
          queryParams.push(...parseQueryParamsSection(currentSection));
          break;
        case 'IN_PATH_PARAMS':
          pathParams.push(...parseQueryParamsSection(currentSection));
          break;
        case 'IN_BODY':
          body = parseBodySection(currentSection, currentSectionName);
          break;
        case 'IN_AUTH':
          auth = parseAuthSection(currentSection, currentSectionName);
          break;
        case 'IN_PRE_REQUEST_SCRIPT':
          preRequestScript = currentSection.join('\n');
          break;
        case 'IN_TESTS':
          testScript = currentSection.join('\n');
          break;
        case 'IN_DOCS':
          docs = currentSection.join('\n');
          break;
      }

      state = 'IDLE';
      currentSection = [];
      currentSectionName = '';
      continue;
    }

    // Collect section content
    if (state !== 'IDLE' && braceDepth > 0) {
      currentSection.push(line);
    }
  }

  // Validation
  if (!meta) {
    throw new Error('Invalid Bruno file: missing meta section');
  }
  if (!method) {
    throw new Error('Invalid Bruno file: missing HTTP method section');
  }
  if (!url) {
    throw new Error('Invalid Bruno file: missing URL in method section');
  }

  return {
    meta,
    method,
    url,
    headers,
    queryParams,
    pathParams,
    body,
    auth,
    preRequestScript,
    testScript,
    docs,
  };
}

/**
 * Parse the meta section
 */
function parseMetaSection(lines: string[]): BrunoMeta {
  const meta: Partial<BrunoMeta> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (key === 'name') {
      meta.name = value;
    } else if (key === 'type') {
      meta.type = value as 'http' | 'graphql';
    } else if (key === 'seq') {
      meta.seq = parseInt(value, 10);
    }
  }

  if (!meta.name || !meta.type) {
    throw new Error('Invalid meta section: name and type are required');
  }

  return meta as BrunoMeta;
}

/**
 * Parse the HTTP method section (get/post/put/delete/etc.)
 */
function parseMethodSection(lines: string[]): string {
  let url = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (key === 'url') {
      url = value;
    }
  }

  return url;
}

/**
 * Parse the headers section
 */
function parseHeadersSection(lines: string[]): BrunoHeader[] {
  const headers: BrunoHeader[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    headers.push({
      key,
      value,
      enabled: true,
    });
  }

  return headers;
}

/**
 * Parse query parameters or path parameters section
 */
function parseQueryParamsSection(lines: string[]): BrunoQueryParam[] {
  const params: BrunoQueryParam[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    params.push({
      key,
      value,
      enabled: true,
    });
  }

  return params;
}

/**
 * Parse body section (body:json, body:xml, body:text, etc.)
 */
function parseBodySection(lines: string[], sectionName: string): BrunoBody {
  const modeMatch = sectionName.match(/body:(\w+)/);
  const mode = modeMatch ? modeMatch[1] : 'none';

  // Simply join all lines as content
  // The section delimiter braces are already filtered out by the main parser
  // (only lines with braceDepth > 0 are included)
  const content = lines.join('\n');

  return {
    mode: mode as BrunoBody['mode'],
    content,
  };
}

/**
 * Parse authentication section (auth:basic, auth:bearer, auth:apikey)
 */
function parseAuthSection(lines: string[], sectionName: string): BrunoAuth {
  const typeMatch = sectionName.match(/auth:(\w+)/);
  const type = typeMatch ? typeMatch[1] : 'none';

  const auth: BrunoAuth = {
    type: type as BrunoAuth['type'],
  };

  // Parse auth details
  const details: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    details[key] = value;
  }

  // Map to specific auth types
  if (type === 'basic') {
    auth.basic = {
      username: details.username || '',
      password: details.password || '',
    };
  } else if (type === 'bearer') {
    auth.bearer = {
      token: details.token || '',
    };
  } else if (type === 'apikey') {
    auth.apikey = {
      key: details.key || '',
      value: details.value || '',
      in: (details.in as 'header' | 'query') || 'header',
    };
  }

  return auth;
}
