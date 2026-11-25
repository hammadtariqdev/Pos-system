import { pool } from "../src/database/index.ts";
import { hashPassword } from "../src/utils/password.ts";
import type { PoolClient } from "pg";
const accounts = {
  primaryOwner: {
    email: "owner@dev.local",
    password: "DevPassword123!",
    name: "Dev Owner",
    businessName: "Sitara Bills Demo Store",
  },
  employee: {
    email: "employee@dev.local",
    password: "DevEmployee123!",
    name: "Dev Employee",
  },
  secondOwner: {
    email: "owner2@dev.local",
    password: "DevOwner2Password!",
    name: "Second Dev Owner",
    businessName: "Second Demo Store",
  },
};

async function ensureOwner(
  client: PoolClient,
  account: {
    email: string;
    password: string;
    name: string;
    businessName: string;
  },
): Promise<string> {
  const existing = await client.query<{
    tenant_id: string;
    role: string;
  }>(
    `
      SELECT tenant_id, role
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [account.email],
  );

  const user = existing.rows[0];

  if (user) {
    if (user.role !== "owner") {
      throw new Error(`${account.email} is not an owner account.`);
    }

    console.log(`Owner already exists: ${account.email}`);
    return user.tenant_id;
  }

  const businessResult = await client.query<{ id: string }>(
    `
      INSERT INTO businesses (name)
      VALUES ($1)
      RETURNING id
    `,
    [account.businessName],
  );

  const business = businessResult.rows[0];

  if (!business) {
    throw new Error(`Failed to create ${account.businessName}.`);
  }

  const passwordHash = await hashPassword(account.password);

  await client.query(
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
    [business.id, account.name, account.email, passwordHash, "owner", true],
  );

  console.log(`Owner created: ${account.email}`);
  console.log(`Business: ${account.businessName}`);

  return business.id;
}

async function ensureEmployee(
  client: PoolClient,
  tenantId: string,
): Promise<void> {
  const existing = await client.query<{
    tenant_id: string;
    role: string;
  }>(
    `
      SELECT tenant_id, role
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [accounts.employee.email],
  );

  const employee = existing.rows[0];

  if (employee) {
    if (employee.role !== "employee" || employee.tenant_id !== tenantId) {
      throw new Error("Existing employee has an unexpected role or business.");
    }

    console.log(`Employee already exists: ${accounts.employee.email}`);
    return;
  }

  const passwordHash = await hashPassword(accounts.employee.password);

  await client.query(
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
      tenantId,
      accounts.employee.name,
      accounts.employee.email,
      passwordHash,
      "employee",
      true,
    ],
  );

  console.log(`Employee created: ${accounts.employee.email}`);
}

async function seedDevelopmentData(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const primaryTenantId = await ensureOwner(client, accounts.primaryOwner);

    await ensureEmployee(client, primaryTenantId);

    const secondTenantId = await ensureOwner(client, accounts.secondOwner);

    await client.query("COMMIT");

    console.log("\nDevelopment seed completed.");
    console.log("Primary business ID:", primaryTenantId);
    console.log("Second business ID:", secondTenantId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await seedDevelopmentData();
} catch (error) {
  console.error("Development seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
