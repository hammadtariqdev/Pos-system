import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { createSaleSchema } from "./sales.validator";
import type { SalesService } from "./sales.service";

export class SalesController {
  constructor(private readonly service: SalesService) {}

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const parsed = createSaleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid sale data",
        errors: parsed.error.flatten(),
      });
      return;
    }

    try {
      const sale = await this.service.createSale(tenantId, userId, parsed.data);

      res.status(201).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create sale",
      });
    }
  }

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const sales = await this.service.listSales(tenantId);

    res.status(200).json({
      success: true,
      data: sales,
    });
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const saleId = req.params.saleId;

    if (typeof saleId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid sale ID",
      });
      return;
    }

    const sale = await this.service.getSale(tenantId, saleId);

    if (!sale) {
      res.status(404).json({
        success: false,
        message: "Sale not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  }
}
