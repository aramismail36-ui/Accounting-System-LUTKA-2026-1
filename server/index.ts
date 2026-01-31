import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, IncomingMessage } from "http";

const app = express();
const httpServer = createServer(app);

// Extend IncomingMessage to include rawBody
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

// Middleware to capture raw JSON body
app.use(
  express.json({
    verify: (req: IncomingMessage, _res, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// Logger function
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Middleware to log API requests and JSON responses
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;

  // Capture JSON response
  let capturedJsonResponse: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse !== undefined) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Main async function
(async () => {
  await registerRoutes(httpServer, app);

  // Global error handling
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const status =
      (err as { status?: number; statusCode?: number })?.status ||
      (err as { status?: number; statusCode?: number })?.statusCode ||
      500;
    const message =
      (err as { message?: string })?.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(status).json({ message });
  });

  // Setup static files in production or Vite in development
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Start server on PORT env or default 5000
  const port = parseInt(process.env.PORT ?? "5000", 10);
  httpServer.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => log(`Server running on port ${port}`)
  );
})();
