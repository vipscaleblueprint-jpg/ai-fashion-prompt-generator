const DEFAULT_SCENE_TEXT_WEBHOOK_URL =
    "https://n8n.heysnaply.com/webhook/scene-image-to-prompt";

export const SCENE_TEXT_WEBHOOK_URL: string =
    ((import.meta as any)?.env?.VITE_SCENE_TEXT_WEBHOOK_URL as string | undefined) ||
    DEFAULT_SCENE_TEXT_WEBHOOK_URL;

async function normalizeToPrompts(data: unknown): Promise<string[]> {
    if (!data) return [];
    if (Array.isArray(data)) {
        return (data as any[])
            .map((it) => it?.input?.prompt)
            .filter((p): p is string => typeof p === "string");
    }
    if (typeof data === "object") {
        const obj = data as any;
        if (Array.isArray(obj.input)) {
            return obj.input
                .map((x: any) => x?.prompt)
                .filter((p: any): p is string => typeof p === "string");
        }
        // Handle case where webhook returns direct object with text/content
        if (obj.output && typeof obj.output === "string") return [obj.output];
        if (obj.text && typeof obj.text === "string") return [obj.text];
        if (obj.prompt && typeof obj.prompt === "string") return [obj.prompt];
    }
    return [];
}

export async function handleSceneTextSubmission(
    textContent: string,
    negativePrompt?: string,
    opts?: {
        signal?: AbortSignal;
    },
): Promise<string[]> {
    const formData = new FormData();
    formData.append("text", textContent);
    if (negativePrompt) {
        formData.append("negative_prompt", negativePrompt);
    }

    try {
        const res = await fetch(SCENE_TEXT_WEBHOOK_URL, {
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
            "Direct scene text webhook POST failed:",
            err,
        );
        // If the direct call fails, we might want to try the proxy if we set it up, but for now we'll throw or return empty.
        // The existing scene-webhook.ts has a proxy fallback. I'll omit it for now or rely on the direct call as I don't have a specific proxy route for this new webhook yet.
        // However, user usually wants it to work similarly.
        // I'll assume direct call is fine or I would need to add a proxy route in server.
        throw err;
    }

    return [];
}
