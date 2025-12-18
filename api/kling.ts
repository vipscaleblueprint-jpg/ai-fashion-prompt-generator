import type { VercelRequest, VercelResponse } from '@vercel/node';

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = "https://api.piapi.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (!PI_API_KEY) {
            console.error("[Kling] PI_API_KEY missing");
            return res.status(500).json({ code: 500, message: "Server misconfiguration: API Key missing" });
        }

        // --- GET: Status Check ---
        if (req.method === 'GET') {
            const { taskId } = req.query;
            if (!taskId) return res.status(400).json({ code: 400, message: "taskId is required" });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

            try {
                const piResponse = await fetch(`${PI_API_BASE_URL}/task/${taskId}`, {
                    method: "GET",
                    headers: { "x-api-key": PI_API_KEY },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (piResponse.status === 404) return res.status(404).json({ code: 404, message: "Task not found upstream" });

                const data = await piResponse.json();

                // Normalize Wrapped Response
                if (data && data.code === undefined && data.task_id) {
                    return res.status(piResponse.status).json({ code: 200, data, message: "Success" });
                }
                return res.status(piResponse.status).json(data);

            } catch (err: any) {
                clearTimeout(timeoutId);
                return res.status(502).json({ code: 502, message: "Failed to contact PiAPI", error: err.message });
            }
        }

        // --- POST: Create Task ---
        if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.error("[Kling] Failed to parse body string:", body);
                    return res.status(400).json({ code: 400, message: "Invalid JSON body" });
                }
            }

            const {
                prompt, negative_prompt, cfg_scale, duration,
                image_url, image_tail_url, mode, version
            } = body || {};

            console.log("[Kling] Incoming Payload:", { prompt, mode, version, duration, cfg_scale, image_url });

            if (!image_url) return res.status(400).json({ code: 400, message: "image_url is required" });

            const payload = {
                model: "kling",
                task_type: "video_generation",
                input: {
                    prompt: prompt || "Smooth cinematic transition",
                    negative_prompt: negative_prompt || "blur, jitter, artifacts, distortion",
                    cfg_scale: Number(cfg_scale) || 0.5,
                    duration: Number(duration) || 5,
                    image_url,
                    image_tail_url: image_tail_url || undefined,
                    mode: mode || "std",
                    version: version || "1.6"
                }
            };

            console.log("[Kling] Sending to PiAPI:", JSON.stringify(payload));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s

            try {
                const piResponse = await fetch(`${PI_API_BASE_URL}/task`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-api-key": PI_API_KEY },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await piResponse.json();

                // Normalize Wrapped Response
                if (data && data.code === undefined && data.task_id) {
                    return res.status(piResponse.status).json({ code: 200, data, message: "Task Created" });
                }
                return res.status(piResponse.status).json(data);

            } catch (err: any) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') return res.status(504).json({ code: 504, message: "Gateway Timeout >55s" });
                throw err;
            }
        }

        return res.status(405).json({ code: 405, message: "Method Not Allowed" });

    } catch (error: any) {
        console.error("[Kling] Internal Error:", error);
        return res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
}
