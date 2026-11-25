
import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import { authorize } from "../../middlewares/authorize.middleware.ts";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.ts";

describe("authorize middleware", () => {
  it("rejects unauthenticated requests", () => {
    const req = {} as AuthenticatedRequest;
    const next = vi.fn();

    authorize("owner")(
      req,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it("rejects employees from owner-only routes", () => {
    const req = {
      user: {
        id: "user-1",
        tenantId: "business-1",
        name: "Test Employee",
        email: "employee@test.local",
        role: "employee",
      },
    } as AuthenticatedRequest;

    const next = vi.fn();

    authorize("owner")(
      req,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
      }),
    );
  });

  it("allows owners to access owner-only routes", () => {
    const req = {
      user: {
        id: "user-1",
        tenantId: "business-1",
        name: "Test Owner",
        email: "owner@test.local",
        role: "owner",
      },
    } as AuthenticatedRequest;

    const next = vi.fn();

    authorize("owner")(
      req,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("allows employees when their role is permitted", () => {
    const req = {
      user: {
        id: "user-2",
        tenantId: "business-1",
        name: "Test Employee",
        email: "employee@test.local",
        role: "employee",
      },
    } as AuthenticatedRequest;

    const next = vi.fn();

    authorize("owner", "employee")(
      req,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });
});
