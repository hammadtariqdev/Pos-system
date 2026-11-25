
import { pool } from "../../database/index.ts";
import type { Business } from "./business.types.ts";
import type {
  BusinessRepository,
  CreateBusinessInput,
} from "./business.repository.ts";

interface BusinessRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresBusinessRepository implements BusinessRepository {
  async create(input: CreateBusinessInput): Promise<Business> {
    const result = await pool.query<BusinessRow>(
      `
        INSERT INTO businesses (name)
        VALUES ($1)
        RETURNING
          id,
          name,
          is_active,
          created_at,
          updated_at
      `,
      [input.name],
    );

    return mapBusiness(result.rows[0]!);
  }

  async findById(id: string): Promise<Business | null> {
    const result = await pool.query<BusinessRow>(
      `
        SELECT
          id,
          name,
          is_active,
          created_at,
          updated_at
        FROM businesses
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapBusiness(result.rows[0]!);
  }

  async updateName(
    id: string,
    name: string,
  ): Promise<Business | null> {
    const result = await pool.query<BusinessRow>(
      `
        UPDATE businesses
        SET
          name = $2,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          name,
          is_active,
          created_at,
          updated_at
      `,
      [id, name],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapBusiness(result.rows[0]!);
  }
}
