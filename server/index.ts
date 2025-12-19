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
import { handleProxyOutfitAnalyzerWebhook } from "./routes/proxy-outfit-analyzer-webhook.js";
import { uploadthingRouteHandler } from "./routes/uploadthing-handler.js";
import { connectDB } from "./db.js";
import brollSceneRouter from "./routes/broll-scene.js";
import marketingClientsRouter from "./routes/marketing-clients.js";
import { createKlingTask, getKlingTask } from "./routes/piapi-kling.js";

export function createServer() {
  console.log("[Server] createServer() called - initializing Express app");
  const app = express();

  // 1. Top-Level Logger
  app.use((req, res, next) => {
    console.log(`[Server] STEP 1: INCOMING ${req.method} ${req.url}`);
    next();
  });

  // 1.5 Sanity Route (No Middleware)
  app.get('/api/sanity', (req, res) => {
    console.log("[Server] HIT SANITY ROUTE");
    res.json({ status: "sanity_ok", url: req.url });
  });

  // Root Handler for Health Checks - Moved to /api/health to avoid conflicting with frontend
  app.get("/api/health", (req, res) => {
    console.log("[Server] Health Check");
    res.status(200).json({ status: "ok", service: "baseimgtoprompt-api" });
  });

  // 2. Middleware
  app.use(cors());
  app.use((req, res, next) => { console.log("[Server] STEP 2: CORS Passed"); next(); });

  app.use(express.json());
  app.use((req, res, next) => { console.log("[Server] STEP 3: JSON Parser Passed"); next(); });

  app.use(express.urlencoded({ extended: true }));

  // 3. Deferred DB Connection
  app.use(async (req, res, next) => {
    console.log(`[Server] STEP 4: DB Check for ${req.url}`);

    // Skip DB for uploadthing, Kling, ping, and demo (independent APIs)
    const isDBFree = req.url.includes('uploadthing') ||
      req.url.includes('piapi') ||
      req.url.includes('ping') ||
      req.url.includes('sanity') ||
      req.url.includes('demo');

    if (req.url.startsWith('/api') && !isDBFree) {
      try {
        console.log(`[Server] Ensuring DB connection for ${req.url}...`);
        await connectDB();
        console.log("[Server] DB Connected");
      } catch (e) {
        console.error("[Server] DB Connection Failed:", e);
      }
    } else {
      console.log(`[Server] Skipping DB connection (isDBFree=${isDBFree})`);
    }
    next();
  });

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
  app.post("/api/proxy-outfit-analyzer-webhook", handleProxyOutfitAnalyzerWebhook);

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

