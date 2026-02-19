const BROLL3_WEBHOOK_URL = "https://n8n.heysnaply.com/webhook/upload-broll";

export interface Broll3WebhookResponse {
    success?: boolean;
    message?: string;
    prompt?: string;
    prompts?: string[];
    [key: string]: any;
}

/**
 * Send uploaded image URL to the Broll 3.0 webhook
 */
export async function sendToWebhook(imageUrl: string): Promise<Broll3WebhookResponse> {
    try {
        const response = await fetch(BROLL3_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                imageUrl,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Broll3 webhook error:", error);
        throw error;
    }
}

/**
 * Normalize webhook response to extract prompts
 */
export function normalizeWebhookResponse(response: any): string[] {
    if (!response) return [];

    // If response has prompts array
    if (Array.isArray(response.prompts)) {
        return response.prompts.filter((p: any) => typeof p === "string" && p.trim());
    }

    // If response has a single prompt
    if (typeof response.prompt === "string" && response.prompt.trim()) {
        return [response.prompt];
    }

    // If response has a message
    if (typeof response.message === "string" && response.message.trim()) {
        return [response.message];
    }

    // Try to extract from nested structures
    if (response.content?.parts?.[0]?.text) {
        return [response.content.parts[0].text];
    }

    return [];
}
