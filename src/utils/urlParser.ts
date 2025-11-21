import { ParsedUrl } from '../types/cli.types.js';

/**
 * Parse a URL string into components for Postman format
 * Handles variables in the format {{variableName}}
 * @param rawUrl - The raw URL string
 * @returns Parsed URL components
 */
export function parseUrl(rawUrl: string): ParsedUrl {
  const result: ParsedUrl = {
    raw: rawUrl,
    host: [],
    path: [],
    query: [],
    variables: [],
  };

  // Extract all variables from the URL
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = variableRegex.exec(rawUrl)) !== null) {
    variables.add(match[1]);
  }
  result.variables = Array.from(variables);

  // Try to parse the URL
  try {
    // Handle URLs that start with variables
    let urlToParse = rawUrl;

    // If URL starts with {{variable}}, we need special handling
    if (rawUrl.startsWith('{{')) {
      // For variable-based URLs, we can't use URL parser reliably
      // Extract parts manually

      // Extract hash if present
      const hashIndex = rawUrl.indexOf('#');
      if (hashIndex !== -1) {
        result.hash = rawUrl.slice(hashIndex + 1);
        urlToParse = rawUrl.slice(0, hashIndex);
      }

      // Extract query parameters
      const queryIndex = urlToParse.indexOf('?');
      if (queryIndex !== -1) {
        const queryString = urlToParse.slice(queryIndex + 1);
        result.query = parseQueryString(queryString);
        urlToParse = urlToParse.slice(0, queryIndex);
      }

      // Split by / to get host and path
      const parts = urlToParse.split('/').filter((p) => p);
      if (parts.length > 0) {
        // First part is likely the host (with variable)
        result.host = [parts[0]];
        // Rest are path segments
        result.path = parts.slice(1);
      }

      return result;
    }

    // Try standard URL parsing
    const url = new URL(rawUrl.replace(/\{\{/g, '__var__').replace(/\}\}/g, '__'));

    // Restore variables in parsed components
    const restoreVariables = (str: string): string => {
      return str.replace(/__var__(\w+)__/gi, '{{$1}}');
    };

    // Protocol
    if (url.protocol) {
      result.protocol = url.protocol.replace(':', '');
    }

    // Host
    if (url.hostname) {
      result.host = [restoreVariables(url.hostname)];
    }

    // Port
    if (url.port) {
      result.port = url.port;
    }

    // Path
    if (url.pathname && url.pathname !== '/') {
      result.path = url.pathname
        .split('/')
        .filter((segment) => segment)
        .map(restoreVariables);
    }

    // Query parameters
    if (url.search) {
      const queryString = url.search.slice(1);
      result.query = parseQueryString(queryString).map((param) => ({
        key: restoreVariables(param.key),
        value: restoreVariables(param.value),
      }));
    }

    // Hash
    if (url.hash) {
      result.hash = restoreVariables(url.hash.slice(1));
    }
  } catch {
    // If URL parsing fails, try manual parsing
    // This handles cases like relative URLs or URLs without protocol

    let remaining = rawUrl;

    // Extract hash
    const hashIndex = remaining.indexOf('#');
    if (hashIndex !== -1) {
      result.hash = remaining.slice(hashIndex + 1);
      remaining = remaining.slice(0, hashIndex);
    }

    // Extract query string
    const queryIndex = remaining.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = remaining.slice(queryIndex + 1);
      result.query = parseQueryString(queryString);
      remaining = remaining.slice(0, queryIndex);
    }

    // Check for protocol
    const protocolMatch = remaining.match(/^(\w+):\/\//);
    if (protocolMatch) {
      result.protocol = protocolMatch[1];
      remaining = remaining.slice(protocolMatch[0].length);
    }

    // Extract port if present
    const portMatch = remaining.match(/:(\d+)/);
    if (portMatch) {
      result.port = portMatch[1];
      remaining = remaining.replace(`:${portMatch[1]}`, '');
    }

    // Split remaining into host and path
    const parts = remaining.split('/').filter((p) => p);
    if (parts.length > 0) {
      result.host = [parts[0]];
      result.path = parts.slice(1);
    }
  }

  return result;
}

/**
 * Parse query string into key-value pairs
 */
function parseQueryString(queryString: string): Array<{ key: string; value: string }> {
  if (!queryString) return [];

  return queryString.split('&').map((param) => {
    const [key, value] = param.split('=');
    return {
      key: key || '',
      value: value || '',
    };
  });
}
