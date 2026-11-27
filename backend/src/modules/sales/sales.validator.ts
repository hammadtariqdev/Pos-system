import { z } from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
});

export const createSaleSchema = z.object({
  billNumber: z.string().trim().min(1).max(50),

  customerName: z.string().trim().max(150).optional(),

  customerPhone: z.string().trim().max(30).optional(),

  discount: z.number().nonnegative().default(0),

  paidAmount: z.number().nonnegative().default(0),

  paymentMethod: z.enum(["cash", "credit", "partial"]).default("cash"),

  items: z.array(createSaleItemSchema).min(1),
});
