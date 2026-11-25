import { beforeEach, describe, expect, it } from "vitest";

import type {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../modules/categories/categories.repository.ts";

import { CategoryService } from "../../modules/categories/categories.service.ts";
import type { Category } from "../../modules/categories/categories.types.ts";

describe("CategoryService", () => {
  let service: CategoryService;
  let repository: CategoryRepository;

  let categories: Category[];

  const tenantId = crypto.randomUUID();

  function createCategoryRecord(
    input: CreateCategoryInput,
  ): Category {
    const now = new Date();

    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  beforeEach(() => {
    categories = [];

    repository = {
      async create(
        _tenantId: string,
        input: CreateCategoryInput,
      ): Promise<Category> {
        const category = createCategoryRecord(input);
        categories.push(category);
        return category;
      },

      async findById(
        _tenantId: string,
        id: string,
      ): Promise<Category | null> {
        return categories.find((category) => category.id === id) ?? null;
      },

      async findAll(_tenantId: string): Promise<Category[]> {
        return [...categories];
      },

      async update(
        _tenantId: string,
        id: string,
        input: UpdateCategoryInput,
      ): Promise<Category | null> {
        const category = categories.find((item) => item.id === id);

        if (!category) {
          return null;
        }

        if (input.name !== undefined) {
          category.name = input.name;
        }

        if (input.description !== undefined) {
          category.description = input.description;
        }

        category.updatedAt = new Date();

        return category;
      },

      async setActive(
        _tenantId: string,
        id: string,
        isActive: boolean,
      ): Promise<Category | null> {
        const category = categories.find((item) => item.id === id);

        if (!category) {
          return null;
        }

        category.isActive = isActive;
        category.updatedAt = new Date();

        return category;
      },
    };

    service = new CategoryService(repository);
  });

  it("creates a category", async () => {
    const category = await service.createCategory(tenantId, {
      name: "Electronics",
      description: "Electronic products",
    });

    expect(category.name).toBe("Electronics");
    expect(category.description).toBe("Electronic products");
    expect(category.isActive).toBe(true);
  });

  it("finds a category by ID", async () => {
    const created = await service.createCategory(tenantId, {
      name: "Electronics",
    });

    const category = await service.getCategoryById(
      tenantId,
      created.id,
    );

    expect(category).not.toBeNull();
    expect(category?.id).toBe(created.id);
  });

  it("returns null when a category does not exist", async () => {
    const category = await service.getCategoryById(
      tenantId,
      crypto.randomUUID(),
    );

    expect(category).toBeNull();
  });

  it("returns all categories", async () => {
    await service.createCategory(tenantId, {
      name: "Electronics",
    });

    await service.createCategory(tenantId, {
      name: "Clothing",
    });

    const result = await service.getCategories(tenantId);

    expect(result).toHaveLength(2);
    expect(result.map((category) => category.name)).toContain("Electronics");
    expect(result.map((category) => category.name)).toContain("Clothing");
  });

  it("updates a category", async () => {
    const created = await service.createCategory(tenantId, {
      name: "Electronics",
    });

    const updated = await service.updateCategory(
      tenantId,
      created.id,
      {
        name: "Updated Electronics",
        description: "Updated description",
      },
    );

    expect(updated?.name).toBe("Updated Electronics");
    expect(updated?.description).toBe("Updated description");
  });

  it("returns null when updating a nonexistent category", async () => {
    const result = await service.updateCategory(
      tenantId,
      crypto.randomUUID(),
      {
        name: "Updated",
      },
    );

    expect(result).toBeNull();
  });

  it("deactivates a category", async () => {
    const created = await service.createCategory(tenantId, {
      name: "Electronics",
    });

    const updated = await service.setCategoryActive(
      tenantId,
      created.id,
      false,
    );

    expect(updated?.isActive).toBe(false);
  });

  it("reactivates a category", async () => {
    const created = await service.createCategory(tenantId, {
      name: "Electronics",
    });

    await service.setCategoryActive(tenantId, created.id, false);

    const updated = await service.setCategoryActive(
      tenantId,
      created.id,
      true,
    );

    expect(updated?.isActive).toBe(true);
  });

  it("returns null when changing the status of a nonexistent category", async () => {
    const result = await service.setCategoryActive(
      tenantId,
      crypto.randomUUID(),
      false,
    );

    expect(result).toBeNull();
  });
});