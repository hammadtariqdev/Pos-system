import { PostgresCategoryRepository } from "./postgres-categories.repository.ts";
import { CategoryService } from "./categories.service.ts";

const categoryRepository = new PostgresCategoryRepository();

export const categoryService = new CategoryService(
  categoryRepository,
);