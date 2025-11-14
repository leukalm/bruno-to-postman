import { z } from 'zod';

// HTTP Methods
export const HttpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// Bruno Meta
export const BrunoMetaSchema = z.object({
  name: z.string(),
  type: z.enum(['http', 'graphql']),
  seq: z.number().optional(),
});
export type BrunoMeta = z.infer<typeof BrunoMetaSchema>;

// Bruno Header
export const BrunoHeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});
export type BrunoHeader = z.infer<typeof BrunoHeaderSchema>;

// Bruno Query Parameter
export const BrunoQueryParamSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
});
export type BrunoQueryParam = z.infer<typeof BrunoQueryParamSchema>;

// Bruno Path Parameter
export const BrunoPathParamSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type BrunoPathParam = z.infer<typeof BrunoPathParamSchema>;

// Form Data Entry
export const FormDataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['text', 'file']),
  enabled: z.boolean().default(true),
});
export type FormDataEntry = z.infer<typeof FormDataEntrySchema>;

// Bruno Body
export const BrunoBodySchema = z.object({
  mode: z.enum(['json', 'xml', 'text', 'multipart', 'form-urlencoded', 'none']),
  content: z.string(),
  formData: z.array(FormDataEntrySchema).optional(),
});
export type BrunoBody = z.infer<typeof BrunoBodySchema>;

// Bruno Auth
export const BrunoAuthSchema = z.object({
  type: z.enum(['none', 'basic', 'bearer', 'apikey', 'oauth2']),
  basic: z
    .object({
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  bearer: z
    .object({
      token: z.string(),
    })
    .optional(),
  apikey: z
    .object({
      key: z.string(),
      value: z.string(),
      in: z.enum(['header', 'query']),
    })
    .optional(),
});
export type BrunoAuth = z.infer<typeof BrunoAuthSchema>;

// Bruno Request
export const BrunoRequestSchema = z.object({
  meta: BrunoMetaSchema,
  method: HttpMethodSchema,
  url: z.string(),
  headers: z.array(BrunoHeaderSchema).default([]),
  queryParams: z.array(BrunoQueryParamSchema).default([]),
  pathParams: z.array(BrunoPathParamSchema).default([]),
  body: BrunoBodySchema.optional(),
  auth: BrunoAuthSchema.optional(),
  preRequestScript: z.string().optional(),
  testScript: z.string().optional(),
  docs: z.string().optional(),
});
export type BrunoRequest = z.infer<typeof BrunoRequestSchema>;

// Bruno Variable
export const BrunoVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().default(true),
  type: z.enum(['text', 'secret']).default('text'),
});
export type BrunoVariable = z.infer<typeof BrunoVariableSchema>;

// Bruno Environment
export const BrunoEnvironmentSchema = z.object({
  name: z.string(),
  variables: z.array(BrunoVariableSchema),
});
export type BrunoEnvironment = z.infer<typeof BrunoEnvironmentSchema>;

// Bruno Collection Item (recursive type)
export type BrunoCollectionItem = {
  type: 'request' | 'folder';
  name: string;
  path: string;
  request?: BrunoRequest;
  items?: BrunoCollectionItem[];
};

// Use any type for the schema to avoid complex recursive type issues
export const BrunoCollectionItemSchema: z.ZodSchema<any> = z.lazy(() =>
  z.object({
    type: z.enum(['request', 'folder']),
    name: z.string(),
    path: z.string(),
    request: BrunoRequestSchema.optional(),
    items: z.array(BrunoCollectionItemSchema).optional(),
  })
);

// Bruno Collection
export const BrunoCollectionSchema = z.object({
  name: z.string(),
  items: z.array(BrunoCollectionItemSchema),
});
export type BrunoCollection = z.infer<typeof BrunoCollectionSchema>;
