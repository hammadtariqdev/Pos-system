import { describe, expect, it } from "vitest";

import {
  createVendorSchema,
  updateVendorSchema,
  vendorIdSchema,
  vendorListQuerySchema,
} from "../../modules/vendors/vendors.validator.ts";

describe("Vendor validators", () => {
  describe("createVendorSchema", () => {
    it("accepts valid vendor data", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "ABC Suppliers",
        phone: "03001234567",
        email: "abc@example.com",
        address: "Karachi, Pakistan",
      });

      expect(result.success).toBe(true);
    });

    it("accepts a vendor without optional contact details", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "ABC Suppliers",
      });

      expect(result.success).toBe(true);
    });

    it("rejects a missing category id", () => {
      const result = createVendorSchema.safeParse({
        name: "ABC Suppliers",
      });

      expect(result.success).toBe(false);
    });

    it("rejects an invalid category UUID", () => {
      const result = createVendorSchema.safeParse({
        categoryId: "invalid-id",
        name: "ABC Suppliers",
      });

      expect(result.success).toBe(false);
    });

    it("rejects a blank vendor name", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "   ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects an invalid email address", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "ABC Suppliers",
        email: "not-an-email",
      });

      expect(result.success).toBe(false);
    });

    it("accepts null contact details", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "ABC Suppliers",
        phone: null,
        email: null,
        address: null,
      });

      expect(result.success).toBe(true);
    });

    it("rejects unknown fields", () => {
      const result = createVendorSchema.safeParse({
        categoryId: crypto.randomUUID(),
        name: "ABC Suppliers",
        isActive: true,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateVendorSchema", () => {
    it("accepts a partial update", () => {
      const result = updateVendorSchema.safeParse({
        name: "Updated Suppliers",
      });

      expect(result.success).toBe(true);
    });

    it("accepts clearing optional contact details", () => {
      const result = updateVendorSchema.safeParse({
        phone: null,
        email: null,
        address: null,
      });

      expect(result.success).toBe(true);
    });

    it("rejects an empty update", () => {
      const result = updateVendorSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("rejects an invalid email in an update", () => {
      const result = updateVendorSchema.safeParse({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
    });

    it("rejects unknown update fields", () => {
      const result = updateVendorSchema.safeParse({
        name: "Updated Suppliers",
        isActive: false,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("vendorIdSchema", () => {
    it("accepts a valid vendor UUID", () => {
      const result = vendorIdSchema.safeParse({
        id: crypto.randomUUID(),
      });

      expect(result.success).toBe(true);
    });

    it("rejects an invalid vendor UUID", () => {
      const result = vendorIdSchema.safeParse({
        id: "invalid-id",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("vendorListQuerySchema", () => {
    it("accepts valid search and category filters", () => {
      const result = vendorListQuerySchema.safeParse({
        search: "ABC",
        categoryId: crypto.randomUUID(),
      });

      expect(result.success).toBe(true);
    });

    it("accepts an empty query", () => {
      const result = vendorListQuerySchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("rejects an invalid category UUID", () => {
      const result = vendorListQuerySchema.safeParse({
        categoryId: "invalid-id",
      });

      expect(result.success).toBe(false);
    });

    it("rejects unknown query fields", () => {
      const result = vendorListQuerySchema.safeParse({
        search: "ABC",
        page: "1",
      });

      expect(result.success).toBe(false);
    });
  });
});