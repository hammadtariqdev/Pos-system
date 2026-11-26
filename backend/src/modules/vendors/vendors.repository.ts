import type { Vendor } from "./vendors.types.ts";

export interface CreateVendorInput {
  categoryId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateVendorInput {
  categoryId?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface VendorFilters {
  categoryId?: string;
  search?: string;
}

export interface VendorRepository {
  create(tenantId: string, input: CreateVendorInput): Promise<Vendor>;

  findById(tenantId: string, id: string): Promise<Vendor | null>;

  findAll(tenantId: string, filters?: VendorFilters): Promise<Vendor[]>;

  update(
    tenantId: string,
    id: string,
    input: UpdateVendorInput,
  ): Promise<Vendor | null>;

  delete(tenantId: string, id: string): Promise<boolean>;
}
