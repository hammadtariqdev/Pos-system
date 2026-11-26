import authRoutes from "./modules/auth/auth.routes.ts";
import express from "express";
import errorHandler from "./middlewares/error-handler";
import notFound from "./middlewares/not-found";
import businessRoutes from "./modules/business/business.routes.ts";
import { sendSuccess } from "./utils/api-response.js";
import productRoutes from "./modules/products/products.routes.ts";
import categoryRoutes from "./modules/categories/categories.routes.ts";
import vendorRoutes from "./modules/vendors/vendors.routes.ts";
// express app instance
const app = express();

// Middleware
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  return sendSuccess(res, {
    message: "Sitara Bills API is running",
    data: {
      uptime: process.uptime(),
    },
  });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
