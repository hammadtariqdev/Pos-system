import { beforeAll, describe, expect, it } from "vitest";

import { pool } from "../../database/index";
import { PostgresSalesRepository } from "../../modules/sales/postgres-sales.repository";

async function requireRow<T>(row: T | undefined): Promise<T> {
  if (!row) {
    throw new Error("Expected database row");
  }

  return row;
}

describe("PostgresSalesRepository", () => {
  let repository: PostgresSalesRepository;

  let tenantId: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    repository = new PostgresSalesRepository(pool);

    const business = await pool.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM businesses
        LIMIT 1
        `,
    );

    tenantId = (await requireRow(business.rows[0])).id;

    const user = await pool.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM users
        WHERE tenant_id = $1
        LIMIT 1
        `,
      [tenantId],
    );

    userId = (await requireRow(user.rows[0])).id;

    const product = await pool.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM products
        WHERE tenant_id = $1
          AND is_active = true
        LIMIT 1
        `,
      [tenantId],
    );

    productId = (await requireRow(product.rows[0])).id;

    await pool.query(
      `
      INSERT INTO inventory_stock (
        tenant_id,
        product_id,
        stock_pieces,
        low_stock_threshold
      )
      VALUES ($1,$2,100,10)
      ON CONFLICT (tenant_id, product_id)
      DO UPDATE SET
        stock_pieces = 100
      `,
      [tenantId, productId],
    );
  });

  it("creates a sale and deducts inventory", async () => {
    const billNumber = `TEST-${Date.now()}`;

    const before = await pool.query<{
      stock_pieces: number;
    }>(
      `
        SELECT stock_pieces
        FROM inventory_stock
        WHERE tenant_id = $1
          AND product_id = $2
        `,
      [tenantId, productId],
    );

    const beforeStock = (await requireRow(before.rows[0])).stock_pieces;

    const sale = await repository.createSale(tenantId, userId, {
      billNumber,
      items: [
        {
          productId,
          quantity: 2,
        },
      ],
      paidAmount: 0,
      paymentMethod: "credit",
    });

    expect(sale.billNumber).toBe(billNumber);

    expect(sale.items).toHaveLength(1);

    const after = await pool.query<{
      stock_pieces: number;
    }>(
      `
        SELECT stock_pieces
        FROM inventory_stock
        WHERE tenant_id = $1
          AND product_id = $2
        `,
      [tenantId, productId],
    );

    const afterStock = (await requireRow(after.rows[0])).stock_pieces;

    expect(afterStock).toBe(beforeStock - 2);
  });

  it("retrieves a sale", async () => {
    const billNumber = `TEST-GET-${Date.now()}`;

    const sale = await repository.createSale(tenantId, userId, {
      billNumber,
      items: [
        {
          productId,
          quantity: 1,
        },
      ],
    });

    const result = await repository.findById(tenantId, sale.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(sale.id);
    expect(result?.items).toHaveLength(1);
  });

  it("returns null for another sale id", async () => {
    const result = await repository.findById(
      tenantId,
      "00000000-0000-0000-0000-000000000000",
    );

    expect(result).toBeNull();
  });

  it("lists sales for the tenant", async () => {
    const result = await repository.findAll(tenantId);

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects a sale when stock is insufficient", async () => {
    await expect(
      repository.createSale(tenantId, userId, {
        billNumber: `TEST-LOW-${Date.now()}`,
        items: [
          {
            productId,
            quantity: 100000,
          },
        ],
      }),
    ).rejects.toThrow("Insufficient stock");
  });

  it("rejects payment greater than total", async () => {
    await expect(
      repository.createSale(tenantId, userId, {
        billNumber: `TEST-PAY-${Date.now()}`,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 100,
          },
        ],
        paidAmount: 101,
      }),
    ).rejects.toThrow("Paid amount cannot exceed total amount");
  });
});
