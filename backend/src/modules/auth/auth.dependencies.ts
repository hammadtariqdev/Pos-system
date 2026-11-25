import { AuthService } from "./auth.service.ts";
import { PostgresUserRepository } from "./postgres-user.repository.ts";
import { SessionService } from "./session.service.ts";
import { PostgresSessionRepository } from "./postgres-session.repository.ts";

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();

export const authService = new AuthService(userRepository);
export const sessionService = new SessionService(sessionRepository);