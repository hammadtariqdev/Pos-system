import { describe, expect, it } from "vitest";
import { AuthService } from "../../modules/auth/auth.service.ts";
import type { User } from "../../modules/auth/types/auth.types.ts";
import type {
  CreateUserInput,
  UserRepository,
} from "../../modules/auth/user.repository.ts";

function createMockRepository(): UserRepository {
  const users: User[] = [];

  return {
    async create(input: CreateUserInput): Promise<User> {
      const user: User = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.push(user);

      return user;
    },

    async findByEmail(email: string): Promise<User | null> {
      return users.find((user) => user.email === email.toLowerCase()) ?? null;
    },

    async findById(id: string): Promise<User | null> {
      return users.find((user) => user.id === id) ?? null;
    },

    async findByIdAndTenant(
      id: string,
      tenantId: string,
    ): Promise<User | null> {
      const user = users.find(
        (item) => item.id === id && item.tenantId === tenantId,
      );

      return user ?? null;
    },
  };
}

describe("AuthService", () => {
  it("registers a new user", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    const user = await service.register({
      tenantId: crypto.randomUUID(),
      name: "Test Owner",
      email: "owner@test.local",
      password: "StrongPassword123!",
      role: "owner",
    });

    expect(user.name).toBe("Test Owner");
    expect(user.email).toBe("owner@test.local");
    expect(user.role).toBe("owner");
    expect(user.passwordHash).not.toBe("StrongPassword123!");
    expect(user.passwordHash).toContain("$argon2");
  });

  it("rejects duplicate email during registration", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    const input = {
      tenantId: crypto.randomUUID(),
      name: "Test Owner",
      email: "owner@test.local",
      password: "StrongPassword123!",
      role: "owner" as const,
    };

    await service.register(input);

    await expect(service.register(input)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("logs in with correct credentials", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    await service.register({
      tenantId: crypto.randomUUID(),
      name: "Test Owner",
      email: "owner@test.local",
      password: "StrongPassword123!",
      role: "owner",
    });

    const user = await service.login({
      email: "owner@test.local",
      password: "StrongPassword123!",
    });

    expect(user.email).toBe("owner@test.local");
  });

  it("rejects an unknown email", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    await expect(
      service.login({
        email: "unknown@test.local",
        password: "StrongPassword123!",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an incorrect password", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    await service.register({
      tenantId: crypto.randomUUID(),
      name: "Test Owner",
      email: "owner@test.local",
      password: "CorrectPassword123!",
      role: "owner",
    });

    await expect(
      service.login({
        email: "owner@test.local",
        password: "WrongPassword123!",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an inactive user", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    const user = await service.register({
      tenantId: crypto.randomUUID(),
      name: "Inactive User",
      email: "inactive@test.local",
      password: "StrongPassword123!",
      role: "employee",
    });

    user.isActive = false;

    await expect(
      service.login({
        email: "inactive@test.local",
        password: "StrongPassword123!",
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("finds a user within their own tenant", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);
    const tenantId = crypto.randomUUID();

    const created = await service.register({
      tenantId,
      name: "Tenant A Owner",
      email: "tenant-a@test.local",
      password: "StrongPassword123!",
      role: "owner",
    });

    const found = await service.findUserByIdAndTenant(created.id, tenantId);

    expect(found.id).toBe(created.id);
    expect(found.tenantId).toBe(tenantId);
  });

  it("rejects access to a user from another tenant", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);

    const tenantA = crypto.randomUUID();
    const tenantB = crypto.randomUUID();

    const created = await service.register({
      tenantId: tenantA,
      name: "Tenant A Owner",
      email: "tenant-a-isolated@test.local",
      password: "StrongPassword123!",
      role: "owner",
    });

    await expect(
      service.findUserByIdAndTenant(created.id, tenantB),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects inactive users in tenant-scoped lookups", async () => {
    const repository = createMockRepository();
    const service = new AuthService(repository);
    const tenantId = crypto.randomUUID();

    const created = await service.register({
      tenantId,
      name: "Inactive Employee",
      email: "inactive-tenant@test.local",
      password: "StrongPassword123!",
      role: "employee",
    });

    created.isActive = false;

    await expect(
      service.findUserByIdAndTenant(created.id, tenantId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
