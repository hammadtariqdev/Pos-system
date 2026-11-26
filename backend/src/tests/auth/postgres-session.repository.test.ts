import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { pool } from "../../database/index.ts";
import { PostgresSessionRepository } from "../../modules/auth/postgres-session.repository.ts";

describe("PostgresSessionRepository", () => {
  const repository = new PostgresSessionRepository();

  let createdTenantIds: string[] = [];

  async function createTestBusiness(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [`Session Test Business ${crypto.randomUUID()}`],
    );

    const tenantId = result.rows[0]!.id;
    createdTenantIds.push(tenantId);

    return tenantId;
  }

  async function createTestUser(): Promise<string> {
    const businessId = await createTestBusiness();

    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO users (
          tenant_id,
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        businessId,
        "Session Test User",
        `${crypto.randomUUID()}@test.local`,
        "test-hash",
        "owner",
      ],
    );

    return result.rows[0]!.id;
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

  it("creates a session", async () => {
    const userId = await createTestUser();

    const session = await repository.create({
      userId,
      tokenHash: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(session.lastActivityAt).toBeInstanceOf(Date);
  });

  it("finds a session by token hash", async () => {
    const userId = await createTestUser();

    const created = await repository.create({
      userId,
      tokenHash: "find-me-hash",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const found = await repository.findByTokenHash("find-me-hash");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.userId).toBe(userId);
  });

  it("returns null for an unknown token hash", async () => {
    const found = await repository.findByTokenHash("does-not-exist");

    expect(found).toBeNull();
  });

  it("updates last activity", async () => {
    const userId = await createTestUser();

    const created = await repository.create({
      userId,
      tokenHash: "activity-hash",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const before = created.lastActivityAt;

    await new Promise((resolve) => setTimeout(resolve, 20));

    await repository.updateLastActivity(created.id);

    const updated = await repository.findByTokenHash("activity-hash");

    expect(updated).not.toBeNull();
    expect(updated!.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it("deletes a session", async () => {
    const userId = await createTestUser();

    await repository.create({
      userId,
      tokenHash: "delete-me-hash",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const created = await repository.findByTokenHash("delete-me-hash");

    await repository.delete(created!.id);

    const found = await repository.findByTokenHash("delete-me-hash");

    expect(found).toBeNull();
  });

  it("keeps a maximum of four active sessions", async () => {
    const userId = await createTestUser();

    const testRunId = crypto.randomUUID();

    const createdSessions = [];

    for (let i = 0; i < 5; i++) {
      const session = await repository.createWithLimit({
        userId,
        tokenHash: `${testRunId}-limit-test-${i}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      createdSessions.push(session);
    }

    const count = await repository.countByUserId(userId);

    expect(count).toBe(4);

    const oldest = await repository.findByTokenHash(
      `${testRunId}-limit-test-0`,
    );

    expect(oldest).toBeNull();

    for (let i = 1; i < 5; i++) {
      const found = await repository.findByTokenHash(
        `${testRunId}-limit-test-${i}`,
      );
      expect(found).not.toBeNull();
    }
  });

  it("preserves the four-session limit during concurrent creation", async () => {
    const userId = await createTestUser();

    const testRunId = crypto.randomUUID();

    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        repository.createWithLimit({
          userId,
          tokenHash: `${testRunId}-concurrent-test-${index}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
      ),
    );

    const count = await repository.countByUserId(userId);

    expect(count).toBe(4);
  }, 120_000);

  it("does not remove sessions belonging to another user", async () => {
    const firstUserId = await createTestUser();
    const secondUserId = await createTestUser();

    const testRunId = crypto.randomUUID();

    const otherUserSession = await repository.createWithLimit({
      userId: secondUserId,
      tokenHash: `${testRunId}-other-user-session`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    for (let i = 0; i < 5; i++) {
      await repository.createWithLimit({
        userId: firstUserId,
        tokenHash: `${testRunId}-first-user-${i}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    }

    const found = await repository.findByTokenHash(otherUserSession.tokenHash);

    expect(found).not.toBeNull();
    expect(found?.userId).toBe(secondUserId);
    expect(await repository.countByUserId(secondUserId)).toBe(1);
  });
});
