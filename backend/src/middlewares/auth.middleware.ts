import type { Request, Response, NextFunction } from "express";
import { sessionService } from "../modules/auth/auth.dependencies.ts";
import { authService } from "../modules/auth/auth.dependencies.ts";
import AppError from "../utils/app-error.ts";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: "owner" | "employee";
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const session = await sessionService.getValidSession(token);
    const user = await authService.findUserById(session.userId);

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await sessionService.touchSession(session.id);

    next();
  } catch (error) {
    next(error);
  }
}