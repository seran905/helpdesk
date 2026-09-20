import type { NextFunction, Request, Response } from "express";
import { Role } from "../generated/prisma/enums.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== Role.admin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
