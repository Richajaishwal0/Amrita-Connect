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
} else {
  app.use(cors());
}
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isPayloadTooLarge = typeof error === "object"
    && error !== null
    && (("status" in error && error.status === 413)
      || ("statusCode" in error && error.statusCode === 413)
      || ("type" in error && (error.type === "entity.too.large" || error.type === "PayloadTooLargeError")));

  if (isPayloadTooLarge) {
    res.status(413).json({
      success: false,
      message: "The attached image or document is too large. Please upload files under 50MB.",
    });
    return;
  }

  const isValidationError = typeof error === "object"
    && error !== null
    && "issues" in error
    && Array.isArray(error.issues);

  if (isValidationError) {
    res.status(400).json({ success: false, message: "Invalid request format" });
    return;
  }

  const isMongooseValidationError = typeof error === "object"
    && error !== null
    && ("name" in error)
    && error.name === "ValidationError";

  if (isMongooseValidationError) {
    const errorDetails = Object.values((error as any)?.errors || {})
      .map((e: any) => e.message)
      .join(", ");
    logger.error({ err: error }, `Mongoose Validation Error: ${errorDetails}`);
    res.status(400).json({ success: false, message: errorDetails || "Database validation failed" });
    return;
  }

  const isCastError = typeof error === "object"
    && error !== null
    && ("name" in error)
    && (error.name === "CastError" || error.name === "BSONError");

  if (isCastError) {
    res.status(404).json({ success: false, message: "Resource not found" });
    return;
  }

  logger.error({ err: error }, "Unhandled request error");
  const errorMessage = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ success: false, message: errorMessage });
});

export default app;
