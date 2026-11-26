import type {
  VendorRepository,
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
} from "./vendors.repository.ts";

import type { Vendor } from "./vendors.types.ts";

export class VendorService {
  constructor(private readonly vendorRepository: VendorRepository) {}

  async createVendor(
    tenantId: string,
    input: CreateVendorInput,
  ): Promise<Vendor> {
    return this.vendorRepository.create(tenantId, input);
  }

  async getVendorById(tenantId: string, id: string): Promise<Vendor | null> {
    return this.vendorRepository.findById(tenantId, id);
  }

  async getVendors(
    tenantId: string,
    filters?: VendorFilters,
  ): Promise<Vendor[]> {
    return this.vendorRepository.findAll(tenantId, filters);
  }

  async updateVendor(
    tenantId: string,
    id: string,
    input: UpdateVendorInput,
  ): Promise<Vendor | null> {
    return this.vendorRepository.update(tenantId, id, input);
  }

  async deleteVendor(tenantId: string, id: string): Promise<boolean> {
    return this.vendorRepository.delete(tenantId, id);
  }
}
