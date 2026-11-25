import { describe, expect, it, afterAll, beforeAll } from "vitest";
import type { Server } from "node:http";
import app from "../../app.ts";
import { pool } from "../../database/index.ts";
import { hashPassword } from "../../utils/password.ts";

interface HealthResponse {
  status: string;
  message: string;
  data: {
    uptime: number;
  };
}

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

interface ProductResponse {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;

  vendorCostPrice: string;
  salePrice: string;
  boxSalePrice: string | null;
  wholesalePiecePrice: string | null;
  wholesaleBoxPrice: string | null;
  wholesaleCartonPrice: string | null;
  oldSalePrice: string | null;

  unit: string;
  piecesPerBox: number | null;
  boxesPerCarton: number | null;

  pieceQrCode: string | null;
  boxQrCode: string | null;
  cartonQrCode: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
describe("Product API integration", () => {
  let server: Server;
  let baseUrl: string;
  let otherBusinessId: string;

  const otherEmail = `product-isolation-${Date.now()}@test.local`;
  let testBusinessId: string;
  let testUserId: string;
  let testProductId: string;

  const testEmail = `product-integration-${Date.now()}@test.local`;
  const testPassword = "IntegrationTest123!";

  beforeAll(async () => {
    server = await new Promise<Server>((resolve, reject) => {
      const httpServer = app.listen(0);

      httpServer.once("listening", () => resolve(httpServer));
      httpServer.once("error", reject);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not determine test server address");
    }
    afterAll(async () => {
      if (testBusinessId) {
        await pool.query(
          `
        DELETE FROM products
        WHERE tenant_id = $1
      `,
          [testBusinessId],
        );

        await pool.query(
          `
        DELETE FROM users
        WHERE tenant_id = $1
      `,
          [testBusinessId],
        );

        await pool.query(
          `
        DELETE FROM businesses
        WHERE id = $1
      `,
          [testBusinessId],
        );
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    });
    baseUrl = `http://127.0.0.1:${address.port}`;

    const businessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      ["Product Integration Test Business"],
    );

    testBusinessId = businessResult.rows[0]!.id;

    const passwordHash = await hashPassword(testPassword);

    const userResult = await pool.query<{ id: string }>(
      `
        INSERT INTO users (
          tenant_id,
          name,
          email,
          password_hash,
          role,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        testBusinessId,
        "Product Integration Test User",
        testEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

    testUserId = userResult.rows[0]!.id;
  });

  afterAll(async () => {
    if (testProductId) {
      await pool.query(
        `
          DELETE FROM products
          WHERE id = $1
            AND tenant_id = $2
        `,
        [testProductId, testBusinessId],
      );
    }

    if (testUserId) {
      await pool.query(
        `
          DELETE FROM users
          WHERE id = $1
            AND tenant_id = $2
        `,
        [testUserId, testBusinessId],
      );
    }

    if (testBusinessId) {
      await pool.query(
        `
          DELETE FROM businesses
          WHERE id = $1
        `,
        [testBusinessId],
      );
    }
    if (otherBusinessId) {
      await pool.query(`DELETE FROM products WHERE tenant_id = $1`, [
        otherBusinessId,
      ]);

      await pool.query(`DELETE FROM users WHERE tenant_id = $1`, [
        otherBusinessId,
      ]);

      await pool.query(`DELETE FROM businesses WHERE id = $1`, [
        otherBusinessId,
      ]);
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("starts the API server", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);

    const body = (await response.json()) as HealthResponse;

    expect(body.status).toBe("success");
    expect(body.message).toBe("Sitara Bills API is running");
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("creates a product through the authenticated API", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    expect(loginResponse.status).toBe(200);

    const loginBody = (await loginResponse.json()) as LoginResponse;

    expect(loginBody.success).toBe(true);
    expect(loginBody.data.token).toBeTruthy();

    const productResponse = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginBody.data.token}`,
      },
      body: JSON.stringify({
        name: "Integration Test Product",
        vendorCostPrice: "100.00",
        salePrice: "150.00",
        unit: "piece",
      }),
    });

    expect(productResponse.status).toBe(201);

    const productBody = (await productResponse.json()) as ProductResponse;
   
    testProductId = productBody.id;

    expect(productBody.name).toBe("Integration Test Product");
    expect(productBody.vendorCostPrice).toBe("100.00");
    expect(productBody.salePrice).toBe("150.00");
    expect(productBody.unit).toBe("piece");
    expect(productBody.isActive).toBe(true);
  });

  it("retrieves a product through the authenticated API", async () => {
    // Log in using the test account.
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginBody = (await loginResponse.json()) as LoginResponse;

    const response = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.token}`,
      },
    });

    expect(response.status).toBe(200);

    const product = (await response.json()) as ProductResponse;

    expect(product.id).toBe(testProductId);
    expect(product.name).toBe("Integration Test Product");
    expect(product.vendorCostPrice).toBe("100.00");
    expect(product.salePrice).toBe("150.00");
  });
  it("lists products belonging to the authenticated tenant", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginBody = (await loginResponse.json()) as LoginResponse;

    const response = await fetch(`${baseUrl}/api/products`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.token}`,
      },
    });

    expect(response.status).toBe(200);

    const products = (await response.json()) as ProductResponse[];

    expect(Array.isArray(products)).toBe(true);
    expect(products.some((product) => product.id === testProductId)).toBe(true);
  });
  it("prevents another tenant from accessing a product", async () => {
    // Create a second business.
    const businessResult = await pool.query<{ id: string }>(
      `
      INSERT INTO businesses (name)
      VALUES ($1)
      RETURNING id
    `,
      ["Product Isolation Test Business"],
    );

    otherBusinessId = businessResult.rows[0]!.id;

    // Create an owner for the second business.
    const passwordHash = await hashPassword(testPassword);

    await pool.query(
      `
      INSERT INTO users (
        tenant_id,
        name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        otherBusinessId,
        "Isolation Test User",
        otherEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

    // Log in as the second business.
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: otherEmail,
        password: testPassword,
      }),
    });

    expect(loginResponse.status).toBe(200);

    const loginBody = (await loginResponse.json()) as LoginResponse;

    // Attempt to access the first business's product.
    const response = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.token}`,
      },
    });

    expect(response.status).toBe(404);
  });
  it("updates a product through the authenticated API", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginBody = (await loginResponse.json()) as LoginResponse;

    const response = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginBody.data.token}`,
      },
      body: JSON.stringify({
        name: "Updated Integration Product",
        salePrice: "200.00",
      }),
    });

    expect(response.status).toBe(200);

    const product = (await response.json()) as ProductResponse;

    expect(product.id).toBe(testProductId);
    expect(product.name).toBe("Updated Integration Product");
    expect(product.salePrice).toBe("200.00");
    expect(product.vendorCostPrice).toBe("100.00");
  });
  it("deactivates a product through the authenticated API", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginBody = (await loginResponse.json()) as LoginResponse;

    const response = await fetch(
      `${baseUrl}/api/products/${testProductId}/active`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginBody.data.token}`,
        },
        body: JSON.stringify({
          isActive: false,
        }),
      },
    );

    expect(response.status).toBe(200);

    const product = (await response.json()) as ProductResponse;

    expect(product.id).toBe(testProductId);
    expect(product.isActive).toBe(false);
  });
  it("prevents another tenant from updating a product", async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: otherEmail,
        password: testPassword,
      }),
    });

    const loginBody = (await loginResponse.json()) as LoginResponse;

    const response = await fetch(`${baseUrl}/api/products/${testProductId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginBody.data.token}`,
      },
      body: JSON.stringify({
        name: "Unauthorized Update",
      }),
    });

    expect(response.status).toBe(404);
  });
  it("prevents another tenant from deactivating a product", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: otherEmail,
      password: testPassword,
    }),
  });

  const loginBody = (await loginResponse.json()) as LoginResponse;

  const response = await fetch(
    `${baseUrl}/api/products/${testProductId}/active`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginBody.data.token}`,
      },
      body: JSON.stringify({
        isActive: false,
      }),
    },
  );

  expect(response.status).toBe(404);
});
});
