
import { Request, Response as ExpressResponse } from "express";

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = "https://api.piapi.ai/api/v1";

/**
 * Validates existence of API Key
 */
function checkApiKey() {
    if (!PI_API_KEY) {
        throw new Error("PI_API_KEY is not configured in the server environment.");
    }
}

/**
 * CREATE TASK
 * POST /api/piapi/kling/task
 * Body: { prompt, negative_prompt, cfg_scale, duration, image_url, image_tail_url, mode, version }
 */
export const createKlingTask = async (req: Request, res: ExpressResponse) => {
    try {
        console.log("[Kling] Received Create Task Request");
        checkApiKey();

        const {
            prompt,
            negative_prompt,
            cfg_scale,
            duration,
            image_url,
            image_tail_url,
            mode,
            version
        } = req.body;

        console.log("[Kling] Request Body parsed:", { prompt, mode, version, hasImageUrl: !!image_url });

        if (!image_url) {
            return res.status(400).json({ code: 400, message: "image_url is required" });
        }

        const payload = {
            model: "kling",
            task_type: "video_generation",
            input: {
                prompt: prompt || "Smooth cinematic transition",
                negative_prompt: negative_prompt || "blur, jitter, artifacts, distortion",
                cfg_scale: cfg_scale || 0.5, // Ensure number
                duration: duration || 5,      // Ensure number
                image_url: image_url,
                image_tail_url: image_tail_url || undefined,
                mode: mode || "std",
                version: version || "1.6"     // Default to 1.6 if missing
            }
        };

        console.log("Creating Kling Task with payload:", JSON.stringify(payload, null, 2));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            console.log("[Kling] Sending request to PiAPI...");
            const response = await fetch(`${PI_API_BASE_URL}/task`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": PI_API_KEY!
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log(`[Kling] PiAPI Response Status: ${response.status}`);

            const text = await response.text();
            console.log(`[Kling] PiAPI Raw Response: ${text.substring(0, 500)}`); // Log first 500 chars

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("[Kling] Failed to parse JSON response:", e);
                return res.status(502).json({ code: 502, message: "Invalid JSON from PiAPI", detail: text });
            }

            res.status(response.status).json(data);

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error("[Kling] Fetch Error:", fetchError);
            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ code: 504, message: "Request to PiAPI timed out after 60s" });
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error("PiAPI Create Error:", error);
        res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
};

/**
 * GET TASK STATUS
 * GET /api/piapi/kling/task/:taskId
 */
export const getKlingTask = async (req: Request, res: ExpressResponse) => {
    try {
        checkApiKey();
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({ code: 400, message: "taskId is required" });
        }

        const response = await fetch(`${PI_API_BASE_URL}/task/${taskId}`, {
            method: "GET",
            headers: {
                "x-api-key": PI_API_KEY!
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error: any) {
        console.error("PiAPI Get Error:", error);
        res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
};
