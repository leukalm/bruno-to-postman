import { z } from 'zod';

// Convert Options
export const ConvertOptionsSchema = z.object({
  input: z.string(),
  output: z.string(),
  collectionName: z.string().optional(),
  includeEnv: z.boolean().default(false),
  verbose: z.boolean().default(false),
  json: z.boolean().default(false),
  force: z.boolean().default(false),
});
export type ConvertOptions = z.infer<typeof ConvertOptionsSchema>;

// Batch Convert Options
export const BatchConvertOptionsSchema = ConvertOptionsSchema.extend({
  recursive: z.boolean().default(true),
  concurrency: z.number().min(1).max(20).default(10),
});
export type BatchConvertOptions = z.infer<typeof BatchConvertOptionsSchema>;

// Conversion Error Type
export const ConversionErrorTypeSchema = z.enum([
  'parse',
  'validation',
  'conversion',
  'filesystem',
]);
export type ConversionErrorType = z.infer<typeof ConversionErrorTypeSchema>;

// Conversion Error
export const ConversionErrorSchema = z.object({
  type: ConversionErrorTypeSchema,
  file: z.string().optional(),
  line: z.number().optional(),
  message: z.string(),
  details: z.string().optional(),
});
export type ConversionError = z.infer<typeof ConversionErrorSchema>;

// Conversion Warning Type
export const ConversionWarningTypeSchema = z.enum([
  'unsupported-feature',
  'data-loss',
  'compatibility',
]);
export type ConversionWarningType = z.infer<typeof ConversionWarningTypeSchema>;

// Conversion Warning
export const ConversionWarningSchema = z.object({
  type: ConversionWarningTypeSchema,
  file: z.string().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
});
export type ConversionWarning = z.infer<typeof ConversionWarningSchema>;

// Conversion Result
export const ConversionResultSchema = z.object({
  success: z.boolean(),
  inputPath: z.string(),
  outputPath: z.string().optional(),
  requestsConverted: z.number().default(0),
  errors: z.array(ConversionErrorSchema).default([]),
  warnings: z.array(ConversionWarningSchema).default([]),
  duration: z.number(),
});
export type ConversionResult = z.infer<typeof ConversionResultSchema>;

// Parsed URL (utility type for URL decomposition)
export const ParsedUrlSchema = z.object({
  raw: z.string(),
  protocol: z.string().optional(),
  host: z.array(z.string()),
  port: z.string().optional(),
  path: z.array(z.string()),
  query: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
  variables: z.array(z.string()),
  hash: z.string().optional(),
});
export type ParsedUrl = z.infer<typeof ParsedUrlSchema>;

// File System Entry (for batch processing)
export const FileSystemEntrySchema = z.object({
  type: z.enum(['file', 'directory']),
  name: z.string(),
  path: z.string(),
  relativePath: z.string(),
  extension: z.string().optional(),
});
export type FileSystemEntry = z.infer<typeof FileSystemEntrySchema>;
