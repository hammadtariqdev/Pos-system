import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import { businessService } from "./business.dependencies.ts";
import AppError from "../../utils/app-error.ts";
import { sendSuccess } from "../../utils/api-response.ts";

export async function getBusiness(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }

  const business = await businessService.getBusiness(
    req.user.tenantId,
  );

  sendSuccess(res, {
    message: "Business retrieved successfully.",
    data: { business },
  });
}

export async function updateBusinessName(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }

  const business = await businessService.updateBusinessName(
    req.user.tenantId,
    req.body.name,
  );

  sendSuccess(res, {
    message: "Business updated successfully.",
    data: { business },
  });
}