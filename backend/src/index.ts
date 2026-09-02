import path from "node:path";
import fs from "node:fs";

// Load .env if present
const rootEnvPath = path.resolve(process.cwd(), ".env");
const parentEnvPath = path.resolve(process.cwd(), "..", ".env");

if (typeof (process as any).loadEnvFile === "function") {
  if (fs.existsSync(rootEnvPath)) {
    (process as any).loadEnvFile(rootEnvPath);
  } else if (fs.existsSync(parentEnvPath)) {
    (process as any).loadEnvFile(parentEnvPath);
  }
}

import app from "./app";
import { logger } from "./lib/logger";
import { connectDatabase } from "@workspace/db";
import { seedDevelopmentData } from "./services/seed";

const port = Number(process.env["PORT"]) || 5000;

async function startServer() {
  try {
    await connectDatabase();
    logger.info("Connected to MongoDB database");
    await seedDevelopmentData();
    logger.info("Initialized development data");
  } catch (err) {
    logger.error({ err }, "Database connection / seed failed");
  }

  app.listen(port, () => {
    logger.info({ port }, `Server listening on http://localhost:${port}`);
  });
}

startServer();
