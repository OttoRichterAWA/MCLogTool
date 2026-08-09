// src/types/tauri.d.ts

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'UNKNOWN';

export interface LogEntry {
  time: string;
  level: LogLevel;
  content: string;
}

export interface ParseLogsResponse {
  logs: LogEntry[];
}

export interface ParseFolderResponse {
  logs: LogEntry[];
  processed_files: number;
  error_files?: number;
}

export type ScanModsResponse = string[];

export interface AnalysisResult {
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  suggestion: string;
  detail: string;
}