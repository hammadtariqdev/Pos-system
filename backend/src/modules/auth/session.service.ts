import { randomBytes, createHash } from "node:crypto";
import type { Session } from "./types/session.types.ts";
import type { SessionRepository } from "./session.repository.ts";
import AppError from "../../utils/app-error.ts";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async createSession(
    userId: string,
  ): Promise<{
    session: Session;
    token: string;
  }> {
    const token = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_MS,
    );

    const session =
      await this.sessionRepository.createWithLimit({
        userId,
        tokenHash,
        expiresAt,
      });

    return {
      session,
      token,
    };
  }

  async getValidSession(
    token: string,
  ): Promise<Session> {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const session =
      await this.sessionRepository.findByTokenHash(
        tokenHash,
      );

    if (!session) {
      throw new AppError("Invalid session.", 401);
    }

    const now = Date.now();

    if (
      session.expiresAt.getTime() <= now
    ) {
      await this.sessionRepository.delete(
        session.id,
      );

      throw new AppError("Session expired.", 401);
    }

    if (
      session.lastActivityAt.getTime() <=
      now - IDLE_TIMEOUT_MS
    ) {
      await this.sessionRepository.delete(
        session.id,
      );

      throw new AppError("Session expired.", 401);
    }

    return session;
  }

  async touchSession(
    sessionId: string,
  ): Promise<void> {
    await this.sessionRepository.updateLastActivity(
      sessionId,
    );
  }

  async deleteSession(
    sessionId: string,
  ): Promise<void> {
    await this.sessionRepository.delete(
      sessionId,
    );
  }
}