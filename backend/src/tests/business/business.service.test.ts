
import { describe, expect, it } from "vitest";
import { BusinessService } from "../../modules/business/business.service.ts";
import type { Business } from "../../modules/business/business.types.ts";
import type { BusinessRepository } from "../../modules/business/business.repository.ts";

function createMockRepository(): BusinessRepository {
  let business: Business | null = {
    id: "business-1",
    name: "Test Business",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    async create() {
      throw new Error("Not implemented");
    },

    async findById(id: string): Promise<Business | null> {
      return business?.id === id ? business : null;
    },

    async updateName(
      id: string,
      name: string,
    ): Promise<Business | null> {
      if (!business || business.id !== id) {
        return null;
      }

      business = {
        ...business,
        name,
        updatedAt: new Date(),
      };

      return business;
    },
  };
}

describe("BusinessService", () => {
  it("retrieves an active business", async () => {
    const service = new BusinessService(createMockRepository());

    const business = await service.getBusiness("business-1");

    expect(business.id).toBe("business-1");
    expect(business.name).toBe("Test Business");
  });

  it("rejects a nonexistent business", async () => {
    const service = new BusinessService(createMockRepository());

    await expect(
      service.getBusiness("unknown-business"),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects an inactive business", async () => {
    const repository = createMockRepository();

    const business = await repository.findById("business-1");
    expect(business).not.toBeNull();

    if (business) {
      business.isActive = false;
    }

    const service = new BusinessService(repository);

    await expect(
      service.getBusiness("business-1"),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("updates a business name", async () => {
    const service = new BusinessService(createMockRepository());

    const updated = await service.updateBusinessName(
      "business-1",
      "Updated Business",
    );

    expect(updated.name).toBe("Updated Business");
  });
});
