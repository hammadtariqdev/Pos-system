
import { pool } from "../../database/index.ts";
import type {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.repository.ts";
import type { Category } from "./categories.types.ts";

export class PostgresCategoryRepository implements CategoryRepository {
  async create(
    tenantId: string,
    input: CreateCategoryInput,
  ): Promise<Category> {
    const result = await pool.query(
      `
      INSERT INTO categories (
        tenant_id,
        name,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        description,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        tenantId,
        input.name,
        input.description ?? null,
      ],
    );

    return result.rows[0] as Category;
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<Category | null> {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM categories
      WHERE tenant_id = $1
        AND id = $2
      `,
      [tenantId, id],
    );

    return (result.rows[0] as Category | undefined) ?? null;
  }

  async findAll(tenantId: string): Promise<Category[]> {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM categories
      WHERE tenant_id = $1
      ORDER BY name ASC
      `,
      [tenantId],
    );

    return result.rows as Category[];
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category | null> {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($3, name),
        description = CASE
          WHEN $4::boolean THEN $5
          ELSE description
        END,
        updated_at = NOW()
      WHERE tenant_id = $1
        AND id = $2
      RETURNING
        id,
        name,
        description,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        tenantId,
        id,
        input.name ?? null,
        input.description !== undefined,
        input.description ?? null,
      ],
    );

    return (result.rows[0] as Category | undefined) ?? null;
  }

  async setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Category | null> {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        is_active = $3,
        updated_at = NOW()
      WHERE tenant_id = $1
        AND id = $2
      RETURNING
        id,
        name,
        description,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [tenantId, id, isActive],
    );

    return (result.rows[0] as Category | undefined) ?? null;
  }
}
