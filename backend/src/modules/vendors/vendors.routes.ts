import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.ts";
import { authorize } from "../../middlewares/authorize.middleware.ts";

import { vendorController } from "./vendors.controller.ts";

const router = Router();

router.get("/", authenticate, (req, res, next) => {
  vendorController.getVendors(req, res).catch(next);
});

router.get("/:id", authenticate, (req, res, next) => {
  vendorController.getVendorById(req, res).catch(next);
});

router.post("/", authenticate, authorize("owner"), (req, res, next) => {
  vendorController.createVendor(req, res).catch(next);
});

router.patch("/:id", authenticate, authorize("owner"), (req, res, next) => {
  vendorController.updateVendor(req, res).catch(next);
});

router.delete("/:id", authenticate, authorize("owner"), (req, res, next) => {
  vendorController.deleteVendor(req, res).catch(next);
});

export default router;
