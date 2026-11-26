
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { pool } from "../../database/index.ts";
import { PostgresBusinessRepository } from "../../modules/business/postgres-business.repository.ts";

describe("PostgresBusinessRepository", () => {
  const repository = new PostgresBusinessRepository();

  let createdBusinessIds: string[] = [];

  beforeEach(() => {
    createdBusinessIds = [];
  });

  afterEach(async () => {
    if (createdBusinessIds.length === 0) {
      return;
    }

    await pool.query(
      `
        DELETE FROM businesses
        WHERE id = ANY($1::uuid[])
      `,
      [createdBusinessIds],
    );
  });

  it("creates a business", async () => {
    const business = await repository.create({
      name: "Test Business",
    });

    createdBusinessIds.push(business.id);

    expect(business.id).toBeDefined();
    expect(business.name).toBe("Test Business");
    expect(business.isActive).toBe(true);
    expect(business.createdAt).toBeInstanceOf(Date);
    expect(business.updatedAt).toBeInstanceOf(Date);
  });

  it("finds a business by id", async () => {
    const created = await repository.create({
      name: "Find Test Business",
    });

    createdBusinessIds.push(created.id);

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe("Find Test Business");
  });

  it("returns null for an unknown business", async () => {
    const found = await repository.findById(crypto.randomUUID());

    expect(found).toBeNull();
  });

  it("updates a business name", async () => {
    const created = await repository.create({
      name: "Original Business",
    });

    createdBusinessIds.push(created.id);

    const updated = await repository.updateName(
      created.id,
      "Updated Business",
    );

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Updated Business");
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime(),
    );
  });

  it("returns null when updating an unknown business", async () => {
    const updated = await repository.updateName(
      crypto.randomUUID(),
      "Updated Business",
    );

    expect(updated).toBeNull();
  });
});
