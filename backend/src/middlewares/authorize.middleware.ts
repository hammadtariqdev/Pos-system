
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.ts";
import type { UserRole } from "../modules/auth/types/auth.types.ts";
import AppError from "../utils/app-error.ts";

export function authorize(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      return next(
        new AppError("Authentication required.", 401),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }

    next();
  };
}
