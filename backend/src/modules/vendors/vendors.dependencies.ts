import { PostgresVendorRepository } from "./postgres-vendors.repository.ts";
import { VendorService } from "./vendors.service.ts";

const vendorRepository = new PostgresVendorRepository();

export const vendorService = new VendorService(vendorRepository);
