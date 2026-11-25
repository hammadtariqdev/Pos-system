
import AppError from "../../utils/app-error.ts";
import type { Business } from "./business.types.ts";
import type { BusinessRepository } from "./business.repository.ts";

export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
  ) {}

  async getBusiness(tenantId: string): Promise<Business> {
    const business = await this.businessRepository.findById(tenantId);

    if (!business || !business.isActive) {
      throw new AppError("Business not found or inactive.", 404);
    }

    return business;
  }

  async updateBusinessName(
    tenantId: string,
    name: string,
  ): Promise<Business> {
    const business = await this.businessRepository.findById(tenantId);

    if (!business || !business.isActive) {
      throw new AppError("Business not found or inactive.", 404);
    }

    const updatedBusiness =
      await this.businessRepository.updateName(tenantId, name);

    if (!updatedBusiness) {
      throw new AppError("Business could not be updated.", 500);
    }

    return updatedBusiness;
  }
}
