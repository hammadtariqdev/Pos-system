
import {
  afterAll,
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { pool } from "../../database/index.ts";
import { PostgresProductRepository } from "../../modules/products/postgres-products.repository.ts";

describe("PostgresProductRepository", () => {
  const repository = new PostgresProductRepository();

  let createdTenantIds: string[] = [];

  async function createTestBusiness(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Product Test Business ${crypto.randomUUID()}`],
    );

    const tenantId = result.rows[0]!.id;
    createdTenantIds.push(tenantId);

    return tenantId;
  }

  async function createTestProduct(tenantId: string) {
    return repository.create(tenantId, {
      name: "Test Laptop",
      sku: `SKU-${crypto.randomUUID()}`,
      barcode: `BAR-${crypto.randomUUID()}`,
      description: "Test product",

      // Pricing
      vendorCostPrice: "50000.00",
      salePrice: "60000.00",
      boxSalePrice: "65000.00",
      wholesalePiecePrice: "55000.00",
      wholesaleBoxPrice: "60000.00",
      wholesaleCartonPrice: "700000.00",
      oldSalePrice: "58000.00",

      // Packaging
      unit: "piece",
      piecesPerBox: 10,
      boxesPerCarton: 20,

      // QR identifiers
      pieceQrCode: `PIECE-${crypto.randomUUID()}`,
      boxQrCode: `BOX-${crypto.randomUUID()}`,
      cartonQrCode: `CARTON-${crypto.randomUUID()}`,
    });
  }

  afterEach(async () => {
    if (createdTenantIds.length === 0) {
      return;
    }

    await pool.query(
      `
        DELETE FROM products
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

  it("creates a product with pricing, packaging, and QR identifiers", async () => {
    const tenantId = await createTestBusiness();

    const product = await createTestProduct(tenantId);

    expect(product.id).toBeDefined();
    expect(product.name).toBe("Test Laptop");
    expect(product.sku).toBeDefined();
    expect(product.barcode).toBeDefined();

    // Pricing
    expect(product.vendorCostPrice).toBe("50000.00");
    expect(product.salePrice).toBe("60000.00");
    expect(product.boxSalePrice).toBe("65000.00");
    expect(product.wholesalePiecePrice).toBe("55000.00");
    expect(product.wholesaleBoxPrice).toBe("60000.00");
    expect(product.wholesaleCartonPrice).toBe("700000.00");
    expect(product.oldSalePrice).toBe("58000.00");

    // Packaging
    expect(product.unit).toBe("piece");
    expect(product.piecesPerBox).toBe(10);
    expect(product.boxesPerCarton).toBe(20);

    // QR identifiers
    expect(product.pieceQrCode).toBeDefined();
    expect(product.boxQrCode).toBeDefined();
    expect(product.cartonQrCode).toBeDefined();

    expect(product.isActive).toBe(true);
    expect(product.createdAt).toBeInstanceOf(Date);
  });

  it("finds a product by id within its tenant", async () => {
    const tenantId = await createTestBusiness();
    const created = await createTestProduct(tenantId);

    const found = await repository.findById(
      tenantId,
      created.id,
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe("Test Laptop");
  });

  it("does not expose a product to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const product = await createTestProduct(tenantA);

    const found = await repository.findById(
      tenantB,
      product.id,
    );

    expect(found).toBeNull();
  });

  it("lists only products belonging to the requested tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const productA = await createTestProduct(tenantA);
    await createTestProduct(tenantB);

    const products = await repository.findAll(tenantA);

    expect(products).toHaveLength(1);
    expect(products[0]!.id).toBe(productA.id);
  });

  it("updates product pricing and packaging details", async () => {
    const tenantId = await createTestBusiness();
    const product = await createTestProduct(tenantId);

    const updated = await repository.update(
      tenantId,
      product.id,
      {
        name: "Updated Laptop",
        salePrice: "65000.00",
        wholesalePiecePrice: "60000.00",
        piecesPerBox: 12,
        boxQrCode: "UPDATED-BOX-QR",
      },
    );

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Updated Laptop");
    expect(updated?.salePrice).toBe("65000.00");
    expect(updated?.vendorCostPrice).toBe("50000.00");
    expect(updated?.wholesalePiecePrice).toBe("60000.00");
    expect(updated?.piecesPerBox).toBe(12);
    expect(updated?.boxQrCode).toBe("UPDATED-BOX-QR");

    // Unmodified values must remain unchanged.
    expect(updated?.wholesaleBoxPrice).toBe("60000.00");
    expect(updated?.cartonQrCode).toBe(product.cartonQrCode);
  });

  it("allows nullable product fields to be cleared", async () => {
    const tenantId = await createTestBusiness();
    const product = await createTestProduct(tenantId);

    const updated = await repository.update(
      tenantId,
      product.id,
      {
        boxSalePrice: null,
        piecesPerBox: null,
        boxQrCode: null,
      },
    );

    expect(updated?.boxSalePrice).toBeNull();
    expect(updated?.piecesPerBox).toBeNull();
    expect(updated?.boxQrCode).toBeNull();
  });

  it("deactivates a product", async () => {
    const tenantId = await createTestBusiness();
    const product = await createTestProduct(tenantId);

    const updated = await repository.setActive(
      tenantId,
      product.id,
      false,
    );

    expect(updated).not.toBeNull();
    expect(updated?.isActive).toBe(false);
  });

  it("does not update a product belonging to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const product = await createTestProduct(tenantA);

    const updated = await repository.update(
      tenantB,
      product.id,
      { name: "Unauthorized Update" },
    );

    expect(updated).toBeNull();
  });

  it("returns null when updating a nonexistent product", async () => {
    const tenantId = await createTestBusiness();

    const updated = await repository.update(
      tenantId,
      crypto.randomUUID(),
      { name: "Missing Product" },
    );

    expect(updated).toBeNull();
  });

  it("rejects duplicate QR identifiers within the same tenant", async () => {
    const tenantId = await createTestBusiness();
    const firstProduct = await createTestProduct(tenantId);

    await expect(
      repository.create(tenantId, {
        name: "Another Laptop",
        vendorCostPrice: "40000.00",
        salePrice: "50000.00",
        unit: "piece",
        boxQrCode: firstProduct.boxQrCode,
      }),
    ).rejects.toThrow();
  });
});
