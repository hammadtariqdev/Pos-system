import { beforeAll, describe, expect, it } from "vitest";

import app from "../../app.ts";
import { pool } from "../../database/index.ts";

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      tenantId: string;
      name: string;
      email: string;
      role: "owner" | "employee";
    };
    token: string;
  };
}

interface SaleResponse {
  success: boolean;
  data: {
    id: string;
    billNumber: string;
    subtotal: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMethod: "cash" | "credit" | "partial";
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  };
}

interface TestProduct {
  id: string;
  name: string;
  sale_price: string;
}

async function loginAsOwner(): Promise<string> {
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
    tenant_id: string;
    name: string;
    role: "owner" | "employee";
  }>(
    `
      SELECT
        id,
        email,
        password_hash,
        tenant_id,
        name,
        role
      FROM users
      WHERE role = 'owner'
      ORDER BY created_at
      LIMIT 1
      `,
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("No owner user found for sales integration test");
  }

  /*
   * The integration tests in this project authenticate
   * through the real /api/auth/login endpoint.
   *
   * This helper intentionally expects the seeded owner
   * credentials from the existing auth integration setup.
   */
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: "Owner@123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Owner login failed: ${response.status}`);
  }

  const body = (await response.json()) as LoginResponse;

  if (!body.success || !body.data?.token) {
    throw new Error("Owner login did not return a token");
  }

  return body.data.token;
}

async function getTestProduct(): Promise<TestProduct> {
  const result = await pool.query<TestProduct>(
    `
      SELECT
        id,
        name,
        sale_price
      FROM products
      WHERE is_active = true
      ORDER BY created_at
      LIMIT 1
      `,
  );

  const product = result.rows[0];

  if (!product) {
    throw new Error("No active product found for sales integration test");
  }

  return product;
}

describe("Sales API", () => {
  let token: string;
  let productId: string;

  beforeAll(async () => {
    token = await loginAsOwner();

    const product = await getTestProduct();

    productId = product.id;

    await pool.query(
      `
      INSERT INTO inventory_stock (
        tenant_id,
        product_id,
        stock_pieces,
        low_stock_threshold
      )
      SELECT
        tenant_id,
        $1,
        100,
        10
      FROM products
      WHERE id = $1
      ON CONFLICT (tenant_id, product_id)
      DO UPDATE SET
        stock_pieces = 100,
        updated_at = NOW()
      `,
      [productId],
    );
  });

  it("creates a bill and deducts stock", async () => {
    const beforeResult = await pool.query<{
      stock_pieces: number;
    }>(
      `
        SELECT stock_pieces
        FROM inventory_stock
        WHERE product_id = $1
        `,
      [productId],
    );

    const before = beforeResult.rows[0];

    expect(before).toBeDefined();

    const response = await fetch("http://localhost:5000/api/v1/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        billNumber: `BILL-${Date.now()}`,
        items: [
          {
            productId,
            quantity: 2,
          },
        ],
        discount: 0,
        paidAmount: 0,
        paymentMethod: "credit",
      }),
    });

    expect(response.status).toBe(201);

    const body = (await response.json()) as SaleResponse;

    expect(body.success).toBe(true);

    expect(body.data.items).toHaveLength(1);

    expect(body.data.items[0]?.productId).toBe(productId);

    const afterResult = await pool.query<{
      stock_pieces: number;
    }>(
      `
        SELECT stock_pieces
        FROM inventory_stock
        WHERE product_id = $1
        `,
      [productId],
    );

    const after = afterResult.rows[0];

    expect(after).toBeDefined();

    expect(after!.stock_pieces).toBe(before!.stock_pieces - 2);
  });

  it("lists bills", async () => {
    const response = await fetch("http://localhost:5000/api/v1/sales", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      success: boolean;
      data: unknown[];
    };

    expect(body.success).toBe(true);

    expect(Array.isArray(body.data)).toBe(true);
  });

  it("prevents selling more than available stock", async () => {
    const response = await fetch("http://localhost:5000/api/v1/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        billNumber: `OVERSELL-${Date.now()}`,
        items: [
          {
            productId,
            quantity: 999999,
          },
        ],
      }),
    });

    expect(response.status).toBe(400);

    const body = (await response.json()) as {
      success: boolean;
      message: string;
    };

    expect(body.message).toContain("Insufficient stock");
  });
});
