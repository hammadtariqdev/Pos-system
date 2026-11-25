import { z } from "zod";

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid amount")
  .refine((value) => Number(value) >= 0, {
    message: "Price must be greater than or equal to 0",
  });

const nullablePriceSchema = priceSchema.nullable().optional();

const positiveIntegerSchema = z
  .number()
  .int("Must be a whole number")
  .positive("Must be greater than 0")
  .nullable()
  .optional();

const optionalTextSchema = z.string().trim().max(100).nullable().optional();

export const createProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(150, "Product name must not exceed 150 characters"),

    sku: optionalTextSchema,

    barcode: optionalTextSchema,

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    vendorCostPrice: priceSchema,

    salePrice: priceSchema,

    boxSalePrice: nullablePriceSchema,

    wholesalePiecePrice: nullablePriceSchema,

    wholesaleBoxPrice: nullablePriceSchema,

    wholesaleCartonPrice: nullablePriceSchema,

    oldSalePrice: nullablePriceSchema,

    unit: z
      .string()
      .trim()
      .min(1, "Unit is required")
      .max(30, "Unit must not exceed 30 characters"),

    piecesPerBox: positiveIntegerSchema,

    boxesPerCarton: positiveIntegerSchema,

    pieceQrCode: optionalTextSchema,

    boxQrCode: optionalTextSchema,

    cartonQrCode: optionalTextSchema,
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name cannot be empty")
      .max(150, "Product name must not exceed 150 characters")
      .optional(),

    sku: optionalTextSchema,

    barcode: optionalTextSchema,

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    vendorCostPrice: priceSchema.optional(),

    salePrice: priceSchema.optional(),

    boxSalePrice: nullablePriceSchema,

    wholesalePiecePrice: nullablePriceSchema,

    wholesaleBoxPrice: nullablePriceSchema,

    wholesaleCartonPrice: nullablePriceSchema,

    oldSalePrice: nullablePriceSchema,

    unit: z
      .string()
      .trim()
      .min(1, "Unit cannot be empty")
      .max(30, "Unit must not exceed 30 characters")
      .optional(),

    piecesPerBox: positiveIntegerSchema,

    boxesPerCarton: positiveIntegerSchema,

    pieceQrCode: optionalTextSchema,

    boxQrCode: optionalTextSchema,

    cartonQrCode: optionalTextSchema,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update",
  );

export const productIdSchema = z.object({
  id: z.uuid(),
});

export const setProductActiveSchema = z.object({
  isActive: z.boolean(),
});
