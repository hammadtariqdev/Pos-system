import pg from "pg";
import { env } from "../config/env.ts";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Supabase requires TLS on the pooler endpoint.
  ssl: {
    rejectUnauthorized: false,
  },

  // Keep the pool small for our API's current development workload.
  max: 5,

  // Close idle connections after 30 seconds.
  idleTimeoutMillis: 30_000,

  // Give a connection 10 seconds to establish.
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});