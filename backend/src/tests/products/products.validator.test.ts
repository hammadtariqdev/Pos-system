import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  setProductActiveSchema,
} from "../../modules/products/products.validator.ts";

describe("Product validators", () => {
  describe("createProductSchema", () => {
    const validProduct = {
      name: "Test Product",
      vendorCostPrice: "100.00",
      salePrice: "150.00",
      unit: "piece",
    };

    it("accepts valid product data", () => {
      expect(createProductSchema.safeParse(validProduct).success).toBe(true);
    });

    it("rejects missing required fields", () => {
      expect(
        createProductSchema.safeParse({
          name: "Test Product",
        }).success,
      ).toBe(false);
    });

    it("rejects an empty product name", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          name: "   ",
        }).success,
      ).toBe(false);
    });

    it("rejects negative prices", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "-10.00",
        }).success,
      ).toBe(false);
    });

    it("rejects prices with more than two decimal places", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "10.999",
        }).success,
      ).toBe(false);
    });

    it("accepts zero prices", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "0",
        }).success,
      ).toBe(true);
    });

    it("rejects zero packaging quantities", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          piecesPerBox: 0,
        }).success,
      ).toBe(false);
    });

    it("rejects decimal packaging quantities", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          piecesPerBox: 2.5,
        }).success,
      ).toBe(false);
    });

    it("rejects unknown fields", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          unexpectedField: true,
        }).success,
      ).toBe(false);
    });
    it("accepts prices with one decimal place", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "10.5",
        }).success,
      ).toBe(true);
    });

    it("rejects prices containing letters", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "abc",
        }).success,
      ).toBe(false);
    });

    it("rejects prices containing whitespace internally", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          salePrice: "10 50",
        }).success,
      ).toBe(false);
    });

    it("accepts the maximum product name length", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          name: "A".repeat(150),
        }).success,
      ).toBe(true);
    });

    it("rejects product names exceeding the maximum length", () => {
      expect(
        createProductSchema.safeParse({
          ...validProduct,
          name: "A".repeat(151),
        }).success,
      ).toBe(false);
    });
  });

  describe("updateProductSchema", () => {
    it("accepts a valid partial update", () => {
      expect(
        updateProductSchema.safeParse({
          salePrice: "200.00",
        }).success,
      ).toBe(true);
    });

    it("accepts nullable fields being cleared", () => {
      expect(
        updateProductSchema.safeParse({
          description: null,
          boxSalePrice: null,
        }).success,
      ).toBe(true);
    });
    it("rejects an empty update", () => {
      expect(updateProductSchema.safeParse({}).success).toBe(false);
    });

    it("rejects an update containing only unknown fields", () => {
      expect(
        updateProductSchema.safeParse({
          unknownField: "value",
        }).success,
      ).toBe(false);
    });
    it("rejects negative updated prices", () => {
      expect(
        updateProductSchema.safeParse({
          salePrice: "-20.00",
        }).success,
      ).toBe(false);
    });

    it("rejects unknown fields in partial updates", () => {
      expect(
        updateProductSchema.safeParse({
          salePrice: "200.00",
          unknownField: true,
        }).success,
      ).toBe(false);
    });
  });

  describe("productIdSchema", () => {
    it("accepts a valid UUID", () => {
      expect(
        productIdSchema.safeParse({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }).success,
      ).toBe(true);
    });

    it("rejects an invalid UUID", () => {
      expect(
        productIdSchema.safeParse({
          id: "not-a-uuid",
        }).success,
      ).toBe(false);
    });
  });

  describe("setProductActiveSchema", () => {
    it("accepts a boolean value", () => {
      expect(
        setProductActiveSchema.safeParse({
          isActive: false,
        }).success,
      ).toBe(true);
    });

    it("rejects a non-boolean value", () => {
      expect(
        setProductActiveSchema.safeParse({
          isActive: "false",
        }).success,
      ).toBe(false);
    });
  });
});
