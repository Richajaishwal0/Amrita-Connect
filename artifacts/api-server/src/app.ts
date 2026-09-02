import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isValidationError = typeof error === "object"
    && error !== null
    && "issues" in error
    && Array.isArray(error.issues);

  if (isValidationError) {
    res.status(400).json({ success: false, message: "Invalid request" });
    return;
  }

  logger.error({ err: error }, "Unhandled request error");
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
