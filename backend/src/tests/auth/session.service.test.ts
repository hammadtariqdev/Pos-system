import { describe, expect, it } from "vitest";
import { SessionService } from "../../modules/auth/session.service.ts";
import type {
  CreateSessionInput,
  SessionRepository,
} from "../../modules/auth/session.repository.ts";
import type { Session } from "../../modules/auth/types/session.types.ts";

function createMockRepository(): SessionRepository {
  const sessions: Session[] = [];

  const createSession = async (input: CreateSessionInput): Promise<Session> => {
    const session: Session = {
      id: crypto.randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      lastActivityAt: new Date(),
      createdAt: new Date(),
    };

    sessions.push(session);

    return session;
  };

  return {
    create: createSession,

    async createWithLimit(input: CreateSessionInput): Promise<Session> {
      const userSessions = sessions.filter(
        (session) => session.userId === input.userId,
      );

      if (userSessions.length >= 4) {
        const oldest = userSessions[0];

        if (oldest) {
          const index = sessions.indexOf(oldest);

          sessions.splice(index, 1);
        }
      }

      return createSession(input);
    },

    async findByTokenHash(tokenHash: string): Promise<Session | null> {
      return (
        sessions.find((session) => session.tokenHash === tokenHash) ?? null
      );
    },

    async updateLastActivity(id: string): Promise<void> {
      const session = sessions.find((session) => session.id === id);

      if (session) {
        session.lastActivityAt = new Date();
      }
    },

    async delete(id: string): Promise<void> {
      const index = sessions.findIndex((session) => session.id === id);

      if (index !== -1) {
        sessions.splice(index, 1);
      }
    },

    async countByUserId(userId: string): Promise<number> {
      return sessions.filter((session) => session.userId === userId).length;
    },

    async deleteOldestByUserId(userId: string): Promise<void> {
      const oldest = sessions
        .filter((session) => session.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (oldest) {
        sessions.splice(sessions.indexOf(oldest), 1);
      }
    },
  };
}

describe("SessionService", () => {
  it("creates a session and returns the raw token", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const result = await service.createSession(crypto.randomUUID());

    expect(result.token).toBeDefined();
    expect(result.token.length).toBe(64);

    expect(result.session.id).toBeDefined();
    expect(result.session.userId).toBeDefined();

    expect(result.session.tokenHash).not.toBe(result.token);
  });

  it("retrieves a valid session", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const created = await service.createSession(crypto.randomUUID());

    const found = await service.getValidSession(created.token);

    expect(found.id).toBe(created.session.id);
  });

  it("rejects an invalid token", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    await expect(
      service.getValidSession("invalid-token"),
    ).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an expired session", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const created = await service.createSession(crypto.randomUUID());

    created.session.expiresAt = new Date(Date.now() - 1);

    await expect(service.getValidSession(created.token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("rejects an idle session", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const created = await service.createSession(crypto.randomUUID());

    created.session.lastActivityAt = new Date(Date.now() - 10 * 60 * 1000 - 1);

    await expect(service.getValidSession(created.token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("touches a session", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const created = await service.createSession(crypto.randomUUID());

    const before = created.session.lastActivityAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    await service.touchSession(created.session.id);

    expect(created.session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it("deletes a session", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);

    const created = await service.createSession(crypto.randomUUID());

    await service.deleteSession(created.session.id);

    await expect(service.getValidSession(created.token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("does not delete a session when fewer than four exist", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);
    const userId = crypto.randomUUID();

    await service.createSession(userId);
    await service.createSession(userId);
    await service.createSession(userId);

    const fourth = await service.createSession(userId);

    const found = await service.getValidSession(fourth.token);

    expect(found.userId).toBe(userId);
  });

  it("deletes the oldest session when the user already has four sessions", async () => {
    const repository = createMockRepository();
    const service = new SessionService(repository);
    const userId = crypto.randomUUID();

    const sessions = [];

    for (let i = 0; i < 4; i++) {
      sessions.push(await service.createSession(userId));
    }

    const fifth = await service.createSession(userId);

    await expect(
      service.getValidSession(sessions[0]!.token),
    ).rejects.toMatchObject({
      statusCode: 401,
    });

    for (let i = 1; i < 4; i++) {
      await expect(
        service.getValidSession(sessions[i]!.token),
      ).resolves.toBeDefined();
    }

    await expect(service.getValidSession(fifth.token)).resolves.toBeDefined();
  });
});
