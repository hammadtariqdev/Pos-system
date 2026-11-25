import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import { categoryController } from "./categories.controller.ts";

const router = Router();

router.get("/", authenticate, (req, res, next) => {
  categoryController.getCategories(req, res).catch(next);
});

router.get("/:id", authenticate, (req, res, next) => {
  categoryController.getCategoryById(req, res).catch(next);
});

router.post("/", authenticate, authorize("owner"), (req, res, next) => {
  categoryController.createCategory(req, res).catch(next);
});

router.patch("/:id", authenticate, authorize("owner"), (req, res, next) => {
  categoryController.updateCategory(req, res).catch(next);
});

router.patch(
  "/:id/active",
  authenticate,
  authorize("owner"),
  (req, res, next) => {
    categoryController.setCategoryActive(req, res).catch(next);
  },
);

export default router;
