import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleProxyWebhook } from "./routes/proxy-webhook";
import { handleProxySceneWebhook } from "./routes/proxy-scene-webhook";
import { handleProxyBrollWebhook } from "./routes/proxy-broll-webhook";
import { handleProxyGenerateImage } from "./routes/proxy-generate-image";

export function createServer() {
  const app = express();

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

  return app;
}
