import { z } from "zod";

export const createVendorSchema = z
  .object({
    categoryId: z.string().uuid(),
    name: z.string().trim().min(1).max(150),
    phone: z.string().trim().max(30).nullable().optional(),
    email: z.string().trim().email().max(255).nullable().optional(),
    address: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const updateVendorSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    email: z.string().trim().email().max(255).nullable().optional(),
    address: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const vendorIdSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const vendorListQuerySchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    search: z.string().trim().max(150).optional(),
  })
  .strict();
