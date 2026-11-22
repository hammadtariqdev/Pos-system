
import { describe, expect, test } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import validate from "../../middlewares/validate.js";
import AppError from "../../utils/app-error.js";

const testSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive()
});

describe("Validation middleware", () => {
  test("allows valid request data", () => {
    const req = {
      body: {
        name: "Sugar",
        price: 150
      }
    } as Request;

    let nextError: unknown;

    const next: NextFunction = (error?: unknown) => {
      nextError = error;
    };

    const middleware = validate(testSchema);

    middleware(req, {} as Response, next);

    expect(nextError).toBeUndefined();
    expect(req.body).toEqual({
      name: "Sugar",
      price: 150
    });
  });

  test("rejects invalid request data", () => {
    const req = {
      body: {
        name: "",
        price: -150
      }
    } as Request;

    let nextError: unknown;

    const next: NextFunction = (error?: unknown) => {
      nextError = error;
    };

    const middleware = validate(testSchema);

    middleware(req, {} as Response, next);

    expect(nextError).toBeInstanceOf(AppError);
    expect((nextError as AppError).statusCode).toBe(400);
  });
});
