import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { applicationRouter } from "./routes/application-routes.js";
// import { authRouter } from "./routes/auth-routes.js"; Login is not required for this project, so auth routes are not needed
import { collegeRouter } from "./routes/college-routes.js";
import { importRouter } from "./routes/import-routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (req, res) => {
    res.json({ ok: true, service: "college-visitor-backend" });
  });

  // app.use("/api", authRouter); Login is not required for this project, so auth routes are not needed
  app.use("/api", collegeRouter);
  app.use("/api", applicationRouter);
  app.use("/api", importRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
