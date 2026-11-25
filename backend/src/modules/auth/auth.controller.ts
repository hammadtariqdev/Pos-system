import type { Request, Response } from "express";
import { authService, sessionService } from "./auth.dependencies.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

export async function login(req: Request, res: Response): Promise<void> {
  const user = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  const { token } = await sessionService.createSession(user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const authorization = req.headers.authorization;

  const token = authorization?.slice(7).trim();

  if (token) {
    const session = await sessionService.getValidSession(token);
    await sessionService.deleteSession(session.id);
  }

  res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully",
    },
  });
}