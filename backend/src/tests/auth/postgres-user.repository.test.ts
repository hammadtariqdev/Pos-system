
import {
  afterAll,
  afterEach,
  describe,
  expect,
  it,
} from "vitest";
import { pool } from "../../database/index.ts";
import { PostgresUserRepository } from "../../modules/auth/postgres-user.repository.ts";

describe("PostgresUserRepository", () => {
  const repository = new PostgresUserRepository();

  let createdTenantIds: string[] = [];

  async function createTestBusiness(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Test Business ${crypto.randomUUID()}`],
    );

    const tenantId = result.rows[0]!.id;
    createdTenantIds.push(tenantId);

    return tenantId;
  }

  afterEach(async () => {
    if (createdTenantIds.length === 0) {
      return;
    }

    await pool.query(
      `
        DELETE FROM sessions
        USING users
        WHERE sessions.user_id = users.id
          AND users.tenant_id = ANY($1::uuid[])
      `,
      [createdTenantIds],
    );

    await pool.query(
      `
        DELETE FROM users
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

  it("creates a user", async () => {
    const tenantId = await createTestBusiness();

    const user = await repository.create({
      tenantId,
      name: "Test Owner",
      email: "owner@test.local",
      passwordHash: "test-hash",
      role: "owner",
    });

    expect(user.id).toBeDefined();
    expect(user.tenantId).toBe(tenantId);
    expect(user.name).toBe("Test Owner");
    expect(user.email).toBe("owner@test.local");
    expect(user.passwordHash).toBe("test-hash");
    expect(user.role).toBe("owner");
    expect(user.isActive).toBe(true);
  });

  it("finds a user by email", async () => {
    const tenantId = await createTestBusiness();

    const created = await repository.create({
      tenantId,
      name: "Test Employee",
      email: "employee@test.local",
      passwordHash: "test-hash",
      role: "employee",
    });

    const found = await repository.findByEmail("employee@test.local");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe("Test Employee");
  });

  it("returns null for an unknown email", async () => {
    const found = await repository.findByEmail(
      "does-not-exist@test.local",
    );

    expect(found).toBeNull();
  });

  it("finds a user by id", async () => {
    const tenantId = await createTestBusiness();

    const created = await repository.create({
      tenantId,
      name: "Test User",
      email: "id-test@test.local",
      passwordHash: "test-hash",
      role: "employee",
    });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.email).toBe("id-test@test.local");
  });

  it("returns null for an unknown id", async () => {
    const found = await repository.findById(crypto.randomUUID());

    expect(found).toBeNull();
  });

  it("normalizes email to lowercase when creating a user", async () => {
    const tenantId = await createTestBusiness();

    const user = await repository.create({
      tenantId,
      name: "Case Test",
      email: "CASE@TEST.LOCAL",
      passwordHash: "test-hash",
      role: "owner",
    });

    expect(user.email).toBe("case@test.local");
  });

  it("normalizes email to lowercase when searching", async () => {
    const tenantId = await createTestBusiness();

    await repository.create({
      tenantId,
      name: "Search Test",
      email: "search@test.local",
      passwordHash: "test-hash",
      role: "owner",
    });

    const found = await repository.findByEmail("SEARCH@TEST.LOCAL");

    expect(found).not.toBeNull();
    expect(found?.email).toBe("search@test.local");
  });

  it("finds a user within their own tenant", async () => {
    const tenantA = await createTestBusiness();

    const user = await repository.create({
      tenantId: tenantA,
      name: "Tenant A User",
      email: "tenant-a@test.local",
      passwordHash: "test-hash",
      role: "owner",
    });

    const found = await repository.findByIdAndTenant(
      user.id,
      tenantA,
    );

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.tenantId).toBe(tenantA);
  });

  it("does not find a user belonging to another tenant", async () => {
    const tenantA = await createTestBusiness();
    const tenantB = await createTestBusiness();

    const user = await repository.create({
      tenantId: tenantA,
      name: "Tenant A User",
      email: "tenant-a-isolation@test.local",
      passwordHash: "test-hash",
      role: "owner",
    });

    const found = await repository.findByIdAndTenant(
      user.id,
      tenantB,
    );

    expect(found).toBeNull();
  });

  it("returns null for a nonexistent user in a tenant", async () => {
    const tenantId = await createTestBusiness();

    const found = await repository.findByIdAndTenant(
      crypto.randomUUID(),
      tenantId,
    );

    expect(found).toBeNull();
  });
});
