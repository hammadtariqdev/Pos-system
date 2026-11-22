
import type { RequestHandler } from "express";
import type { z } from "zod";
import AppError from "../utils/app-error.js";

const validate = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues
        .map((issue) => {
          return `${issue.path.join(".")}: ${issue.message}`;
        })
        .join(", ");

      return next(new AppError(errors, 400));
    }

    req.body = result.data;

    next();
  };
};

export default validate;
