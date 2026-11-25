import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import type { Product } from "../../modules/products/products.types.ts";
import type { ProductService } from "../../modules/products/products.service.ts";

const { mockProductService } = vi.hoisted(() => ({
  mockProductService: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    setActive: vi.fn(),
  },
}));

vi.mock("../../modules/products/products.dependencies.ts", () => ({
  productService: mockProductService,
}));

import {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  setProductActive,
} from "../../modules/products/products.controller.ts";

const productId = "11111111-1111-4111-8111-111111111111";

function createProductFixture(): Product {
  return {
    id: productId,
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

function createRequest(
  body: unknown = {},
  params: Record<string, string> = {},
): AuthenticatedRequest {
  return {
    body,
    params,
    user: {
      id: "11111111-1111-4111-8111-111111111112",
      tenantId: "11111111-1111-4111-8111-111111111113",
      name: "Test User",
      email: "test@example.com",
      role: "owner",
    },
  } as AuthenticatedRequest;
}

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(response.status).mockReturnValue(response);

  return response;
}

describe("ProductController", () => {
  it("creates a product", async () => {
    const product = createProductFixture();

    mockProductService.create = vi.fn().mockResolvedValue(product);

    const request = createRequest({
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
    });

    const response = createResponse();

    await createProduct(request, response);

    expect(mockProductService.create).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      request.body,
    );

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("returns a product by id", async () => {
    const product = createProductFixture();

    mockProductService.findById = vi.fn().mockResolvedValue(product);

    const request = createRequest({}, { id: productId });
    const response = createResponse();

    await getProductById(request, response);

    expect(mockProductService.findById).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("returns 404 when a product does not exist", async () => {
    mockProductService.findById = vi.fn().mockResolvedValue(null);

    const request = createRequest({}, { id: productId });
    const response = createResponse();

    await getProductById(request, response);

    expect(mockProductService.findById).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Product not found",
    });
  });

  it("lists products for the authenticated tenant", async () => {
    const products = [createProductFixture()];

    mockProductService.findAll = vi.fn().mockResolvedValue(products);

    const request = createRequest();
    const response = createResponse();

    await listProducts(request, response);

    expect(mockProductService.findAll).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(products);
  });

  it("updates a product", async () => {
    const product = {
      ...createProductFixture(),
      salePrice: "175.00",
    };

    mockProductService.update = vi.fn().mockResolvedValue(product);

    const request = createRequest(
      {
        salePrice: "175.00",
      },
      {
        id: productId,
      },
    );

    const response = createResponse();

    await updateProduct(request, response);

    expect(mockProductService.update).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
      {
        salePrice: "175.00",
      },
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("returns 404 when updating a nonexistent product", async () => {
    mockProductService.update = vi.fn().mockResolvedValue(null);

    const request = createRequest(
      {
        salePrice: "175.00",
      },
      {
        id: productId,
      },
    );

    const response = createResponse();

    await updateProduct(request, response);

    expect(mockProductService.update).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
      {
        salePrice: "175.00",
      },
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Product not found",
    });
  });

  it("activates or deactivates a product", async () => {
    const product = {
      ...createProductFixture(),
      isActive: false,
    };

    mockProductService.setActive = vi.fn().mockResolvedValue(product);

    const request = createRequest(
      {
        isActive: false,
      },
      {
        id: productId,
      },
    );

    const response = createResponse();

    await setProductActive(request, response);

    expect(mockProductService.setActive).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
      false,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("returns 404 when activating or deactivating a nonexistent product", async () => {
    mockProductService.setActive = vi.fn().mockResolvedValue(null);

    const request = createRequest(
      {
        isActive: false,
      },
      {
        id: productId,
      },
    );

    const response = createResponse();

    await setProductActive(request, response);

    expect(mockProductService.setActive).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111113",
      productId,
      false,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Product not found",
    });
  });
});