
import type { User } from "./types/auth.types.ts";

export interface CreateUserInput {
  tenantId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: User["role"];
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;

  findByEmail(email: string): Promise<User | null>;

  findById(id: string): Promise<User | null>;

  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<User | null>;
}
