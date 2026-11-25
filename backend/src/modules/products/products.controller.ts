import type { Response } from "express";
import { productService } from "./products.dependencies.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";
import {
  createProductSchema,
  productIdSchema,
  setProductActiveSchema,
  updateProductSchema,
} from "./products.validator.ts";

function getTenantId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new Error("Authenticated user is required");
  }

  return req.user.tenantId;
}

export async function createProduct(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const input = createProductSchema.parse(req.body);

  const product = await productService.create(
    getTenantId(req),
    input,
  );

  res.status(201).json(product);
}

export async function getProductById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = productIdSchema.parse(req.params);

  const product = await productService.findById(
    getTenantId(req),
    id,
  );

  if (!product) {
    res.status(404).json({
      message: "Product not found",
    });
    return;
  }

  res.status(200).json(product);
}

export async function listProducts(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const products = await productService.findAll(
    getTenantId(req),
  );

  res.status(200).json(products);
}

export async function updateProduct(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = productIdSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body);

  const product = await productService.update(
    getTenantId(req),
    id,
    input,
  );

  if (!product) {
    res.status(404).json({
      message: "Product not found",
    });
    return;
  }

  res.status(200).json(product);
}

export async function setProductActive(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = productIdSchema.parse(req.params);
  const { isActive } = setProductActiveSchema.parse(req.body);

  const product = await productService.setActive(
    getTenantId(req),
    id,
    isActive,
  );

  if (!product) {
    res.status(404).json({
      message: "Product not found",
    });
    return;
  }

  res.status(200).json(product);
}