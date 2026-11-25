
import type { ErrorRequestHandler } from "express";

import AppError from "../utils/app-error";

const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  const isOperational = err instanceof AppError;
  const isDevelopment = process.env.NODE_ENV === "development";

  const statusCode = isOperational ? err.statusCode : 500;

  const message = isOperational
    ? err.message
    : "Internal Server Error";

  if (!isOperational) {
    console.error("Unexpected Error:", err);
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
