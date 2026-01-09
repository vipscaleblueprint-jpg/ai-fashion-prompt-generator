export const MARKETING_CLIENTS_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/marketing-clients";

const DEFAULT_SUBMISSION_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/face-analyzer";
export const FACE_ANALYZER_WEBHOOK_URL: string =
    ((import.meta as any)?.env?.VITE_FACE_ANALYZER_WEBHOOK_URL as string | undefined) ||
    DEFAULT_SUBMISSION_WEBHOOK_URL;

export const APPEND_SHEET_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/append-sheet";

type LegacyWebhookPromptItem = { prompt: string };
type LegacyWebhookResponse = { input: LegacyWebhookPromptItem[] };

async function normalizeToPrompts(data: unknown): Promise<string[]> {
    if (!data) return [];

    // Handle the specific structure: [{ content: { parts: [{ text: "..." }] } }]
    if (Array.isArray(data)) {
        const prompts: string[] = [];
        for (const item of data) {
            if (item?.content?.parts && Array.isArray(item.content.parts)) {
                for (const part of item.content.parts) {
                    if (typeof part?.text === "string") {
                        // Clean up markdown code blocks if present
                        let text = part.text;
                        if (text.startsWith("```yaml")) {
                            text = text.replace(/^```yaml\n/, "").replace(/\n```$/, "");
                        } else if (text.startsWith("```")) {
                            text = text.replace(/^```\w*\n/, "").replace(/\n```$/, "");
                        }
                        prompts.push(text.trim());
                    }
                }
            } else if (item?.input?.prompt) {
                // Fallback for previous expected format
                if (typeof item.input.prompt === "string") {
                    prompts.push(item.input.prompt);
                }
            }
        }
        if (prompts.length > 0) return prompts;
    }

    // Fallback for object with input array
    if (typeof data === "object") {
        const obj = data as any;
        if (Array.isArray(obj.input)) {
            return obj.input
                .map((x: any) => x?.prompt)
                .filter((p: any): p is string => typeof p === "string");
        }
    }
    return [];
}

export async function handleFaceAnalyzerSubmission(
    imageFile: File,
    opts?: {
        signal?: AbortSignal;
        client?: string;
    },
): Promise<string[]> {
    const formData = new FormData();
    // Changed from Base_Image to Face_Analyzer as requested
    formData.append("Face_Analyzer", imageFile);

    if (opts?.client) {
        formData.append("client", opts.client);
    }

    // Try direct POST first (may fail due to CORS)
    try {
        const res = await fetch(FACE_ANALYZER_WEBHOOK_URL, {
            method: "POST",
            body: formData,
            signal: opts?.signal,
        });

        if (!res.ok) {
            throw new Error(`Upload failed with status ${res.status}`);
        }

        const contentType = res.headers.get("content-type") || "";
        let data: unknown;
        if (contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }

        const prompts = await normalizeToPrompts(data);
        if (prompts.length > 0) return prompts;
    } catch (err) {
        console.warn(
            "Direct webhook POST failed, falling back to server proxy:",
            err,
        );
    }

    // Fallback: proxy through our server to avoid CORS/network issues
    const proxyRes = await fetch("/api/proxy-face-analyzer-webhook", {
        method: "POST",
        body: formData,
        signal: opts?.signal,
    });

    if (!proxyRes.ok) {
        throw new Error(`Proxy upload failed with status ${proxyRes.status}`);
    }

    const proxyCt = proxyRes.headers.get("content-type") || "";
    let proxyData: unknown;
    if (proxyCt.includes("application/json")) {
        proxyData = await proxyRes.json();
    } else {
        const text = await proxyRes.text();
        try {
            proxyData = JSON.parse(text);
        } catch {
            proxyData = text;
        }
    }

    const prompts = await normalizeToPrompts(proxyData);
    if (prompts.length === 0)
        throw new Error("Unexpected response from webhook/proxy");
    return prompts;
}

export async function updateSheet(
    client: string,
    prompt: string
): Promise<boolean> {
    const formData = new FormData();
    formData.append("client", client);
    formData.append("prompt", prompt);

    try {
        const res = await fetch(APPEND_SHEET_WEBHOOK_URL, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            console.error(`Sheet update failed: ${res.status}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error updating sheet:", err);
        return false;
    }
}
