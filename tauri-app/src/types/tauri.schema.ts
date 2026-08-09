import { z } from 'zod';

// 日志级别
export const LogLevelSchema = z.string().default('UNKNOWN');

// 单条日志
export const LogEntrySchema = z.object({
  time: z.string().default(''),
  level: LogLevelSchema,
  content: z.string().default(''),
});

// parse_logs 响应
export const ParseLogsResponseSchema = z.object({
  logs: z.array(LogEntrySchema).default([]),
});

// parse_folder 响应
export const ParseFolderResponseSchema = z.object({
  logs: z.array(LogEntrySchema).default([]),
  processed_files: z.number().int().nonnegative(),
  error_files: z.number().int().nonnegative().optional(),
});

// 分析结果
export const AnalysisResultSchema = z.object({
  severity: z.union([z.literal('High'), z.literal('Medium'), z.literal('Low')]),
  title: z.string().min(1),
  suggestion: z.string().min(1),
  detail: z.string().min(1),
});

// 模组扫描响应
export const ScanModsResponseSchema = z.array(z.string());