
import express from "express";
import errorHandler from "./middlewares/error-handler";
import notFound from "./middlewares/not-found";
const app = express();
import { sendSuccess } from "./utils/api-response.js";
// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  return sendSuccess(res, {
    message: "Sitara Bills API is running",
    data: {
      uptime: process.uptime()
    }
  });
});


app.use(notFound);
app.use(errorHandler);

export default app;
