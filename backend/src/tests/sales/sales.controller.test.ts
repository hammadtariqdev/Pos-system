import { describe, expect, it, vi } from "vitest";

import type { Response } from "express";

import { SalesController } from "../../modules/sales/sales.controller";
import type { SalesService } from "../../modules/sales/sales.service";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  (response.status as ReturnType<typeof vi.fn>).mockReturnValue(response);

  return response;
}

function createService() {
  const createSale = vi.fn();
  const listSales = vi.fn();
  const getSale = vi.fn();

  const service = {
    createSale,
    listSales,
    getSale,
  } as unknown as SalesService;

  return {
    service,
    createSale,
    listSales,
    getSale,
  };
}

describe("SalesController", () => {
  it("creates a sale", async () => {
    const { service, createSale } = createService();

    const controller = new SalesController(service);

    createSale.mockResolvedValue({
      id: "sale-1",
      billNumber: "BILL-001",
    });

    const req = {
      body: {
        billNumber: "BILL-001",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440000",
            quantity: 1,
          },
        ],
      },
      user: {
        id: "user-1",
        tenantId: "tenant-1",
      },
    } as any;

    const res = createResponse();

    await controller.create(req, res);

    expect(createSale).toHaveBeenCalledWith(
      "tenant-1",
      "user-1",
      expect.objectContaining({
        billNumber: "BILL-001",
      }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 400 for invalid input", async () => {
    const { service } = createService();

    const controller = new SalesController(service);

    const req = {
      body: {
        billNumber: "",
        items: [],
      },
      user: {
        id: "user-1",
        tenantId: "tenant-1",
      },
    } as any;

    const res = createResponse();

    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("lists sales", async () => {
    const { service, listSales } = createService();

    listSales.mockResolvedValue([]);

    const controller = new SalesController(service);

    const req = {
      user: {
        tenantId: "tenant-1",
      },
    } as any;

    const res = createResponse();

    await controller.list(req, res);

    expect(listSales).toHaveBeenCalledWith("tenant-1");

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when sale does not exist", async () => {
    const { service, getSale } = createService();

    getSale.mockResolvedValue(null);

    const controller = new SalesController(service);

    const req = {
      params: {
        saleId: "missing",
      },
      user: {
        tenantId: "tenant-1",
      },
    } as any;

    const res = createResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
