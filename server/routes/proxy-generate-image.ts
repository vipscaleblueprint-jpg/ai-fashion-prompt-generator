import { RequestHandler } from "express";
import { Readable } from "stream";

const DEFAULT_GENERATE_IMAGE_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/generateimage";

export const handleProxyGenerateImage: RequestHandler = (req, res) => {
    const webhook =
        process.env.VITE_GENERATE_IMAGE_URL || process.env.GENERATE_IMAGE_URL || DEFAULT_GENERATE_IMAGE_URL;
    if (!webhook) {
        return res.status(500).json({ error: "Generate image webhook not configured on server." });
    }

    // Forward the incoming request body (stream) to the configured webhook.
    // Preserve the content-type so multipart/form-data works correctly.
    const headers: Record<string, string> = {};
    const ct = req.headers["content-type"];
    if (typeof ct === "string") headers["content-type"] = ct;

    // Use global fetch available in modern Node to proxy the request stream
    const streamBody = Readable.toWeb(req as any) as unknown as ReadableStream;

    fetch(webhook, {
        method: "POST",
        headers,
        body: streamBody,
    })
        .then(async (r) => {
            const contentType = r.headers.get("content-type") || "";
            const buffer = Buffer.from(await r.arrayBuffer());
            res.status(r.status);
            if (contentType.includes("application/json")) {
                try {
                    const json = JSON.parse(buffer.toString("utf-8"));
                    res.json(json);
                } catch (e) {
                    res.type("text").send(buffer);
                }
            } else {
                if (contentType) res.setHeader("content-type", contentType);
                res.send(buffer);
            }
        })
        .catch((err) => {
            console.error("Proxy generate image error:", err);
            res
                .status(502)
                .json({ error: "Proxy image generation failed", message: String(err) });
        });
};
