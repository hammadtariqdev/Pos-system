import { describe, expect, it } from "vitest";

import {
  categoryIdSchema,
  createCategorySchema,
  setCategoryActiveSchema,
  updateCategorySchema,
} from "../../modules/categories/categories.validator.ts";

describe("Category validators", () => {
  describe("createCategorySchema", () => {
    it("accepts valid category data", () => {
      const result = createCategorySchema.safeParse({
        name: "Electronics",
        description: "Electronic products",
      });

      expect(result.success).toBe(true);
    });

    it("trims the category name", () => {
      const result = createCategorySchema.safeParse({
        name: "  Electronics  ",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.name).toBe("Electronics");
      }
    });

    it("rejects an empty name", () => {
      const result = createCategorySchema.safeParse({
        name: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a name longer than 100 characters", () => {
      const result = createCategorySchema.safeParse({
        name: "A".repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it("accepts a null description", () => {
      const result = createCategorySchema.safeParse({
        name: "Electronics",
        description: null,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a description longer than 1000 characters", () => {
      const result = createCategorySchema.safeParse({
        name: "Electronics",
        description: "A".repeat(1001),
      });

      expect(result.success).toBe(false);
    });

    it("rejects unknown properties", () => {
      const result = createCategorySchema.safeParse({
        name: "Electronics",
        tenantId: crypto.randomUUID(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    it("accepts a name update", () => {
      const result = updateCategorySchema.safeParse({
        name: "Updated Electronics",
      });

      expect(result.success).toBe(true);
    });

    it("accepts a description update", () => {
      const result = updateCategorySchema.safeParse({
        description: "Updated description",
      });

      expect(result.success).toBe(true);
    });

    it("accepts clearing the description", () => {
      const result = updateCategorySchema.safeParse({
        description: null,
      });

      expect(result.success).toBe(true);
    });

    it("rejects an empty update", () => {
      const result = updateCategorySchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("rejects an empty category name", () => {
      const result = updateCategorySchema.safeParse({
        name: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects unknown properties", () => {
      const result = updateCategorySchema.safeParse({
        name: "Electronics",
        tenantId: crypto.randomUUID(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("categoryIdSchema", () => {
    it("accepts a valid UUID", () => {
      const result = categoryIdSchema.safeParse({
        id: crypto.randomUUID(),
      });

      expect(result.success).toBe(true);
    });

    it("rejects an invalid UUID", () => {
      const result = categoryIdSchema.safeParse({
        id: "invalid-id",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("setCategoryActiveSchema", () => {
    it("accepts true", () => {
      const result = setCategoryActiveSchema.safeParse({
        isActive: true,
      });

      expect(result.success).toBe(true);
    });

    it("accepts false", () => {
      const result = setCategoryActiveSchema.safeParse({
        isActive: false,
      });

      expect(result.success).toBe(true);
    });

    it("rejects a non-boolean value", () => {
      const result = setCategoryActiveSchema.safeParse({
        isActive: "false",
      });

      expect(result.success).toBe(false);
    });
  });
});