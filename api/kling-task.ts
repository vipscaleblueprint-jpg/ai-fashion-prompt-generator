import type { VercelRequest, VercelResponse } from '@vercel/node';

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = "https://api.piapi.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or strict origin if preferred
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ code: 405, message: "Method Not Allowed" });
    }

    try {
        console.log("[Kling-Standalone] Received Task Request");

        if (!PI_API_KEY) {
            console.error("[Kling-Standalone] PI_API_KEY missing");
            return res.status(500).json({ code: 500, message: "Server misconfiguration: API Key missing" });
        }

        const {
            prompt,
            negative_prompt,
            cfg_scale,
            duration,
            image_url,
            image_tail_url,
            mode,
            version
        } = req.body || {};

        if (!image_url) {
            return res.status(400).json({ code: 400, message: "image_url is required" });
        }

        const payload = {
            model: "kling",
            task_type: "video_generation",
            input: {
                prompt: prompt || "Smooth cinematic transition",
                negative_prompt: negative_prompt || "blur, jitter, artifacts, distortion",
                cfg_scale: cfg_scale || 0.5,
                duration: duration || 5,
                image_url: image_url,
                image_tail_url: image_tail_url || undefined,
                mode: mode || "std",
                version: version || "1.6"
            }
        };

        console.log("[Kling-Standalone] Submitting payload...", JSON.stringify(payload));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log("[Kling-Standalone] Timeout reached (55s)");
            controller.abort();
        }, 55000); // 55s timeout

        try {
            const piResponse = await fetch(`${PI_API_BASE_URL}/task`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": PI_API_KEY
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log(`[Kling-Standalone] PiAPI status: ${piResponse.status}`);

            // Pass through the response body
            const data = await piResponse.json();

            // Normalize response if needed
            if (data && data.code === undefined && data.task_id) {
                return res.status(piResponse.status).json({
                    code: 200,
                    data: data,
                    message: "Task Created"
                });
            }

            return res.status(piResponse.status).json(data);

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error("[Kling-Standalone] Fetch error:", fetchError);
            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ code: 504, message: "Gateway Timeout: PiAPI took too long (>55s)" });
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error("[Kling-Standalone] Internal Error:", error);
        return res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
}
