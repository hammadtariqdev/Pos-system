import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import { categoryService } from "./categories.dependencies.ts";

import {
  categoryIdSchema,
  createCategorySchema,
  setCategoryActiveSchema,
  updateCategorySchema,
} from "./categories.validator.ts";

function getTenantId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new Error("Authenticated user is required");
  }

  return req.user.tenantId;
}

export class CategoryController {
  async createCategory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const validation = createCategorySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const category = await categoryService.createCategory(
      getTenantId(req),
      validation.data,
    );

    res.status(201).json({ data: category });
  }

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const categories = await categoryService.getCategories(getTenantId(req));

    res.status(200).json({ data: categories });
  }

  async getCategoryById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const validation = categoryIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const category = await categoryService.getCategoryById(
      getTenantId(req),
      validation.data.id,
    );

    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({ data: category });
  }

  async updateCategory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const paramsValidation = categoryIdSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: paramsValidation.error.flatten(),
      });
      return;
    }

    const bodyValidation = updateCategorySchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: bodyValidation.error.flatten(),
      });
      return;
    }

    const category = await categoryService.updateCategory(
      getTenantId(req),
      paramsValidation.data.id,
      bodyValidation.data,
    );

    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({ data: category });
  }

  async setCategoryActive(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const paramsValidation = categoryIdSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: paramsValidation.error.flatten(),
      });
      return;
    }

    const bodyValidation = setCategoryActiveSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: bodyValidation.error.flatten(),
      });
      return;
    }

    const category = await categoryService.setCategoryActive(
      getTenantId(req),
      paramsValidation.data.id,
      bodyValidation.data.isActive,
    );

    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({ data: category });
  }
}

export const categoryController = new CategoryController();
