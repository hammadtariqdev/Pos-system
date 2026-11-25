
import type { Category } from "./categories.types.ts";

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
}

export interface CategoryRepository {
  create(
    tenantId: string,
    input: CreateCategoryInput,
  ): Promise<Category>;

  findById(
    tenantId: string,
    id: string,
  ): Promise<Category | null>;

  findAll(
    tenantId: string,
  ): Promise<Category[]>;

  update(
    tenantId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category | null>;

  setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Category | null>;
}
