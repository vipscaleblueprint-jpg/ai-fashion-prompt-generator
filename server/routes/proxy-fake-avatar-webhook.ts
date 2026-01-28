import { RequestHandler } from "express";
import { Readable } from "stream";

const DEFAULT_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/fakeavatar";

export const handleProxyFakeAvatarWebhook: RequestHandler = async (req, res) => {
    const webhook =
        process.env.VITE_FAKE_AVATAR_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

    const startTime = Date.now();
    console.log(`[Proxy] [${new Date().toISOString()}] Forwarding to Fake Avatar Webhook: ${webhook}`);

    try {
        // Read the entire body into a buffer for more reliable proxying
        // Especially since we aren't uploading files here, just small metadata
        const chunks: any[] = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);

        const headers: Record<string, string> = {};
        const ct = req.headers["content-type"];
        if (typeof ct === "string") headers["content-type"] = ct;

        // Use AbortSignal.timeout to set a 2-minute timeout for the upstream request
        // This helps detect if it's our server or the upstream server timing out
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

        const r = await fetch(webhook, {
            method: "POST",
            headers,
            body: bodyBuffer,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        console.log(`[Proxy] Upstream responded with status ${r.status} after ${duration}ms`);

        const contentType = r.headers.get("content-type") || "";
        const responseBuffer = Buffer.from(await r.arrayBuffer());

        res.status(r.status);
        if (contentType.includes("application/json")) {
            try {
                const json = JSON.parse(responseBuffer.toString("utf-8"));
                res.json(json);
            } catch (e) {
                res.type("text").send(responseBuffer);
            }
        } else {
            if (contentType) res.setHeader("content-type", contentType);
            res.send(responseBuffer);
        }
    } catch (err: any) {
        const duration = Date.now() - startTime;
        if (err.name === 'AbortError') {
            console.error(`[Proxy] Request to upstream timed out after ${duration}ms`);
            res.status(504).json({ error: "Gateway Timeout", message: "Upstream webhook took too long to respond (120s limit)" });
        } else {
            console.error(`[Proxy] Fake Avatar Proxy error after ${duration}ms:`, err);
            res.status(502).json({ error: "Proxy request failed", message: String(err) });
        }
    }
};
