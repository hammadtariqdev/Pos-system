import { pool } from "../../database/index.ts";
import type { User } from "./types/auth.types.ts";
import type { CreateUserInput, UserRepository } from "./user.repository.ts";

type UserRow = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresUserRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const result = await pool.query<UserRow>(
      `
        INSERT INTO users (
          tenant_id,
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          tenant_id,
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
      `,
      [
        input.tenantId,
        input.name,
        input.email.toLowerCase(),
        input.passwordHash,
        input.role,
      ],
    );

    return mapUser(result.rows[0]!);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `
        SELECT
          id,
          tenant_id,
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapUser(result.rows[0]!);
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `
        SELECT
          id,
          tenant_id,
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapUser(result.rows[0]!);
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `
      SELECT
        id,
        tenant_id,
        name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
    `,
      [id, tenantId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapUser(result.rows[0]!);
  }
}
