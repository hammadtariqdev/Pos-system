import { BusinessService } from "./business.service.ts";
import { PostgresBusinessRepository } from "./postgres-business.repository.ts";

const businessRepository = new PostgresBusinessRepository();

export const businessService = new BusinessService(
  businessRepository,
);