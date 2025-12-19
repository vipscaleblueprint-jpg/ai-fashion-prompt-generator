
export const MARKETING_CLIENTS_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/marketing-clients";

export const OUTFIT_ANALYZER_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/outfit-analyzer";

export const APPEND_SHEET_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/append-sheet";

async function normalizeToPrompts(data: unknown): Promise<string[]> {
    if (!data) return [];
    if (Array.isArray(data)) {
        return (data as any[])
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.output && typeof item.output === 'string') {
                    let text = item.output;
                    // Clean up markdown code blocks if present (logic from previous implementation)
                    if (text.startsWith("```yaml")) {
                        text = text.replace(/^```yaml\s+/, "").replace(/\s+```$/, "");
                    } else if (text.startsWith("```")) {
                        text = text.replace(/^```\w*\s+/, "").replace(/\s+```$/, "");
                    }
                    return text.trim();
                }
                return null;
            })
            .filter((p): p is string => typeof p === "string");
    }

    if (typeof data === "object") {
        const obj = data as any;
        if (obj.output && typeof obj.output === "string") {
            return [obj.output];
        }
    }
    return [];
}

export async function handleOutfitAnalyzerSubmission(
    imageFile: File,
    opts?: {
        signal?: AbortSignal;
        client?: string;
    },
): Promise<string[]> {
    const formData = new FormData();
    formData.append("Outfit_Analyzer", imageFile);

    if (opts?.client) {
        formData.append("client", opts.client);
    }

    // Try direct POST first (may fail due to CORS)
    try {
        const res = await fetch(OUTFIT_ANALYZER_WEBHOOK_URL, {
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
            "Direct Outfit Analyzer webhook POST failed, falling back to server proxy:",
            err,
        );
    }

    // Fallback: proxy through our server to avoid CORS/network issues
    // Note: We need to ensure /api/proxy-outfit-analyzer-webhook exists
    const proxyRes = await fetch("/api/proxy-outfit-analyzer-webhook", {
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
