import { describe, expect, it } from "vitest";

import {
  createSaleSchema,
  createSaleItemSchema,
} from "../../modules/sales/sales.validator";

describe("Sales validators", () => {
  it("accepts a valid sale", () => {
    const result = createSaleSchema.safeParse({
      billNumber: "BILL-001",
      customerName: "Ali",
      customerPhone: "03001234567",
      discount: 100,
      paidAmount: 900,
      paymentMethod: "cash",
      items: [
        {
          productId: "550e8400-e29b-41d4-a716-446655440000",
          quantity: 2,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty items array", () => {
    const result = createSaleSchema.safeParse({
      billNumber: "BILL-001",
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = createSaleItemSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createSaleItemSchema.safeParse({
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 1,
      unitPrice: -100,
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional customer information", () => {
    const result = createSaleSchema.safeParse({
      billNumber: "BILL-002",
      items: [
        {
          productId: "550e8400-e29b-41d4-a716-446655440000",
          quantity: 1,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
