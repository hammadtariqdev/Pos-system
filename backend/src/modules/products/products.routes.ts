import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  setProductActive,
} from "./products.controller.ts";

const router = Router();

router.use(authenticate);

router.post("/", createProduct);
router.get("/", listProducts);
router.get("/:id", getProductById);
router.patch("/:id", updateProduct);
router.patch("/:id/active", setProductActive);

export default router;