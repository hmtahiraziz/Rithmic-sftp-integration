import express from "express";
import pinoHttp from "pino-http";
import { jobsRouter } from "./routes/jobs";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  app.use(express.json());
 // app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/jobs", jobsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    logger.error({ err: message }, "Unhandled error");
    res.status(500).json({ message });
  });

  return app;
}
