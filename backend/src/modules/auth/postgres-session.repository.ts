import { pool } from "../../database/index.ts";
import type { Session } from "./types/session.types.ts";
import type {
  CreateSessionInput,
  SessionRepository,
} from "./session.repository.ts";

type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  last_activity_at: Date;
  created_at: Date;
};

const MAX_ACTIVE_SESSIONS = 4;

const ACTIVE_SESSION_CONDITION = `
  expires_at > NOW()
  AND last_activity_at > NOW() - INTERVAL '10 minutes'
`;

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  };
}

export class PostgresSessionRepository implements SessionRepository {
  async create(input: CreateSessionInput): Promise<Session> {
    const result = await pool.query<SessionRow>(
      `
        INSERT INTO sessions (
          user_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          user_id,
          token_hash,
          expires_at,
          last_activity_at,
          created_at
      `,
      [input.userId, input.tokenHash, input.expiresAt],
    );

    return mapSession(result.rows[0]!);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const result = await pool.query<SessionRow>(
      `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          last_activity_at,
          created_at
        FROM sessions
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapSession(result.rows[0]!);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM sessions
        WHERE user_id = $1
          AND ${ACTIVE_SESSION_CONDITION}
      `,
      [userId],
    );

    return Number(result.rows[0]!.count);
  }

  async updateLastActivity(id: string): Promise<void> {
    await pool.query(
      `
        UPDATE sessions
        SET last_activity_at = NOW()
        WHERE id = $1
      `,
      [id],
    );
  }

  async createWithLimit(input: CreateSessionInput): Promise<Session> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Serialize session creation for this particular user.
      const userResult = await client.query<{ id: string }>(
        `
          SELECT id
          FROM users
          WHERE id = $1
          FOR UPDATE
        `,
        [input.userId],
      );

      if (userResult.rows.length === 0) {
        throw new Error("Cannot create a session for a nonexistent user.");
      }

      // Remove the oldest active sessions until there is room.
      while (true) {
        const countResult = await client.query<{ count: string }>(
          `
            SELECT COUNT(*)::text AS count
            FROM sessions
            WHERE user_id = $1
              AND ${ACTIVE_SESSION_CONDITION}
          `,
          [input.userId],
        );

        const activeCount = Number(countResult.rows[0]!.count);

        if (activeCount < MAX_ACTIVE_SESSIONS) {
          break;
        }

        await client.query(
          `
            DELETE FROM sessions
            WHERE id = (
              SELECT id
              FROM sessions
              WHERE user_id = $1
                AND ${ACTIVE_SESSION_CONDITION}
              ORDER BY created_at ASC, id ASC
              LIMIT 1
            )
          `,
          [input.userId],
        );
      }

      const result = await client.query<SessionRow>(
        `
          INSERT INTO sessions (
            user_id,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            user_id,
            token_hash,
            expires_at,
            last_activity_at,
            created_at
        `,
        [input.userId, input.tokenHash, input.expiresAt],
      );

      await client.query("COMMIT");

      return mapSession(result.rows[0]!);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteOldestByUserId(userId: string): Promise<void> {
    await pool.query(
      `
        DELETE FROM sessions
        WHERE id = (
          SELECT id
          FROM sessions
          WHERE user_id = $1
            AND ${ACTIVE_SESSION_CONDITION}
          ORDER BY created_at ASC, id ASC
          LIMIT 1
        )
      `,
      [userId],
    );
  }

  async delete(id: string): Promise<void> {
    await pool.query(
      `
        DELETE FROM sessions
        WHERE id = $1
      `,
      [id],
    );
  }
}
