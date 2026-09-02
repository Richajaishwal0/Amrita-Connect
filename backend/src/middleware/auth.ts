import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@workspace/db";

const secret = process.env.SESSION_SECRET || "development-jwt-secret-amrita-connect";
const jwtSecret: string = secret;

export type AuthClaims = {
  sub: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export function issueToken(userId: string | unknown, role: string): string {
  return jwt.sign({ sub: String(userId), role }, jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const claims = jwt.verify(token, jwtSecret) as unknown as AuthClaims;
    if (!claims || typeof claims !== "object" || typeof claims.sub !== "string" || !claims.sub) {
      throw new Error("Invalid claims");
    }
    const userId = claims.sub;

    const user = await UserModel.findById(userId).select("role status").lean();
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid or expired session" });
      return;
    }
    if (user.status !== "active") {
      res.status(403).json({ success: false, message: "This account is not active" });
      return;
    }
    req.userId = String(user._id);
    req.userRole = user.role;
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
