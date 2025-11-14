import { BrunoRequest, BrunoBody, BrunoAuth } from '../types/bruno.types.js';
import { PostmanRequest, PostmanBody, PostmanAuth, PostmanHeader } from '../types/postman.types.js';
import { parseUrl } from '../utils/urlParser.js';

/**
 * Convert a Bruno request to a Postman request
 * @param bruno - The Bruno request to convert
 * @returns The converted Postman request
 */
export function convertBrunoToPostmanRequest(bruno: BrunoRequest): PostmanRequest {
  const url = parseUrl(bruno.url);

  // Add query parameters from Bruno to URL
  if (bruno.queryParams.length > 0) {
    url.query = bruno.queryParams.map((param) => ({
      key: param.key,
      value: param.value,
      disabled: !param.enabled,
    }));
  }

  // Convert headers
  const headers: PostmanHeader[] = bruno.headers.map((header) => ({
    key: header.key,
    value: header.value,
    type: 'text',
    disabled: !header.enabled,
  }));

  const request: PostmanRequest = {
    method: bruno.method,
    header: headers,
    url,
  };

  // Convert body if present
  if (bruno.body && bruno.body.mode !== 'none') {
    request.body = convertBody(bruno.body);
  }

  // Convert authentication if present
  if (bruno.auth && bruno.auth.type !== 'none') {
    request.auth = convertAuth(bruno.auth);
  }

  return request;
}

/**
 * Convert Bruno body to Postman body
 * @param brunoBody - The Bruno body to convert
 * @returns The converted Postman body
 */
export function convertBody(brunoBody: BrunoBody): PostmanBody {
  const body: PostmanBody = {
    mode: 'raw',
  };

  switch (brunoBody.mode) {
    case 'json':
      body.mode = 'raw';
      body.raw = brunoBody.content;
      body.options = {
        raw: {
          language: 'json',
        },
      };
      break;

    case 'xml':
      body.mode = 'raw';
      body.raw = brunoBody.content;
      body.options = {
        raw: {
          language: 'xml',
        },
      };
      break;

    case 'text':
      body.mode = 'raw';
      body.raw = brunoBody.content;
      body.options = {
        raw: {
          language: 'text',
        },
      };
      break;

    case 'form-urlencoded':
      body.mode = 'urlencoded';
      body.urlencoded = brunoBody.content.split('\n').map((line) => {
        const [key, value] = line.split(':').map((s) => s.trim());
        return {
          key: key || '',
          value: value || '',
          type: 'text',
        };
      });
      break;

    case 'multipart':
      body.mode = 'formdata';
      if (brunoBody.formData) {
        body.formdata = brunoBody.formData.map((entry) => ({
          key: entry.key,
          value: entry.type === 'text' ? entry.value : undefined,
          src: entry.type === 'file' ? entry.value : undefined,
          type: entry.type,
          disabled: !entry.enabled,
        }));
      }
      break;

    default:
      body.mode = 'raw';
      body.raw = brunoBody.content;
      break;
  }

  return body;
}

/**
 * Convert Bruno authentication to Postman authentication
 * @param brunoAuth - The Bruno authentication to convert
 * @returns The converted Postman authentication
 */
export function convertAuth(brunoAuth: BrunoAuth): PostmanAuth {
  const auth: PostmanAuth = {
    type: 'noauth',
  };

  switch (brunoAuth.type) {
    case 'basic':
      auth.type = 'basic';
      if (brunoAuth.basic) {
        auth.basic = [
          {
            key: 'username',
            value: brunoAuth.basic.username,
            type: 'string',
          },
          {
            key: 'password',
            value: brunoAuth.basic.password,
            type: 'string',
          },
        ];
      }
      break;

    case 'bearer':
      auth.type = 'bearer';
      if (brunoAuth.bearer) {
        auth.bearer = [
          {
            key: 'token',
            value: brunoAuth.bearer.token,
            type: 'string',
          },
        ];
      }
      break;

    case 'apikey':
      auth.type = 'apikey';
      if (brunoAuth.apikey) {
        auth.apikey = [
          {
            key: 'key',
            value: brunoAuth.apikey.key,
            type: 'string',
          },
          {
            key: 'value',
            value: brunoAuth.apikey.value,
            type: 'string',
          },
          {
            key: 'in',
            value: brunoAuth.apikey.in,
            type: 'string',
          },
        ];
      }
      break;

    default:
      auth.type = 'noauth';
      break;
  }

  return auth;
}
