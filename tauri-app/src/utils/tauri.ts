import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { ZodSchema, ZodError } from 'zod';

export async function invokeTyped<T>(
  cmd: string,
  schema: ZodSchema<T>,
  args?: Record<string, any>
): Promise<T> {
  try {
    const raw = await tauriInvoke<any>(cmd, args); 
    let parsed: any;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    } else {
      parsed = raw;
    }
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => issue.message).join('; ');
      throw new Error(`数据校验失败 (命令: ${cmd}): ${messages}`);
    }
    throw error;
  }
}