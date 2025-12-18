import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from project root
const envPath = path.resolve(process.cwd(), ".env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import { handleProxyWebhook } from "./routes/proxy-webhook.js";
import { handleProxySceneWebhook } from "./routes/proxy-scene-webhook.js";
import { handleProxyBrollWebhook } from "./routes/proxy-broll-webhook.js";
import { handleProxyGenerateImage } from "./routes/proxy-generate-image.js";
import { uploadthingRouteHandler } from "./routes/uploadthing-handler.js";
import { connectDB } from "./db.js";
import brollSceneRouter from "./routes/broll-scene.js";
import marketingClientsRouter from "./routes/marketing-clients.js";
import { createKlingTask, getKlingTask } from "./routes/piapi-kling.js";

export function createServer() {
  console.log("[Server] createServer() called - initializing Express app");
  const app = express();



  // Middleware
  app.use(cors());

  // Request Logger
  app.use(async (req, res, next) => {
    console.log(`[Server] Request received: ${req.method} ${req.url}`);

    // Defer DB Connection to request time to ensure logging works first
    try {
      if (req.url.startsWith('/api') && !req.url.includes('uploadthing')) {
        console.log("[Server] Ensuring DB connection...");
        await connectDB();
        console.log("[Server] DB connection healthy");
      }
      next();
    } catch (e) {
      console.error("[Server] DB Connection Failed in middleware:", e);
      // Don't crash, let it proceed to route handler which might fail but logs will show
      next();
    }
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  // Proxy endpoint to forward multipart uploads to an external webhook (avoids CORS issues)
  app.post("/api/proxy-webhook", handleProxyWebhook);
  app.post("/api/proxy-scene-webhook", handleProxySceneWebhook);
  app.post("/api/proxy-broll-webhook", handleProxyBrollWebhook);
  app.post("/api/proxy-generate-image", handleProxyGenerateImage);

  // PiAPI Kling Routes
  // const { createKlingTask, getKlingTask } = require("./routes/piapi-kling");
  app.post("/api/piapi/kling/task", createKlingTask);
  app.get("/api/piapi/kling/task/:taskId", getKlingTask);
  app.use("/api/uploadthing", uploadthingRouteHandler);

  // Broll Scene CRUD Routes
  app.use("/api/broll-scene", brollSceneRouter);

  // Marketing Clients Routes
  app.use("/api/marketing-clients", marketingClientsRouter);

  return app;
}

// Connect to MongoDB

