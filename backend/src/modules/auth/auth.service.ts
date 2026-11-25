
import AppError from "../../utils/app-error.ts";
import { hashPassword, verifyPassword } from "../../utils/password.ts";
import type { User } from "./types/auth.types.ts";
import type { UserRepository } from "./user.repository.ts";

export interface RegisterUserInput {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: User["role"];
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(
      input.email,
    );

    if (existingUser) {
      throw new AppError(
        "A user with this email already exists.",
        409,
      );
    }

    const passwordHash = await hashPassword(input.password);

    return this.userRepository.create({
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 401);
    }

    return user;
  }

  async findUserByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<User> {
    const user = await this.userRepository.findByIdAndTenant(
      id,
      tenantId,
    );

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    return user;
  }

  async login(input: LoginInput): Promise<User> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError(
        "Invalid email or password.",
        401,
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "This account is inactive.",
        403,
      );
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(
        "Invalid email or password.",
        401,
      );
    }

    return user;
  }
}
