import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from "./products.repository.ts";
import type { Product } from "./products.types.ts";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async create(
    tenantId: string,
    input: CreateProductInput,
  ): Promise<Product> {
    return this.repository.create(tenantId, input);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<Product | null> {
    return this.repository.findById(tenantId, id);
  }

  async findAll(tenantId: string): Promise<Product[]> {
    return this.repository.findAll(tenantId);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product | null> {
    return this.repository.update(tenantId, id, input);
  }

  async setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Product | null> {
    return this.repository.setActive(tenantId, id, isActive);
  }
}