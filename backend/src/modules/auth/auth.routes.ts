import { Router } from "express";
import { login, logout } from "./auth.controller.ts";
import validate from "../../middlewares/validate.ts";
import { loginSchema } from "./auth.validator.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { getMe } from "./user.controller.ts";
const router = Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
export default router;
