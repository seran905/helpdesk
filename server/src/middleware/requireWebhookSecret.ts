import type { NextFunction, Request, Response } from "express";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const providedSecret = req.header("x-webhook-secret");
  if (!providedSecret || providedSecret !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
