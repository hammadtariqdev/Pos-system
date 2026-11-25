import type { Server } from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./database/index.js";

// Try the configured port, a few nearby fallbacks, then let the OS pick one.
const PORT_CANDIDATES = [env.PORT, env.PORT + 1, env.PORT + 2, 3000, 0];

function listen(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection established successfully.");

    let server: Server | undefined;

    for (const port of PORT_CANDIDATES) {
      try {
        server = await listen(port);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
        console.warn(`Port ${port} is in use, trying the next one...`);
      }
    }

    if (!server) {
      throw new Error("No available port could be found.");
    }

    const actualPort = (server.address() as { port: number }).port;
    console.log(
      `Sitara Bills API running in ${env.NODE_ENV} mode on port ${actualPort}`,
    );

    const shutdown = () => server.close(() => pool.end());
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start Sitara Bills API.");
    if (error instanceof Error) console.error(error.message);

    await pool.end();
    process.exit(1);
  }
}

startServer();
