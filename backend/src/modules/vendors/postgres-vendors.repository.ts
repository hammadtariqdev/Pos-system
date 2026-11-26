import { pool } from "../../database/index.ts";

import type {
  VendorRepository,
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
} from "./vendors.repository.ts";

import type { Vendor } from "./vendors.types.ts";

export class PostgresVendorRepository implements VendorRepository {
  async create(tenantId: string, input: CreateVendorInput): Promise<Vendor> {
    const result = await pool.query(
      `
      WITH inserted AS (
        INSERT INTO vendors (
          tenant_id,
          category_id,
          name,
          phone,
          email,
          address
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      )
      SELECT
        inserted.id,
        inserted.category_id AS "categoryId",
        categories.name AS "categoryName",
        inserted.name,
        inserted.phone,
        inserted.email,
        inserted.address,
        inserted.created_at AS "createdAt",
        inserted.updated_at AS "updatedAt"
      FROM inserted
      INNER JOIN categories
        ON categories.tenant_id = inserted.tenant_id
        AND categories.id = inserted.category_id
      `,
      [
        tenantId,
        input.categoryId,
        input.name,
        input.phone ?? null,
        input.email ?? null,
        input.address ?? null,
      ],
    );

    return result.rows[0] as Vendor;
  }

  async findById(tenantId: string, id: string): Promise<Vendor | null> {
    const result = await pool.query(
      `
      SELECT
        vendors.id,
        vendors.category_id AS "categoryId",
        categories.name AS "categoryName",
        vendors.name,
        vendors.phone,
        vendors.email,
        vendors.address,
        vendors.created_at AS "createdAt",
        vendors.updated_at AS "updatedAt"
      FROM vendors
      INNER JOIN categories
        ON categories.tenant_id = vendors.tenant_id
        AND categories.id = vendors.category_id
      WHERE vendors.tenant_id = $1
        AND vendors.id = $2
      `,
      [tenantId, id],
    );

    return (result.rows[0] as Vendor | undefined) ?? null;
  }

  async findAll(
    tenantId: string,
    filters: VendorFilters = {},
  ): Promise<Vendor[]> {
    const result = await pool.query(
      `
      SELECT
        vendors.id,
        vendors.category_id AS "categoryId",
        categories.name AS "categoryName",
        vendors.name,
        vendors.phone,
        vendors.email,
        vendors.address,
        vendors.created_at AS "createdAt",
        vendors.updated_at AS "updatedAt"
      FROM vendors
      INNER JOIN categories
        ON categories.tenant_id = vendors.tenant_id
        AND categories.id = vendors.category_id
      WHERE vendors.tenant_id = $1
        AND (
          $2::uuid IS NULL
          OR vendors.category_id = $2
        )
        AND (
          $3::text IS NULL
          OR vendors.name ILIKE '%' || $3 || '%'
        )
      ORDER BY vendors.name ASC
      `,
      [tenantId, filters.categoryId ?? null, filters.search ?? null],
    );

    return result.rows as Vendor[];
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateVendorInput,
  ): Promise<Vendor | null> {
    const result = await pool.query(
      `
      WITH updated AS (
        UPDATE vendors
        SET
          category_id = COALESCE($3, category_id),
          name = COALESCE($4, name),
          phone = CASE
            WHEN $5::boolean THEN $6
            ELSE phone
          END,
          email = CASE
            WHEN $7::boolean THEN $8
            ELSE email
          END,
          address = CASE
            WHEN $9::boolean THEN $10
            ELSE address
          END,
          updated_at = NOW()
        WHERE tenant_id = $1
          AND id = $2
        RETURNING *
      )
      SELECT
        updated.id,
        updated.category_id AS "categoryId",
        categories.name AS "categoryName",
        updated.name,
        updated.phone,
        updated.email,
        updated.address,
        updated.created_at AS "createdAt",
        updated.updated_at AS "updatedAt"
      FROM updated
      INNER JOIN categories
        ON categories.tenant_id = updated.tenant_id
        AND categories.id = updated.category_id
      `,
      [
        tenantId,
        id,
        input.categoryId ?? null,
        input.name ?? null,
        input.phone !== undefined,
        input.phone ?? null,
        input.email !== undefined,
        input.email ?? null,
        input.address !== undefined,
        input.address ?? null,
      ],
    );

    return (result.rows[0] as Vendor | undefined) ?? null;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM vendors
      WHERE tenant_id = $1
        AND id = $2
      RETURNING id
      `,
      [tenantId, id],
    );

    return result.rowCount !== null && result.rowCount > 0;
  }
}
