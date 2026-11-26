import { afterEach, describe, expect, it } from "vitest";

import { pool } from "../../database/index.ts";
import { PostgresCategoryRepository } from "../../modules/categories/postgres-categories.repository.ts";
import { PostgresVendorRepository } from "../../modules/vendors/postgres-vendors.repository.ts";

describe("PostgresVendorRepository", () => {
  const repository = new PostgresVendorRepository();
  const categoryRepository = new PostgresCategoryRepository();

  let createdTenantIds: string[] = [];

  async function createTestBusiness(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Vendor Test Business ${crypto.randomUUID()}`],
    );

    const tenantId = result.rows[0]!.id;
    createdTenantIds.push(tenantId);

    return tenantId;
  }

  async function createTestCategory(tenantId: string): Promise<string> {
    const category = await categoryRepository.create(tenantId, {
      name: `Vendor Test Category ${crypto.randomUUID()}`,
    });

    return category.id;
  }

  async function createTestVendor(
    tenantId: string,
    categoryId: string,
  ) {
    return repository.create(tenantId, {
      categoryId,
      name: `Test Vendor ${crypto.randomUUID()}`,
      phone: "03001234567",
      email: "vendor@example.com",
      address: "Karachi, Pakistan",
    });
  }

  afterEach(async () => {
    if (createdTenantIds.length === 0) {
      return;
    }

    await pool.query(
      `
        DELETE FROM vendors
        WHERE tenant_id = ANY($1::uuid[])
      `,
      [createdTenantIds],
    );

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

  it("creates a vendor", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);

    const vendor = await createTestVendor(tenantId, categoryId);

    expect(vendor.id).toBeDefined();
    expect(vendor.categoryId).toBe(categoryId);
    expect(vendor.categoryName).toContain("Vendor Test Category");
    expect(vendor.name).toContain("Test Vendor");
    expect(vendor.phone).toBe("03001234567");
    expect(vendor.email).toBe("vendor@example.com");
    expect(vendor.address).toBe("Karachi, Pakistan");
    expect(vendor.createdAt).toBeInstanceOf(Date);
    expect(vendor.updatedAt).toBeInstanceOf(Date);
  });

  it("finds a vendor by id within its tenant", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);
    const created = await createTestVendor(tenantId, categoryId);

    const found = await repository.findById(tenantId, created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe(created.name);
  });

  it("does not expose a vendor to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryId = await createTestCategory(tenantA);
    const vendor = await createTestVendor(tenantA, categoryId);

    const found = await repository.findById(tenantB, vendor.id);

    expect(found).toBeNull();
  });

  it("lists only vendors belonging to the requested tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryA = await createTestCategory(tenantA);
    const categoryB = await createTestCategory(tenantB);

    const vendorA = await createTestVendor(tenantA, categoryA);
    await createTestVendor(tenantB, categoryB);

    const vendors = await repository.findAll(tenantA);

    expect(vendors).toHaveLength(1);
    expect(vendors[0]!.id).toBe(vendorA.id);
  });

  it("filters vendors by category", async () => {
    const tenantId = await createTestBusiness();
    const categoryA = await createTestCategory(tenantId);
    const categoryB = await createTestCategory(tenantId);

    const vendorA = await createTestVendor(tenantId, categoryA);
    await createTestVendor(tenantId, categoryB);

    const vendors = await repository.findAll(tenantId, {
      categoryId: categoryA,
    });

    expect(vendors).toHaveLength(1);
    expect(vendors[0]!.id).toBe(vendorA.id);
  });

  it("searches vendors by name", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);

    const vendor = await repository.create(tenantId, {
      categoryId,
      name: "Unique Search Vendor",
    });

    const vendors = await repository.findAll(tenantId, {
      search: "unique search",
    });

    expect(vendors).toHaveLength(1);
    expect(vendors[0]!.id).toBe(vendor.id);
  });

  it("updates vendor details", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);
    const vendor = await createTestVendor(tenantId, categoryId);

    const updated = await repository.update(tenantId, vendor.id, {
      name: "Updated Vendor",
      phone: "03111234567",
    });

    expect(updated).not.toBeNull();
    expect(updated?.id).toBe(vendor.id);
    expect(updated?.name).toBe("Updated Vendor");
    expect(updated?.phone).toBe("03111234567");
  });

  it("allows optional contact details to be cleared", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);
    const vendor = await createTestVendor(tenantId, categoryId);

    const updated = await repository.update(tenantId, vendor.id, {
      phone: null,
      email: null,
      address: null,
    });

    expect(updated).not.toBeNull();
    expect(updated?.phone).toBeNull();
    expect(updated?.email).toBeNull();
    expect(updated?.address).toBeNull();
  });

  it("does not update a vendor belonging to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryId = await createTestCategory(tenantA);
    const vendor = await createTestVendor(tenantA, categoryId);

    const updated = await repository.update(tenantB, vendor.id, {
      name: "Unauthorized Update",
    });

    expect(updated).toBeNull();
  });

  it("returns null when updating a nonexistent vendor", async () => {
    const tenantId = await createTestBusiness();

    const updated = await repository.update(
      tenantId,
      crypto.randomUUID(),
      { name: "Missing Vendor" },
    );

    expect(updated).toBeNull();
  });

  it("deletes a vendor", async () => {
    const tenantId = await createTestBusiness();
    const categoryId = await createTestCategory(tenantId);
    const vendor = await createTestVendor(tenantId, categoryId);

    const deleted = await repository.delete(tenantId, vendor.id);

    expect(deleted).toBe(true);

    const found = await repository.findById(tenantId, vendor.id);
    expect(found).toBeNull();
  });

  it("returns false when deleting a nonexistent vendor", async () => {
    const tenantId = await createTestBusiness();

    const deleted = await repository.delete(
      tenantId,
      crypto.randomUUID(),
    );

    expect(deleted).toBe(false);
  });

  it("rejects a category belonging to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const categoryId = await createTestCategory(tenantA);

    await expect(
      repository.create(tenantB, {
        categoryId,
        name: "Invalid Tenant Vendor",
      }),
    ).rejects.toThrow();
  });
});