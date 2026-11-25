import { pool } from "../src/database/index.ts";
import { hashPassword } from "../src/utils/password.ts";

const ownerEmail = "owner@dev.local";
const employeeEmail = "employee@dev.local";
const employeePassword = "DevEmployee123!";

try {
  // Find the existing owner's business.
  const ownerResult = await pool.query<{
    id: string;
    tenant_id: string;
  }>(
    `
      SELECT id, tenant_id
      FROM users
      WHERE email = $1
        AND role = 'owner'
        AND is_active = TRUE
      LIMIT 1
    `,
    [ownerEmail],
  );

  const owner = ownerResult.rows[0];

  if (!owner) {
    throw new Error("Development owner not found. Seed the owner first.");
  }

  // Check whether the employee already exists.
  const existingEmployee = await pool.query<{
    id: string;
  }>(
    `
      SELECT id
      FROM users
      WHERE email = $1
    `,
    [employeeEmail],
  );

  if (existingEmployee.rowCount) {
    console.log(`Dev employee already exists: ${employeeEmail}`);
  } else {
    const passwordHash = await hashPassword(employeePassword);

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
        owner.tenant_id,
        "Dev Employee",
        employeeEmail,
        passwordHash,
        "employee",
        true,
      ],
    );

    console.log("Dev employee created.");
  }

  console.log(`Email: ${employeeEmail}`);
  console.log(`Password: ${employeePassword}`);
  console.log(`Business ID: ${owner.tenant_id}`);
} catch (error) {
  console.error("Employee seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}