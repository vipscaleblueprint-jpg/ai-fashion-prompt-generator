const DEFAULT_WEBHOOK_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/fakeavatar";
export const FAKE_AVATAR_WEBHOOK_URL: string =
    ((import.meta as any)?.env?.VITE_FAKE_AVATAR_WEBHOOK_URL as string | undefined) ||
    DEFAULT_WEBHOOK_URL;

type LegacyWebhookPromptItem = { prompt: string };
type LegacyWebhookResponse = { input: LegacyWebhookPromptItem[] };

type VariationItem = {
    model?: string;
    task_type?: string;
    variation?: number;
    input?: { prompt?: string;[k: string]: unknown };
    [k: string]: unknown;
};

async function normalizeToPrompts(data: unknown): Promise<string[]> {
    console.log("[normalizeToPrompts] Received data:", JSON.stringify(data, null, 2));
    if (!data) {
        console.warn("[normalizeToPrompts] Data is empty");
        return [];
    }

    // Handle the new format: Array of { content: { parts: [ { text: "..." } ] } }
    if (Array.isArray(data)) {
        console.log("[normalizeToPrompts] Processing array of length:", data.length);

        // NEW: Check for the special ANALYSIS structure first
        const firstItem = data[0] as any;
        if (firstItem?.ANALYSIS && Array.isArray(firstItem.ANALYSIS)) {
            console.log("[normalizeToPrompts] Found ANALYSIS structure");
            const analysis = firstItem.ANALYSIS;
            let sceneStr = "";
            let faceStr = "";

            analysis.forEach((item: any) => {
                // Determine if this item is face or scene analysis

                // Potential Scene Analysis keys
                let sceneText = item?.scene || item?.scene_analysis || item?.content?.parts?.[0]?.text;
                if (sceneText) {
                    if (typeof sceneText !== 'string') sceneText = JSON.stringify(sceneText, null, 2);

                    if (sceneText.includes('photograph:') || sceneText.includes('background:')) {
                        sceneStr = sceneText;
                    } else if (!sceneStr) {
                        // Fallback for scene analysis if it doesn't match specific patterns but we found something
                        sceneStr = sceneText;
                    }
                }

                // Potential Face Analysis keys
                let faceText = item?.face_analysis || item?.analysis_text || (item?.content?.parts?.[0]?.text && item.content.parts[0].text.includes('face_analysis') ? item.content.parts[0].text : null);
                if (faceText) {
                    if (typeof faceText !== 'string') faceText = JSON.stringify(faceText, null, 2);
                    faceStr = faceText;
                }
            });

            console.log("[normalizeToPrompts] Extracted from ANALYSIS - Face:", !!faceStr, "Scene:", !!sceneStr);

            // Return both. We keep the order [Face, Scene] to match the UI labels in FakeAvatarGenerator.tsx
            const result = [];
            if (faceStr) result.push(faceStr);
            if (sceneStr) result.push(sceneStr);
            return result;
        }

        const prompts = (data as any[])
            .map((it, index) => {
                // Check for different possible structures
                if (it?.content?.parts?.[0]?.text) {
                    console.log(`[normalizeToPrompts] Found content.parts[0].text at index ${index}`);
                    return it.content.parts[0].text;
                }
                if (it?.output) {
                    console.log(`[normalizeToPrompts] Found output at index ${index}`);
                    return it.output;
                }
                if (it?.input?.prompt) {
                    console.log(`[normalizeToPrompts] Found input.prompt at index ${index}`);
                    return it.input.prompt;
                }
                if (typeof it === "string") {
                    console.log(`[normalizeToPrompts] Found string at index ${index}`);
                    return it;
                }
                if (it?.face_analysis) {
                    console.log(`[normalizeToPrompts] Found face_analysis at index ${index}`);
                    return it.face_analysis;
                }
                if (it?.analysis_text) {
                    console.log(`[normalizeToPrompts] Found analysis_text at index ${index}`);
                    return it.analysis_text;
                }
                console.warn(`[normalizeToPrompts] No prompt found at index ${index}`, it);
                return null;
            })
            .filter((p): p is string => typeof p === "string");

        console.log("[normalizeToPrompts] Extracted prompts:", prompts);
        if (prompts.length > 0) return prompts;
    }

    if (typeof data === "object") {
        const obj = data as any;
        console.log("[normalizeToPrompts] Processing object");

        // Check for single object instead of array
        if (obj?.content?.parts?.[0]?.text) {
            console.log("[normalizeToPrompts] Found content.parts[0].text in object");
            return [obj.content.parts[0].text];
        }

        if (obj?.output) {
            console.log("[normalizeToPrompts] Found output in object");
            return [obj.output];
        }

        if (Array.isArray(obj.input)) {
            console.log("[normalizeToPrompts] Processing obj.input array");
            const prompts = obj.input
                .map((x: any, index: number) => {
                    if (typeof x?.prompt === "string") return x.prompt;
                    console.warn(`[normalizeToPrompts] No prompt found in obj.input at index ${index}`, x);
                    return null;
                })
                .filter((p: any): p is string => typeof p === "string");

            console.log("[normalizeToPrompts] Extracted prompts from obj.input:", prompts);
            return prompts;
        }
    }

    if (typeof data === "string") {
        console.log("[normalizeToPrompts] Found raw string");
        return [data];
    }

    console.warn("[normalizeToPrompts] Falling back to empty array");
    return [];
}

export async function handleFakeAvatarSubmission(
    opts?: {
        signal?: AbortSignal;
        ethnicity?: string;
        gender?: string;
        skinColor?: string;
        hairColor?: string;
        facialExpression?: string;
        bodyComposition?: string;
        imperfection?: string;
        exactFacialStructure?: boolean;
        eyes?: string;
        eyebrows?: string;
        nose?: string;
        mouth?: string;
        ears?: string;
        transformHead?: boolean;
        angle?: string;
        cameraAngleImperfection?: string;
        backgroundEnvironment?: string;
        pose?: string;
        fashionStyle?: string;
        clothes?: string;
        clothesColor?: string;
        faceFile?: File | Blob;
        sceneFile?: File | Blob;
    },
): Promise<string[]> {
    const formData = new FormData();

    // Add all advanced settings to the form data
    if (opts?.ethnicity) formData.append("ethnicity", opts.ethnicity);
    if (opts?.gender) formData.append("gender", opts.gender);
    if (opts?.skinColor) formData.append("skinColor", opts.skinColor);
    if (opts?.hairColor) formData.append("hairColor", opts.hairColor);
    if (opts?.facialExpression) formData.append("facialExpression", opts.facialExpression);
    if (opts?.bodyComposition) formData.append("bodyComposition", opts.bodyComposition);
    if (opts?.imperfection) formData.append("imperfection", opts.imperfection);
    if (opts?.exactFacialStructure) formData.append("exactFacialStructure", String(opts.exactFacialStructure));
    if (opts?.eyes) formData.append("eyes", opts.eyes);
    if (opts?.eyebrows) formData.append("eyebrows", opts.eyebrows);
    if (opts?.nose) formData.append("nose", opts.nose);
    if (opts?.mouth) formData.append("mouth", opts.mouth);
    if (opts?.ears) formData.append("ears", opts.ears);
    if (opts?.fashionStyle) formData.append("fashionStyle", opts.fashionStyle);
    if (opts?.clothes) formData.append("clothes", opts.clothes);
    if (opts?.clothesColor) formData.append("clothesColor", opts.clothesColor);
    if (opts?.transformHead) formData.append("transformHead", String(opts.transformHead));
    if (opts?.angle) formData.append("angle", opts.angle);
    if (opts?.cameraAngleImperfection) formData.append("cameraAngleImperfection", opts.cameraAngleImperfection);
    if (opts?.backgroundEnvironment) formData.append("backgroundEnvironment", opts.backgroundEnvironment);
    if (opts?.pose) formData.append("pose", opts.pose);

    // Add image files if present
    if (opts?.faceFile) {
        formData.append("face_file", opts.faceFile);
        formData.append("has_face_file", "true");
    }
    if (opts?.sceneFile) {
        formData.append("scene_file", opts.sceneFile);
        formData.append("has_scene_file", "true");
    }

    // Check if any advanced settings are populated
    const hasAdvancedSettings = [
        opts?.ethnicity,
        opts?.gender,
        opts?.skinColor,
        opts?.hairColor,
        opts?.facialExpression,
        opts?.bodyComposition,
        opts?.imperfection,
        opts?.exactFacialStructure ? "true" : "",
        opts?.eyes,
        opts?.eyebrows,
        opts?.nose,
        opts?.mouth,
        opts?.ears,
        opts?.transformHead ? "true" : "",
        opts?.angle,
        opts?.cameraAngleImperfection,
        opts?.backgroundEnvironment,
        opts?.fashionStyle,
        opts?.clothes,
        opts?.clothesColor,
        opts?.pose,
        opts?.faceFile ? "true" : "",
        opts?.sceneFile ? "true" : "",
    ].some(val => val && val.toString().trim() !== "");

    if (hasAdvancedSettings) {
        formData.append("isnotempty", "true");
    }

    // Try direct POST first (may fail due to CORS)
    try {
        const res = await fetch(FAKE_AVATAR_WEBHOOK_URL, {
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
    const proxyRes = await fetch("/api/proxy-fake-avatar-webhook", {
        method: "POST",
        body: formData,
        signal: opts?.signal,
    });

    if (!proxyRes.ok) {
        let errorMessage = `Proxy upload failed with status ${proxyRes.status}`;
        try {
            const errorData = await proxyRes.json();
            if (errorData.message) errorMessage = errorData.message;
            else if (errorData.error) errorMessage = errorData.error;
        } catch {
            // Not JSON or no message
        }
        throw new Error(errorMessage);
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
