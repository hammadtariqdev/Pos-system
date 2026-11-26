import { describe, expect, it, vi } from "vitest";

import { VendorService } from "../../modules/vendors/vendors.service.ts";
import type { VendorRepository } from "../../modules/vendors/vendors.repository.ts";
import type { Vendor } from "../../modules/vendors/vendors.types.ts";

describe("VendorService", () => {
  const tenantId = crypto.randomUUID();
  const vendorId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();

  const vendor: Vendor = {
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

  function createRepository(): VendorRepository {
    return {
      create: vi.fn().mockResolvedValue(vendor),
      findById: vi.fn().mockResolvedValue(vendor),
      findAll: vi.fn().mockResolvedValue([vendor]),
      update: vi.fn().mockResolvedValue(vendor),
      delete: vi.fn().mockResolvedValue(true),
    };
  }

  it("creates a vendor", async () => {
    const repository = createRepository();
    const service = new VendorService(repository);

    const input = {
      categoryId,
      name: "ABC Suppliers",
      phone: "03001234567",
    };

    const result = await service.createVendor(tenantId, input);

    expect(repository.create).toHaveBeenCalledWith(tenantId, input);
    expect(result).toEqual(vendor);
  });

  it("retrieves a vendor by id", async () => {
    const repository = createRepository();
    const service = new VendorService(repository);

    const result = await service.getVendorById(tenantId, vendorId);

    expect(repository.findById).toHaveBeenCalledWith(tenantId, vendorId);
    expect(result).toEqual(vendor);
  });

  it("retrieves vendors using filters", async () => {
    const repository = createRepository();
    const service = new VendorService(repository);

    const filters = {
      categoryId,
      search: "ABC",
    };

    const result = await service.getVendors(tenantId, filters);

    expect(repository.findAll).toHaveBeenCalledWith(tenantId, filters);
    expect(result).toEqual([vendor]);
  });

  it("updates a vendor", async () => {
    const repository = createRepository();
    const service = new VendorService(repository);

    const input = {
      name: "Updated Suppliers",
    };

    const result = await service.updateVendor(tenantId, vendorId, input);

    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      vendorId,
      input,
    );
    expect(result).toEqual(vendor);
  });

  it("deletes a vendor", async () => {
    const repository = createRepository();
    const service = new VendorService(repository);

    const result = await service.deleteVendor(tenantId, vendorId);

    expect(repository.delete).toHaveBeenCalledWith(tenantId, vendorId);
    expect(result).toBe(true);
  });
});