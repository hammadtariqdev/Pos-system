
import { pool } from "../src/database/index.ts";
import { hashPassword } from "../src/utils/password.ts";

const email = "owner2@dev.local";
const password = "DevOwner2Password!";
const businessName = "Second Demo Store";
const ownerName = "Second Dev Owner";

const client = await pool.connect();

let transactionStarted = false;

try {
  const existingUser = await client.query<{
    id: string;
    tenant_id: string;
  }>(
    `
      SELECT id, tenant_id
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (existingUser.rows.length > 0) {
    console.log(`Second owner already exists: ${email}`);
    console.log(`Business ID: ${existingUser.rows[0]!.tenant_id}`);
  } else {
    const passwordHash = await hashPassword(password);

    await client.query("BEGIN");
    transactionStarted = true;

    const businessResult = await client.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [businessName],
    );

    const business = businessResult.rows[0];

    if (!business) {
      throw new Error("Failed to create second development business.");
    }

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
        business.id,
        ownerName,
        email,
        passwordHash,
        "owner",
        true,
      ],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    console.log("Second development tenant created.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Business: ${businessName}`);
    console.log(`Business ID: ${business.id}`);
  }
} catch (error) {
  if (transactionStarted) {
    await client.query("ROLLBACK");
  }

  console.error("Second tenant seeding failed:", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
