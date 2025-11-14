import { z } from 'zod';

// Postman Info
export const PostmanInfoSchema = z.object({
  name: z.string(),
  _postman_id: z.string().optional(),
  description: z.string().optional(),
  schema: z
    .string()
    .default('https://schema.getpostman.com/json/collection/v2.1.0/collection.json'),
  version: z.string().optional(),
});
export type PostmanInfo = z.infer<typeof PostmanInfoSchema>;

// Postman Header
export const PostmanHeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().default('text'),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});
export type PostmanHeader = z.infer<typeof PostmanHeaderSchema>;

// Postman Query Parameter
export const PostmanQueryParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});
export type PostmanQueryParam = z.infer<typeof PostmanQueryParamSchema>;

// Postman Path Variable
export const PostmanPathVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});
export type PostmanPathVariable = z.infer<typeof PostmanPathVariableSchema>;

// Postman URL
export const PostmanUrlSchema = z.union([
  z.string(),
  z.object({
    raw: z.string(),
    protocol: z.string().optional(),
    host: z.array(z.string()).optional(),
    port: z.string().optional(),
    path: z.array(z.string()).optional(),
    query: z.array(PostmanQueryParamSchema).optional(),
    variable: z.array(PostmanPathVariableSchema).optional(),
    hash: z.string().optional(),
  }),
]);
export type PostmanUrl = z.infer<typeof PostmanUrlSchema>;

// Postman Key-Value
export const PostmanKeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().optional(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});
export type PostmanKeyValue = z.infer<typeof PostmanKeyValueSchema>;

// Postman Form Data
export const PostmanFormDataSchema = z.object({
  key: z.string(),
  value: z.string().optional(),
  src: z.string().optional(),
  type: z.enum(['text', 'file']),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});
export type PostmanFormData = z.infer<typeof PostmanFormDataSchema>;

// Postman Body
export const PostmanBodySchema = z.object({
  mode: z.enum(['raw', 'urlencoded', 'formdata', 'file', 'graphql']),
  raw: z.string().optional(),
  urlencoded: z.array(PostmanKeyValueSchema).optional(),
  formdata: z.array(PostmanFormDataSchema).optional(),
  file: z
    .object({
      src: z.string(),
    })
    .optional(),
  options: z
    .object({
      raw: z
        .object({
          language: z.enum(['json', 'xml', 'html', 'text', 'javascript']).optional(),
        })
        .optional(),
    })
    .optional(),
});
export type PostmanBody = z.infer<typeof PostmanBodySchema>;

// Postman Auth
export const PostmanAuthSchema = z.object({
  type: z.enum(['noauth', 'basic', 'bearer', 'apikey', 'oauth2', 'awsv4', 'digest', 'hawk']),
  basic: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  bearer: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  apikey: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        type: z.string(),
      })
    )
    .optional(),
});
export type PostmanAuth = z.infer<typeof PostmanAuthSchema>;

// Postman Script
export const PostmanScriptSchema = z.object({
  type: z.literal('text/javascript'),
  exec: z.array(z.string()),
  id: z.string().optional(),
});
export type PostmanScript = z.infer<typeof PostmanScriptSchema>;

// Postman Event
export const PostmanEventSchema = z.object({
  listen: z.enum(['prerequest', 'test']),
  script: PostmanScriptSchema,
});
export type PostmanEvent = z.infer<typeof PostmanEventSchema>;

// Postman Request
export const PostmanRequestSchema = z.object({
  method: z.string(),
  header: z.array(PostmanHeaderSchema).default([]),
  url: PostmanUrlSchema,
  body: PostmanBodySchema.optional(),
  auth: PostmanAuthSchema.optional(),
  description: z.string().optional(),
});
export type PostmanRequest = z.infer<typeof PostmanRequestSchema>;

// Postman Item (recursive)
export const PostmanItemSchema: z.ZodType<PostmanItem> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string().optional(),
    item: z.array(PostmanItemSchema).optional(),
    request: PostmanRequestSchema.optional(),
    event: z.array(PostmanEventSchema).optional(),
    protocolProfileBehavior: z.record(z.unknown()).optional(),
  })
);
export type PostmanItem = {
  name: string;
  description?: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  event?: PostmanEvent[];
  protocolProfileBehavior?: Record<string, unknown>;
};

// Postman Variable
export const PostmanVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['string', 'boolean', 'any', 'number']).optional(),
  disabled: z.boolean().optional(),
});
export type PostmanVariable = z.infer<typeof PostmanVariableSchema>;

// Postman Collection
export const PostmanCollectionSchema = z.object({
  info: PostmanInfoSchema,
  item: z.array(PostmanItemSchema),
  auth: PostmanAuthSchema.optional(),
  variable: z.array(PostmanVariableSchema).optional(),
  event: z.array(PostmanEventSchema).optional(),
});
export type PostmanCollection = z.infer<typeof PostmanCollectionSchema>;

// Postman Environment Value
export const PostmanEnvironmentValueSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  type: z.enum(['default', 'secret']).optional(),
});
export type PostmanEnvironmentValue = z.infer<typeof PostmanEnvironmentValueSchema>;

// Postman Environment
export const PostmanEnvironmentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  values: z.array(PostmanEnvironmentValueSchema),
  _postman_variable_scope: z.literal('environment'),
  _postman_exported_at: z.string(),
  _postman_exported_using: z.string(),
});
export type PostmanEnvironment = z.infer<typeof PostmanEnvironmentSchema>;
