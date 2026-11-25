import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import type { Category } from "../../modules/categories/categories.types.ts";

const { categoryServiceMock } = vi.hoisted(() => ({
  categoryServiceMock: {
    createCategory: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    updateCategory: vi.fn(),
    setCategoryActive: vi.fn(),
  },
}));

vi.mock("../../modules/categories/categories.dependencies.ts", () => ({
  categoryService: categoryServiceMock,
}));

import { CategoryController } from "../../modules/categories/categories.controller.ts";

describe("CategoryController", () => {
  let controller: CategoryController;
  let req: AuthenticatedRequest;
  let res: Response;

  const tenantId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();

  const category: Category = {
    id: categoryId,
    name: "Electronics",
    description: "Electronic products",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    controller = new CategoryController();

    req = {
      user: {
        id: crypto.randomUUID(),
        tenantId,
        name: "Test Owner",
        email: "owner@test.local",
        role: "owner",
      },
      params: {},
      body: {},
    } as AuthenticatedRequest;

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
  });

  it("creates a category", async () => {
    req.body = {
      name: "Electronics",
      description: "Electronic products",
    };

    categoryServiceMock.createCategory.mockResolvedValue(category);

    await controller.createCategory(req, res);

    expect(categoryServiceMock.createCategory).toHaveBeenCalledWith(
      tenantId,
      req.body,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: category,
    });
  });

  it("rejects invalid category creation data", async () => {
    req.body = {
      name: "",
    };

    await controller.createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(categoryServiceMock.createCategory).not.toHaveBeenCalled();
  });

  it("returns all categories", async () => {
    categoryServiceMock.getCategories.mockResolvedValue([category]);

    await controller.getCategories(req, res);

    expect(categoryServiceMock.getCategories).toHaveBeenCalledWith(tenantId);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: [category],
    });
  });

  it("returns a category by ID", async () => {
    req.params = { id: categoryId };

    categoryServiceMock.getCategoryById.mockResolvedValue(category);

    await controller.getCategoryById(req, res);

    expect(categoryServiceMock.getCategoryById).toHaveBeenCalledWith(
      tenantId,
      categoryId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: category,
    });
  });

  it("returns 404 when a category does not exist", async () => {
    req.params = { id: categoryId };

    categoryServiceMock.getCategoryById.mockResolvedValue(null);

    await controller.getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Category not found",
    });
  });

  it("rejects an invalid category ID", async () => {
    req.params = { id: "invalid-id" };

    await controller.getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(categoryServiceMock.getCategoryById).not.toHaveBeenCalled();
  });

  it("updates a category", async () => {
    req.params = { id: categoryId };
    req.body = {
      name: "Updated Electronics",
    };

    categoryServiceMock.updateCategory.mockResolvedValue({
      ...category,
      name: "Updated Electronics",
    });

    await controller.updateCategory(req, res);

    expect(categoryServiceMock.updateCategory).toHaveBeenCalledWith(
      tenantId,
      categoryId,
      req.body,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an empty category update", async () => {
    req.params = { id: categoryId };
    req.body = {};

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(categoryServiceMock.updateCategory).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a nonexistent category", async () => {
    req.params = { id: categoryId };
    req.body = {
      name: "Updated Electronics",
    };

    categoryServiceMock.updateCategory.mockResolvedValue(null);

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("changes category active status", async () => {
    req.params = { id: categoryId };
    req.body = {
      isActive: false,
    };

    categoryServiceMock.setCategoryActive.mockResolvedValue({
      ...category,
      isActive: false,
    });

    await controller.setCategoryActive(req, res);

    expect(categoryServiceMock.setCategoryActive).toHaveBeenCalledWith(
      tenantId,
      categoryId,
      false,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an invalid category active status", async () => {
    req.params = { id: categoryId };
    req.body = {
      isActive: "false",
    };

    await controller.setCategoryActive(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(categoryServiceMock.setCategoryActive).not.toHaveBeenCalled();
  });

  it("returns 404 when changing status of a nonexistent category", async () => {
    req.params = { id: categoryId };
    req.body = {
      isActive: false,
    };

    categoryServiceMock.setCategoryActive.mockResolvedValue(null);

    await controller.setCategoryActive(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});