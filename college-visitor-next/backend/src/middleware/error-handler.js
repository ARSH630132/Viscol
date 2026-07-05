import { ZodError } from "zod";

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        issues: error.issues,
      },
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      error: {
        message: "Record not found",
      },
    });
  }

  const status = error.statusCode || error.status || 500;
  const message = status === 500 ? "Internal server error" : error.message;

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json({
    error: {
      message,
    },
  });
}
