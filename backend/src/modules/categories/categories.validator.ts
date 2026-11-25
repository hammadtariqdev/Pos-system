
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const categoryIdSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const setCategoryActiveSchema = z.object({
  isActive: z.boolean(),
}).strict();
