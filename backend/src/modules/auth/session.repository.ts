import type { Session } from "./types/session.types.ts";
export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionRepository {
  countByUserId(userId: string): Promise<number>;
  create(input: CreateSessionInput): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  deleteOldestByUserId(userId: string): Promise<void>;
  updateLastActivity(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  createWithLimit(
  input: CreateSessionInput,
): Promise<Session>;
}