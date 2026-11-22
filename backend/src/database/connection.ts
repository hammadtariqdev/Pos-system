import pg from "pg";
import { env } from "../config/env.ts";


const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,

    // max connections in the pool

    max: 20,

    // close idle clients after 30 seconds
    idleTimeoutMillis: 30_000,

    // fail if a connection cannot be established within 2 seconds

    connectionTimeoutMillis: 5_000,

    // listen for unexpected errors on idle clients


})
pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
})