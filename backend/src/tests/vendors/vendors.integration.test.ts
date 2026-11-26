import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";

import app from "../../app.ts";
import { pool } from "../../database/index.ts";
import { PostgresCategoryRepository } from "../../modules/categories/postgres-categories.repository.ts";
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

interface VendorResponse {
  data: {
    id: string;
    categoryId: string;
    categoryName: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface VendorListResponse {
  data: VendorResponse["data"][];
}

describe("Vendor API integration", () => {
  let server: Server;
  let baseUrl: string;

  let testBusinessId: string;
  let otherBusinessId: string;
  let categoryId: string;
  let testVendorId: string;

  let testToken: string;
  let otherToken: string;

  const testEmail = `vendor-integration-${Date.now()}@test.local`;
  const otherEmail = `vendor-isolation-${Date.now()}@test.local`;
  const testPassword = "IntegrationTest123!";

  const categoryRepository = new PostgresCategoryRepository();

  async function login(email: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: testPassword,
      }),
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as LoginResponse;

    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();

    return body.data.token;
  }

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

    baseUrl = `http://127.0.0.1:${address.port}`;

    const businessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Vendor Integration Business ${Date.now()}`],
    );

    testBusinessId = businessResult.rows[0]!.id;

    const otherBusinessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Vendor Isolation Business ${Date.now()}`],
    );

    otherBusinessId = otherBusinessResult.rows[0]!.id;

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
        "Vendor Integration Owner",
        testEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

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
        "Vendor Isolation Owner",
        otherEmail,
        passwordHash,
        "owner",
        true,
      ],
    );

    const category = await categoryRepository.create(testBusinessId, {
      name: `Vendor Integration Category ${Date.now()}`,
    });

    categoryId = category.id;

    testToken = await login(testEmail);
    otherToken = await login(otherEmail);
  });

  afterAll(async () => {
    if (testBusinessId) {
      await pool.query(
        `
          DELETE FROM vendors
          WHERE tenant_id = $1
        `,
        [testBusinessId],
      );

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
          DELETE FROM vendors
          WHERE tenant_id = $1
        `,
        [otherBusinessId],
      );

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
  });

  it("starts the API server", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);

    const body = (await response.json()) as HealthResponse;

    expect(body.status).toBe("success");
    expect(body.message).toBe("Sitara Bills API is running");
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("creates a vendor through the authenticated API", async () => {
    const response = await fetch(`${baseUrl}/api/vendors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        categoryId,
        name: "Integration Test Vendor",
        phone: "03001234567",
        email: "integration-vendor@example.com",
        address: "Karachi, Pakistan",
      }),
    });

    expect(response.status).toBe(201);

    const body = (await response.json()) as VendorResponse;

    testVendorId = body.data.id;

    expect(body.data.name).toBe("Integration Test Vendor");
    expect(body.data.categoryId).toBe(categoryId);
    expect(body.data.categoryName).toContain(
      "Vendor Integration Category",
    );
    expect(body.data.phone).toBe("03001234567");
    expect(body.data.email).toBe("integration-vendor@example.com");
    expect(body.data.address).toBe("Karachi, Pakistan");
  });

  it("retrieves a vendor through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as VendorResponse;

    expect(body.data.id).toBe(testVendorId);
    expect(body.data.name).toBe("Integration Test Vendor");
  });

  it("lists vendors belonging to the authenticated tenant", async () => {
    const response = await fetch(`${baseUrl}/api/vendors`, {
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as VendorListResponse;

    expect(Array.isArray(body.data)).toBe(true);
    expect(
      body.data.some((vendor) => vendor.id === testVendorId),
    ).toBe(true);
  });

  it("filters vendors by category and search term", async () => {
    const query = new URLSearchParams({
      categoryId,
      search: "Integration Test",
    });

    const response = await fetch(
      `${baseUrl}/api/vendors?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as VendorListResponse;

    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe(testVendorId);
  });

  it("updates a vendor through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          name: "Updated Integration Vendor",
          phone: "03111234567",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as VendorResponse;

    expect(body.data.id).toBe(testVendorId);
    expect(body.data.name).toBe("Updated Integration Vendor");
    expect(body.data.phone).toBe("03111234567");
  });

  it("prevents another tenant from accessing a vendor", async () => {
    const response = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
      {
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      },
    );

    expect(response.status).toBe(404);
  });

  it("prevents another tenant from updating a vendor", async () => {
    const response = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
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

  it("deletes a vendor through the authenticated API", async () => {
    const response = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(response.status).toBe(204);

    const findResponse = await fetch(
      `${baseUrl}/api/vendors/${testVendorId}`,
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      },
    );

    expect(findResponse.status).toBe(404);
  });
});