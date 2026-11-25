import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Server } from "node:http";

import app from "../../app.ts";
import { pool } from "../../database/index.ts";
import { hashPassword } from "../../utils/password.ts";

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

interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SingleCategoryResponse {
  data: CategoryResponse;
}

interface CategoryListResponse {
  data: CategoryResponse[];
}

interface ErrorResponse {
  message: string;
}

describe("Category API integration", () => {
  let server: Server;
  let baseUrl: string;

  let testBusinessId: string;
  let otherBusinessId: string;

  let testToken: string;
  let otherToken: string;

  let testCategoryId: string;

  const testEmail = `category-integration-${Date.now()}@test.local`;
  const otherEmail = `category-isolation-${Date.now()}@test.local`;
  const testPassword = "IntegrationTest123!";

  beforeAll(async () => {
    // Start the actual Express application.
    server = await new Promise<Server>((resolve, reject) => {
      const httpServer = app.listen(0);

      httpServer.once("listening", () => resolve(httpServer));
      httpServer.once("error", reject);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not determine test server address");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;

    // Create the first test business.
    const businessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      ["Category Integration Test Business"],
    );

    testBusinessId = businessResult.rows[0]!.id;

    // Create the first business owner.
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
        testBusinessId,
        "Category Integration Test Owner",
        testEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

    // Create another business for tenant isolation tests.
    const otherBusinessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      ["Category Isolation Test Business"],
    );

    otherBusinessId = otherBusinessResult.rows[0]!.id;

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
        "Category Isolation Test Owner",
        otherEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

    // Authenticate the first owner once.
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

    if (!loginResponse.ok) {
      throw new Error("Could not authenticate category integration test owner");
    }

    const loginBody = (await loginResponse.json()) as LoginResponse;
    testToken = loginBody.data.token;

    // Authenticate the second owner once.
    const otherLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: otherEmail,
        password: testPassword,
      }),
    });

    if (!otherLoginResponse.ok) {
      throw new Error("Could not authenticate category isolation test owner");
    }

    const otherLoginBody = (await otherLoginResponse.json()) as LoginResponse;

    otherToken = otherLoginBody.data.token;
  });

  afterAll(async () => {
    // Close the HTTP server.
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    // Delete test data in foreign-key-safe order.
    if (testBusinessId) {
      await pool.query(
        `
          DELETE FROM categories
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

    if (otherBusinessId) {
      await pool.query(
        `
          DELETE FROM categories
          WHERE tenant_id = $1
        `,
        [otherBusinessId],
      );

      await pool.query(
        `
          DELETE FROM users
          WHERE tenant_id = $1
        `,
        [otherBusinessId],
      );

      await pool.query(
        `
          DELETE FROM businesses
          WHERE id = $1
        `,
        [otherBusinessId],
      );
    }
  });

  it("starts the API server", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
  });

  it("rejects unauthenticated category requests", async () => {
    const response = await fetch(`${baseUrl}/api/categories`);

    expect(response.status).toBe(401);
  });

  it("creates a category through the authenticated API", async () => {
    const response = await fetch(`${baseUrl}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        name: "Integration Electronics",
        description: "Electronics created through integration testing",
      }),
    });

    expect(response.status).toBe(201);

    const body = (await response.json()) as SingleCategoryResponse;

    testCategoryId = body.data.id;

    expect(body.data.name).toBe("Integration Electronics");
    expect(body.data.description).toBe(
      "Electronics created through integration testing",
    );
    expect(body.data.isActive).toBe(true);
  });

  it("retrieves a category through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}`,
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as SingleCategoryResponse;

    expect(body.data.id).toBe(testCategoryId);
    expect(body.data.name).toBe("Integration Electronics");
  });

  it("lists categories belonging to the authenticated tenant", async () => {
    const response = await fetch(`${baseUrl}/api/categories`, {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as CategoryListResponse;

    expect(Array.isArray(body.data)).toBe(true);

    expect(body.data.some((category) => category.id === testCategoryId)).toBe(
      true,
    );
  });

  it("updates a category through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          name: "Updated Integration Electronics",
          description: "Updated integration description",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as SingleCategoryResponse;

    expect(body.data.id).toBe(testCategoryId);
    expect(body.data.name).toBe("Updated Integration Electronics");
    expect(body.data.description).toBe("Updated integration description");
  });

  it("deactivates a category through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}/active`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          isActive: false,
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as SingleCategoryResponse;

    expect(body.data.id).toBe(testCategoryId);
    expect(body.data.isActive).toBe(false);
  });

  it("prevents another tenant from accessing a category", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}`,
      {
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      },
    );

    expect(response.status).toBe(404);
  });

  it("prevents another tenant from updating a category", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherToken}`,
        },
        body: JSON.stringify({
          name: "Unauthorized Update",
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("prevents another tenant from changing category status", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${testCategoryId}/active`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherToken}`,
        },
        body: JSON.stringify({
          isActive: false,
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for a nonexistent category", async () => {
    const response = await fetch(
      `${baseUrl}/api/categories/${crypto.randomUUID()}`,
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(response.status).toBe(404);
  });
});
