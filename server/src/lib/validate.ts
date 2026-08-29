import type { Response } from "express";
import type { ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, body: unknown, res: Response): T | undefined {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return undefined;
  }
  return parsed.data;
}
