import type { Business } from "./business.types.ts";

export interface CreateBusinessInput {
  name: string;
}

export interface BusinessRepository {
  create(input: CreateBusinessInput): Promise<Business>;

  findById(id: string): Promise<Business | null>;

  updateName(
    id: string,
    name: string,
  ): Promise<Business | null>;
}