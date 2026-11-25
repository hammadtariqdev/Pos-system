import { describe, expect, it, vi } from "vitest";
import { ProductService } from "../../modules/products/products.service.ts";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from "../../modules/products/products.repository.ts";
import type { Product } from "../../modules/products/products.types.ts";

function createProductFixture(): Product {
  return {
    id: "product-1",
    name: "Test Product",
    sku: "SKU-001",
    barcode: "123456789",
    description: "Test product",
    vendorCostPrice: "100.00",
    salePrice: "150.00",
    boxSalePrice: "1400.00",
    wholesalePiecePrice: "120.00",
    wholesaleBoxPrice: "1100.00",
    wholesaleCartonPrice: "10000.00",
    oldSalePrice: "160.00",
    unit: "piece",
    piecesPerBox: 12,
    boxesPerCarton: 10,
    pieceQrCode: "QR-PIECE-001",
    boxQrCode: "QR-BOX-001",
    cartonQrCode: "QR-CARTON-001",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("ProductService", () => {
  const tenantId = "tenant-1";
  const productId = "product-1";

  it("creates a product through the repository", async () => {
    const product = createProductFixture();

    const input: CreateProductInput = {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      description: product.description,
      vendorCostPrice: product.vendorCostPrice,
      salePrice: product.salePrice,
      boxSalePrice: product.boxSalePrice,
      wholesalePiecePrice: product.wholesalePiecePrice,
      wholesaleBoxPrice: product.wholesaleBoxPrice,
      wholesaleCartonPrice: product.wholesaleCartonPrice,
      oldSalePrice: product.oldSalePrice,
      unit: product.unit,
      piecesPerBox: product.piecesPerBox,
      boxesPerCarton: product.boxesPerCarton,
      pieceQrCode: product.pieceQrCode,
      boxQrCode: product.boxQrCode,
      cartonQrCode: product.cartonQrCode,
    };

    const repository: ProductRepository = {
      create: vi.fn().mockResolvedValue(product),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      setActive: vi.fn(),
    };

    const service = new ProductService(repository);

    const result = await service.create(tenantId, input);

    expect(result).toEqual(product);
    expect(repository.create).toHaveBeenCalledWith(tenantId, input);
  });

  it("finds a product through the repository", async () => {
    const product = createProductFixture();

    const repository: ProductRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(product),
      findAll: vi.fn(),
      update: vi.fn(),
      setActive: vi.fn(),
    };

    const service = new ProductService(repository);

    const result = await service.findById(tenantId, productId);

    expect(result).toEqual(product);
    expect(repository.findById).toHaveBeenCalledWith(
      tenantId,
      productId,
    );
  });

  it("returns all products for the tenant", async () => {
    const products = [
      createProductFixture(),
      {
        ...createProductFixture(),
        id: "product-2",
        name: "Second Product",
      },
    ];

    const repository: ProductRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(products),
      update: vi.fn(),
      setActive: vi.fn(),
    };

    const service = new ProductService(repository);

    const result = await service.findAll(tenantId);

    expect(result).toEqual(products);
    expect(repository.findAll).toHaveBeenCalledWith(tenantId);
  });

  it("updates a product through the repository", async () => {
    const product = createProductFixture();

    const input: UpdateProductInput = {
      salePrice: "175.00",
      boxSalePrice: "1650.00",
    };

    const updatedProduct = {
      ...product,
      salePrice: "175.00",
      boxSalePrice: "1650.00",
    };

    const repository: ProductRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn().mockResolvedValue(updatedProduct),
      setActive: vi.fn(),
    };

    const service = new ProductService(repository);

    const result = await service.update(
      tenantId,
      productId,
      input,
    );

    expect(result).toEqual(updatedProduct);
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      productId,
      input,
    );
  });

  it("activates or deactivates a product through the repository", async () => {
    const product = {
      ...createProductFixture(),
      isActive: false,
    };

    const repository: ProductRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      setActive: vi.fn().mockResolvedValue(product),
    };

    const service = new ProductService(repository);

    const result = await service.setActive(
      tenantId,
      productId,
      false,
    );

    expect(result).toEqual(product);
    expect(repository.setActive).toHaveBeenCalledWith(
      tenantId,
      productId,
      false,
    );
  });
});