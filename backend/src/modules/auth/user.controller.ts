import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

export function getMe(
  req: AuthenticatedRequest,
  res: Response,
): void {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}