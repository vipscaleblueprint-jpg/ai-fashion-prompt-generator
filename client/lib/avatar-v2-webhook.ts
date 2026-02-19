const WEBHOOK_URL = "https://n8n.heysnaply.com/webhook/avatar-generator";

export interface AvatarV2Request {
    gender: string;
    angle: string;
    skinColor: string;
    facialExpression: string;
    bodyComposition: string;
    imperfection: string;
    hairColor: string;
    eyes: string;
    eyebrows: string;
    nose: string;
    mouth: string;
    ears: string;
    ethnicity: string;
    backgroundEnvironment: string;
}

export async function handleAvatarV2Submission(data: AvatarV2Request, signal?: AbortSignal): Promise<string[]> {
    console.log("[handleAvatarV2Submission] Sending data:", data);

    try {
        // Try direct fetch first
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal,
        });

        if (response.ok) {
            const result = await response.json();
            return normalizeV2Response(result);
        }
    } catch (err) {
        console.warn("[handleAvatarV2Submission] Direct fetch failed, trying proxy...", err);
    }

    // Fallback to proxy
    const proxyResponse = await fetch("/api/proxy-avatar-v2-webhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal,
    });

    if (!proxyResponse.ok) {
        throw new Error(`Avatar V2 synthesis failed over proxy with status ${proxyResponse.status}`);
    }

    const result = await proxyResponse.json();
    return normalizeV2Response(result);
}

function cleanText(text: string): string {
    if (!text) return text;
    // Remove markdown code blocks if they exist (e.g. ```yaml ... ``` or ``` ...)
    return text.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '$1').trim();
}

function normalizeV2Response(data: any): string[] {
    if (!data) return [];

    let rawPrompts: any[] = [];

    // Handle array of objects
    if (Array.isArray(data)) {
        rawPrompts = data.map(item => {
            if (typeof item === 'string') return item;
            if (item?.content?.parts?.[0]?.text) return item.content.parts[0].text;
            if (item?.output) return item.output;
            if (item?.text) return item.text;
            if (item?.prompt) return item.prompt;
            return null;
        });
    }
    // Handle single object
    else if (typeof data === 'object') {
        if (data.content?.parts?.[0]?.text) rawPrompts = [data.content.parts[0].text];
        else if (data.output) rawPrompts = [data.output];
        else if (data.text) rawPrompts = [data.text];
        else if (data.prompt) rawPrompts = [data.prompt];
        else if (data.prompts && Array.isArray(data.prompts)) rawPrompts = data.prompts;
    }
    else if (typeof data === 'string') {
        rawPrompts = [data];
    }

    return rawPrompts
        .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
        .map(cleanText);
}
