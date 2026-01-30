import { RequestHandler } from "express";

const WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/avatar-generator";

export const handleProxyAvatarV2Webhook: RequestHandler = async (req, res) => {
    const startTime = Date.now();
    console.log(`[Proxy] Forwarding to Avatar V2 Webhook: ${WEBHOOK_URL}`);

    try {
        const chunks: any[] = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);

        const headers: Record<string, string> = {};
        const ct = req.headers["content-type"];
        if (typeof ct === "string") headers["content-type"] = ct;

        const r = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers,
            body: bodyBuffer,
        });

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
        console.error(`[Proxy] Avatar V2 Proxy error:`, err);
        res.status(502).json({ error: "Proxy request failed", message: String(err) });
    }
};
