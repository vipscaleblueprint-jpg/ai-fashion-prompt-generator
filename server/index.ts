import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from project root
const envPath = path.resolve(process.cwd(), ".env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleProxyWebhook } from "./routes/proxy-webhook";
import { handleProxySceneWebhook } from "./routes/proxy-scene-webhook";
import { handleProxyBrollWebhook } from "./routes/proxy-broll-webhook";
import { handleProxyGenerateImage } from "./routes/proxy-generate-image";
import { uploadthingRouteHandler } from "./routes/uploadthing-handler";
import { connectDB } from "./db";
import brollSceneRouter from "./routes/broll-scene";
import marketingClientsRouter from "./routes/marketing-clients";

export function createServer() {
  const app = express();

  console.log(process.env.PI_API_KEY);



  // Middleware
  app.use(cors());
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
  const { createKlingTask, getKlingTask } = require("./routes/piapi-kling");
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
connectDB();
