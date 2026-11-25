
import {
  afterAll,
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { pool } from "../../database/index.ts";
import { PostgresCategoryRepository } from "../../modules/categories/postgres-categories.repository.ts";

describe("PostgresCategoryRepository", () => {
  const repository = new PostgresCategoryRepository();

  let createdTenantIds: string[] = [];

  async function createTestBusiness(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Category Test Business ${crypto.randomUUID()}`],
    );

    const tenantId = result.rows[0]!.id;
    createdTenantIds.push(tenantId);

    return tenantId;
  }

  async function createTestCategory(tenantId: string) {
    return repository.create(tenantId, {
      name: `Test Category ${crypto.randomUUID()}`,
      description: "Test category description",
    });
  }

  afterEach(async () => {
    if (createdTenantIds.length === 0) {
      return;
    }

    await pool.query(
      `
        DELETE FROM categories
        WHERE tenant_id = ANY($1::uuid[])
      `,
      [createdTenantIds],
    );

    await pool.query(
      `
        DELETE FROM businesses
        WHERE id = ANY($1::uuid[])
      `,
      [createdTenantIds],
    );

    createdTenantIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates a category", async () => {
    const tenantId = await createTestBusiness();

    const category = await createTestCategory(tenantId);

    expect(category.id).toBeDefined();
    expect(category.name).toContain("Test Category");
    expect(category.description).toBe("Test category description");
    expect(category.isActive).toBe(true);
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });

  it("finds a category by id within its tenant", async () => {
    const tenantId = await createTestBusiness();
    const created = await createTestCategory(tenantId);

    const found = await repository.findById(
      tenantId,
      created.id,
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe(created.name);
  });

  it("does not expose a category to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const category = await createTestCategory(tenantA);

    const found = await repository.findById(
      tenantB,
      category.id,
    );

    expect(found).toBeNull();
  });

  it("lists only categories belonging to the requested tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryA = await createTestCategory(tenantA);
    await createTestCategory(tenantB);

    const categories = await repository.findAll(tenantA);

    expect(categories).toHaveLength(1);
    expect(categories[0]!.id).toBe(categoryA.id);
  });

  it("updates category details", async () => {
    const tenantId = await createTestBusiness();
    const category = await createTestCategory(tenantId);

    const updated = await repository.update(
      tenantId,
      category.id,
      {
        name: "Updated Category",
        description: "Updated description",
      },
    );

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Updated Category");
    expect(updated?.description).toBe("Updated description");
    expect(updated?.id).toBe(category.id);
  });

  it("allows the category description to be cleared", async () => {
    const tenantId = await createTestBusiness();
    const category = await createTestCategory(tenantId);

    const updated = await repository.update(
      tenantId,
      category.id,
      {
        description: null,
      },
    );

    expect(updated?.description).toBeNull();
  });

  it("deactivates a category", async () => {
    const tenantId = await createTestBusiness();
    const category = await createTestCategory(tenantId);

    const updated = await repository.setActive(
      tenantId,
      category.id,
      false,
    );

    expect(updated).not.toBeNull();
    expect(updated?.isActive).toBe(false);
  });

  it("does not update a category belonging to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const category = await createTestCategory(tenantA);

    const updated = await repository.update(
      tenantB,
      category.id,
      { name: "Unauthorized Update" },
    );

    expect(updated).toBeNull();
  });

  it("returns null when updating a nonexistent category", async () => {
    const tenantId = await createTestBusiness();

    const updated = await repository.update(
      tenantId,
      crypto.randomUUID(),
      { name: "Missing Category" },
    );

    expect(updated).toBeNull();
  });

  it("rejects duplicate category names within the same tenant", async () => {
    const tenantId = await createTestBusiness();

    await repository.create(tenantId, {
      name: "Electronics",
    });

    await expect(
      repository.create(tenantId, {
        name: "Electronics",
      }),
    ).rejects.toThrow();
  });

  it("rejects category names that differ only by letter case", async () => {
    const tenantId = await createTestBusiness();

    await repository.create(tenantId, {
      name: "Electronics",
    });

    await expect(
      repository.create(tenantId, {
        name: "electronics",
      }),
    ).rejects.toThrow();
  });

  it("allows the same category name in different tenants", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryA = await repository.create(tenantA, {
      name: "Electronics",
    });

    const categoryB = await repository.create(tenantB, {
      name: "Electronics",
    });

    expect(categoryA.name).toBe(categoryB.name);
    expect(categoryA.id).not.toBe(categoryB.id);
  });
});
