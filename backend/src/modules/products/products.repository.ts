
import type { Product } from "./products.types.ts";

export interface CreateProductInput {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;

  // Pricing
  vendorCostPrice: string;
  salePrice: string;
  boxSalePrice?: string | null;
  wholesalePiecePrice?: string | null;
  wholesaleBoxPrice?: string | null;
  wholesaleCartonPrice?: string | null;
  oldSalePrice?: string | null;

  // Packaging
  unit: string;
  piecesPerBox?: number | null;
  boxesPerCarton?: number | null;

  // QR identifiers
  pieceQrCode?: string | null;
  boxQrCode?: string | null;
  cartonQrCode?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;

  // Pricing
  vendorCostPrice?: string;
  salePrice?: string;
  boxSalePrice?: string | null;
  wholesalePiecePrice?: string | null;
  wholesaleBoxPrice?: string | null;
  wholesaleCartonPrice?: string | null;
  oldSalePrice?: string | null;

  // Packaging
  unit?: string;
  piecesPerBox?: number | null;
  boxesPerCarton?: number | null;

  // QR identifiers
  pieceQrCode?: string | null;
  boxQrCode?: string | null;
  cartonQrCode?: string | null;
}

export interface ProductRepository {
  create(tenantId: string, input: CreateProductInput): Promise<Product>;

  findById(tenantId: string, id: string): Promise<Product | null>;

  findAll(tenantId: string): Promise<Product[]>;

  update(
    tenantId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product | null>;

  setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Product | null>;
}
