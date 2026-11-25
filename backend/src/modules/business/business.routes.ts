import { Router } from "express";
import {
  getBusiness,
  updateBusinessName,
} from "./business.controller.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";
import validate from "../../middlewares/validate.ts";
import { updateBusinessSchema } from "./business.validator.ts";

const router = Router();

router.get("/", authenticate, getBusiness);

router.patch(
  "/",
  authenticate,
  authorize("owner"),
  validate(updateBusinessSchema),
  updateBusinessName,
);

export default router;