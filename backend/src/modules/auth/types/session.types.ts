export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}