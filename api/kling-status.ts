import type { VercelRequest, VercelResponse } from '@vercel/node';

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = "https://api.piapi.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ code: 405, message: "Method Not Allowed" });
    }

    try {
        if (!PI_API_KEY) {
            console.error("[Kling-Status] PI_API_KEY missing");
            return res.status(500).json({ code: 500, message: "Server misconfiguration: API Key missing" });
        }

        const { taskId } = req.query;

        if (!taskId) {
            return res.status(400).json({ code: 400, message: "taskId is required" });
        }

        console.log(`[Kling-Status] Checking status for task: ${taskId}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log("[Kling-Status] Timeout reached (10s)");
            controller.abort();
        }, 10000); // 10s should be plenty for a status check

        try {
            const piResponse = await fetch(`${PI_API_BASE_URL}/task/${taskId}`, {
                method: "GET",
                headers: {
                    "x-api-key": PI_API_KEY
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (piResponse.status === 404) {
                return res.status(404).json({ code: 404, message: "Task not found upstream" });
            }

            const data = await piResponse.json();

            // Normalize response to ensure { code: 200, data: ... } structure
            if (data && data.code === undefined && data.task_id) {
                // It's an unwrapped task object
                return res.status(piResponse.status).json({
                    code: 200,
                    data: data,
                    message: "Success"
                });
            }

            return res.status(piResponse.status).json(data);

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error("[Kling-Status] Fetch error:", fetchError);
            return res.status(502).json({ code: 502, message: "Failed to contact PiAPI", error: fetchError.message });
        }

    } catch (error: any) {
        console.error("[Kling-Status] Internal Error:", error);
        return res.status(500).json({ code: 500, message: error.message || "Internal Server Error" });
    }
}
