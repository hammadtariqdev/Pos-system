import { describe, expect, it, vi } from "vitest";

import { SalesService } from "../../modules/sales/sales.service";
import type { Sale, SalesRepository } from "../../modules/sales/sales.types";

function createRepository() {
  const createSale = vi.fn();
  const findById = vi.fn();
  const findAll = vi.fn();

  const repository = {
    createSale,
    findById,
    findAll,
  } as unknown as SalesRepository;

  return {
    repository,
    createSale,
    findById,
    findAll,
  };
}

const sale: Sale = {
  id: "sale-1",
  tenantId: "tenant-1",
  billNumber: "BILL-001",
  customerName: "Ali",
  customerPhone: "03001234567",
  subtotal: 1000,
  discount: 100,
  totalAmount: 900,
  paidAmount: 900,
  remainingAmount: 0,
  paymentMethod: "cash",
  createdBy: "user-1",
  createdAt: new Date(),
  items: [
    {
      id: "item-1",
      productId: "product-1",
      productName: "Product",
      sku: "SKU-1",
      quantity: 2,
      unitPrice: 500,
      subtotal: 1000,
    },
  ],
};

describe("SalesService", () => {
  it("creates a sale", async () => {
    const { repository, createSale } = createRepository();

    createSale.mockResolvedValue(sale);

    const service = new SalesService(repository);

    const result = await service.createSale("tenant-1", "user-1", {
      billNumber: "BILL-001",
      items: [
        {
          productId: "product-1",
          quantity: 2,
        },
      ],
    });

    expect(result).toEqual(sale);

    expect(createSale).toHaveBeenCalledWith(
      "tenant-1",
      "user-1",
      expect.objectContaining({
        billNumber: "BILL-001",
      }),
    );
  });

  it("rejects an empty sale", async () => {
    const { repository } = createRepository();

    const service = new SalesService(repository);

    await expect(
      service.createSale("tenant-1", "user-1", {
        billNumber: "BILL-001",
        items: [],
      }),
    ).rejects.toThrow("Sale must contain at least one item");
  });

  it("gets a sale", async () => {
    const { repository, findById } = createRepository();

    findById.mockResolvedValue(sale);

    const service = new SalesService(repository);

    const result = await service.getSale("tenant-1", "sale-1");

    expect(result).toEqual(sale);
  });

  it("returns null when sale does not exist", async () => {
    const { repository, findById } = createRepository();

    findById.mockResolvedValue(null);

    const service = new SalesService(repository);

    const result = await service.getSale("tenant-1", "missing");

    expect(result).toBeNull();
  });

  it("lists sales", async () => {
    const { repository, findAll } = createRepository();

    findAll.mockResolvedValue([
      {
        id: "sale-1",
        billNumber: "BILL-001",
        customerName: "Ali",
        totalAmount: 900,
        paidAmount: 900,
        remainingAmount: 0,
        paymentMethod: "cash",
        createdAt: new Date(),
      },
    ]);

    const service = new SalesService(repository);

    const result = await service.listSales("tenant-1");

    expect(result).toHaveLength(1);
    expect(findAll).toHaveBeenCalledWith("tenant-1");
  });
});
