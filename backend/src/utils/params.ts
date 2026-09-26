// ─── Express 5 Param Helper ─────────────────────────────────────────────────
// Express 5 types route params as `string | string[]`.
// This helper safely extracts a single string param.

import { Request } from 'express';

export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  if (Array.isArray(val)) return val[0];
  return val as string;
}
