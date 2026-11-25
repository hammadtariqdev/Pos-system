
import { pool } from "../src/database/index.ts";
import { hashPassword } from "../src/utils/password.ts";

const email = "owner@dev.local";
const password = "DevPassword123!";
const businessName = "Dev Business";

try {
  // Check whether the development owner already exists.
  const existingUser = await pool.query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (existingUser.rows.length > 0) {
    console.log(`Dev owner already exists: ${email}`);
  } else {
    // Create a business only when the owner doesn't exist.
    const businessResult = await pool.query<{ id: string }>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING id
      `,
      [businessName],
    );

    const business = businessResult.rows[0];

    if (!business) {
      throw new Error("Failed to create development business.");
    }

    const passwordHash = await hashPassword(password);

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
        business.id,
        "Dev Owner",
        email,
        passwordHash,
        "owner",
        true,
      ],
    );

    console.log("Dev owner created.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Business ID: ${business.id}`);
  }
} catch (error) {
  console.error("Owner seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
