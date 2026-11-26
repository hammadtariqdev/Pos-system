import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

import {
  createVendorSchema,
  updateVendorSchema,
  vendorIdSchema,
  vendorListQuerySchema,
} from "./vendors.validator.ts";
import { vendorService } from "./vendors.dependencies.ts";

function getTenantId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new Error("Authenticated user is required");
  }

  return req.user.tenantId;
}

export class VendorController {
  async createVendor(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = createVendorSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const vendor = await vendorService.createVendor(
      getTenantId(req),
      validation.data,
    );

    res.status(201).json({ data: vendor });
  }

  async getVendors(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = vendorListQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const vendors = await vendorService.getVendors(
      getTenantId(req),
      validation.data,
    );

    res.status(200).json({ data: vendors });
  }

  async getVendorById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = vendorIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const vendor = await vendorService.getVendorById(
      getTenantId(req),
      validation.data.id,
    );

    if (!vendor) {
      res.status(404).json({
        message: "Vendor not found",
      });
      return;
    }

    res.status(200).json({ data: vendor });
  }

  async updateVendor(req: AuthenticatedRequest, res: Response): Promise<void> {
    const paramsValidation = vendorIdSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: paramsValidation.error.flatten(),
      });
      return;
    }

    const bodyValidation = updateVendorSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: bodyValidation.error.flatten(),
      });
      return;
    }

    const vendor = await vendorService.updateVendor(
      getTenantId(req),
      paramsValidation.data.id,
      bodyValidation.data,
    );

    if (!vendor) {
      res.status(404).json({
        message: "Vendor not found",
      });
      return;
    }

    res.status(200).json({ data: vendor });
  }

  async deleteVendor(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validation = vendorIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const deleted = await vendorService.deleteVendor(
      getTenantId(req),
      validation.data.id,
    );

    if (!deleted) {
      res.status(404).json({
        message: "Vendor not found",
      });
      return;
    }

    res.status(204).send();
  }
}

export const vendorController = new VendorController();
