import { PostgresProductRepository } from "./postgres-products.repository.ts";
import { ProductService } from "./products.service.ts";

const productRepository = new PostgresProductRepository();

export const productService = new ProductService(productRepository);