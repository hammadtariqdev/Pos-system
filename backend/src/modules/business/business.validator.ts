import { z } from "zod";

export const updateBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must contain at least 2 characters.")
    .max(150, "Business name cannot exceed 150 characters."),
}).strict();