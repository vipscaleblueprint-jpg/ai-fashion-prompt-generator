import type { Request, Response } from "express";
import { Buffer } from "node:buffer";

const DEFAULT_WEBHOOK_URL =
  "https://n8n.srv931715.hstgr.cloud/webhook/baseimagetoprompt";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const webhook =
    process.env.VITE_WEBHOOK_URL || process.env.WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ error: "Webhook not configured on server." });
  }

  const headers: Record<string, string> = {};
  const ct = req.headers["content-type"];
  if (typeof ct === "string") headers["content-type"] = ct;

  try {
    const resp = await fetch(webhook, {
      method: "POST",
      headers,
      body: req as any,
    });

    const contentType = resp.headers.get("content-type") || "";
    const buffer = Buffer.from(await resp.arrayBuffer());
    res.status(resp.status);
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(buffer.toString("utf-8"));
        res.json(json);
      } catch {
        res.setHeader("content-type", "text/plain");
        res.send(buffer);
      }
    } else {
      if (contentType) res.setHeader("content-type", contentType);
      res.send(buffer);
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Proxy request failed", message: String(err) });
  }
}

