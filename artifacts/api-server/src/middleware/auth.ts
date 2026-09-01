import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET must be set before starting the API server.");
}
const jwtSecret: string = secret;

export type AuthClaims = {
  sub: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export function issueToken(userId: number, role: string): string {
  return jwt.sign({ sub: String(userId), role }, jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const claims = jwt.verify(token, jwtSecret) as unknown as AuthClaims;
    const userId = Number(claims.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Invalid subject");
    }
    req.userId = userId;
    req.userRole = claims.role;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: "You do not have access to this resource" });
      return;
    }
    next();
  };
}