import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

const { mockVendorService } = vi.hoisted(() => ({
  mockVendorService: {
    createVendor: vi.fn(),
    getVendors: vi.fn(),
    getVendorById: vi.fn(),
    updateVendor: vi.fn(),
    deleteVendor: vi.fn(),
  },
}));

vi.mock("../../modules/vendors/vendors.dependencies.ts", () => ({
  vendorService: mockVendorService,
}));

import { vendorController } from "../../modules/vendors/vendors.controller.ts";

describe("VendorController", () => {
  const tenantId = crypto.randomUUID();
  const vendorId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();

  const vendor = {
    id: vendorId,
    categoryId,
    categoryName: "Electronics",
    name: "ABC Suppliers",
    phone: "03001234567",
    email: "abc@example.com",
    address: "Karachi, Pakistan",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createRequest(data: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string>;
  } = {}): AuthenticatedRequest {
    return {
      body: data.body ?? {},
      params: data.params ?? {},
      query: data.query ?? {},
      user: {
        id: crypto.randomUUID(),
        tenantId,
        name: "Test Owner",
        email: "owner@test.local",
        role: "owner",
      },
    } as unknown as AuthenticatedRequest;
  }

  function createResponse() {
    const response = {
      status: vi.fn(),
      json: vi.fn(),
      send: vi.fn(),
    };

    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);
    response.send.mockReturnValue(response);

    return response as unknown as Response & typeof response;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a vendor", async () => {
    mockVendorService.createVendor.mockResolvedValue(vendor);

    const request = createRequest({
      body: {
        categoryId,
        name: "ABC Suppliers",
      },
    });
    const response = createResponse();

    await vendorController.createVendor(request, response);

    expect(mockVendorService.createVendor).toHaveBeenCalledWith(
      tenantId,
      {
        categoryId,
        name: "ABC Suppliers",
      },
    );
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ data: vendor });
  });

  it("rejects invalid vendor creation data", async () => {
    const request = createRequest({
      body: {
        categoryId: "invalid-id",
        name: "",
      },
    });
    const response = createResponse();

    await vendorController.createVendor(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(mockVendorService.createVendor).not.toHaveBeenCalled();
  });

  it("lists vendors using the supplied filters", async () => {
    mockVendorService.getVendors.mockResolvedValue([vendor]);

    const request = createRequest({
      query: {
        search: "ABC",
        categoryId,
      },
    });
    const response = createResponse();

    await vendorController.getVendors(request, response);

    expect(mockVendorService.getVendors).toHaveBeenCalledWith(
      tenantId,
      {
        search: "ABC",
        categoryId,
      },
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ data: [vendor] });
  });

  it("retrieves a vendor by id", async () => {
    mockVendorService.getVendorById.mockResolvedValue(vendor);

    const request = createRequest({
      params: { id: vendorId },
    });
    const response = createResponse();

    await vendorController.getVendorById(request, response);

    expect(mockVendorService.getVendorById).toHaveBeenCalledWith(
      tenantId,
      vendorId,
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ data: vendor });
  });

  it("returns 404 when a vendor does not exist", async () => {
    mockVendorService.getVendorById.mockResolvedValue(null);

    const request = createRequest({
      params: { id: vendorId },
    });
    const response = createResponse();

    await vendorController.getVendorById(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Vendor not found",
    });
  });

  it("updates a vendor", async () => {
    mockVendorService.updateVendor.mockResolvedValue({
      ...vendor,
      name: "Updated Suppliers",
    });

    const request = createRequest({
      params: { id: vendorId },
      body: { name: "Updated Suppliers" },
    });
    const response = createResponse();

    await vendorController.updateVendor(request, response);

    expect(mockVendorService.updateVendor).toHaveBeenCalledWith(
      tenantId,
      vendorId,
      { name: "Updated Suppliers" },
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("returns 404 when updating a nonexistent vendor", async () => {
    mockVendorService.updateVendor.mockResolvedValue(null);

    const request = createRequest({
      params: { id: vendorId },
      body: { name: "Updated Suppliers" },
    });
    const response = createResponse();

    await vendorController.updateVendor(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("deletes a vendor", async () => {
    mockVendorService.deleteVendor.mockResolvedValue(true);

    const request = createRequest({
      params: { id: vendorId },
    });
    const response = createResponse();

    await vendorController.deleteVendor(request, response);

    expect(mockVendorService.deleteVendor).toHaveBeenCalledWith(
      tenantId,
      vendorId,
    );
    expect(response.status).toHaveBeenCalledWith(204);
  });

  it("returns 404 when deleting a nonexistent vendor", async () => {
    mockVendorService.deleteVendor.mockResolvedValue(false);

    const request = createRequest({
      params: { id: vendorId },
    });
    const response = createResponse();

    await vendorController.deleteVendor(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
  });
});