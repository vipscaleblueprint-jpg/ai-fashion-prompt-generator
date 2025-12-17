
import { Request, Response } from "express";

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
export const createKlingTask = async (req: Request, res: Response) => {
    try {
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
                version: version || "2.5"
            }
        };

        console.log("Creating Kling Task with payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${PI_API_BASE_URL}/task`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": PI_API_KEY!
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("PiAPI Create Response:", data);

        res.status(response.status).json(data);
    } catch (error: any) {
        console.error("PiAPI Create Error:", error);
        res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
};

/**
 * GET TASK STATUS
 * GET /api/piapi/kling/task/:taskId
 */
export const getKlingTask = async (req: Request, res: Response) => {
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
