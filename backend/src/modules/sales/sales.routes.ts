import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { salesController } from "./sales.dependencies";

export const salesRouter = Router();

salesRouter.use(authenticate);

salesRouter.get("/", salesController.list.bind(salesController));

salesRouter.post("/", salesController.create.bind(salesController));

salesRouter.get("/:saleId", salesController.getById.bind(salesController));
