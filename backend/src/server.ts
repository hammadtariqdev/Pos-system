import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./database/index.js";

async function startServer() {
  try {
    // Verify database connectivity before starting Express.
    await pool.query("SELECT 1");

    console.log("Database connection established successfully.");

    // Start the API only after the database is available.
    app.listen(env.PORT, () => {
      console.log(
        `Sitara Bills API running in ${env.NODE_ENV} mode on port ${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start Sitara Bills API.");
    console.error("Database connection is unavailable.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    await pool.end();
    process.exit(1);
  }
}

startServer();