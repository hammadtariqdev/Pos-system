import type {
  CreateSaleInput,
  Sale,
  SaleListItem,
  SalesRepository,
} from "./sales.types";

export class SalesService {
  constructor(private readonly repository: SalesRepository) {}

  async createSale(
    tenantId: string,
    userId: string,
    input: CreateSaleInput,
  ): Promise<Sale> {
    if (input.items.length === 0) {
      throw new Error("Sale must contain at least one item");
    }

    return this.repository.createSale(tenantId, userId, input);
  }

  async getSale(tenantId: string, saleId: string): Promise<Sale | null> {
    return this.repository.findById(tenantId, saleId);
  }

  async listSales(tenantId: string): Promise<SaleListItem[]> {
    return this.repository.findAll(tenantId);
  }
}
