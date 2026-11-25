
import type {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.repository.ts";

import type { Category } from "./categories.types.ts";

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async createCategory(
    tenantId: string,
    input: CreateCategoryInput,
  ): Promise<Category> {
    return this.categoryRepository.create(tenantId, input);
  }

  async getCategoryById(
    tenantId: string,
    id: string,
  ): Promise<Category | null> {
    return this.categoryRepository.findById(tenantId, id);
  }

  async getCategories(tenantId: string): Promise<Category[]> {
    return this.categoryRepository.findAll(tenantId);
  }

  async updateCategory(
    tenantId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category | null> {
    return this.categoryRepository.update(tenantId, id, input);
  }

  async setCategoryActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Category | null> {
    return this.categoryRepository.setActive(
      tenantId,
      id,
      isActive,
    );
  }
}
