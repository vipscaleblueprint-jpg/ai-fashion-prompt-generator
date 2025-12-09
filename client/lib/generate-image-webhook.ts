const DEFAULT_GENERATE_IMAGE_URL =
    "https://n8n.srv1151765.hstgr.cloud/webhook/generateimage";
export const GENERATE_IMAGE_URL: string =
    ((import.meta as any)?.env?.VITE_GENERATE_IMAGE_URL as string | undefined) ||
    DEFAULT_GENERATE_IMAGE_URL;

function extractImageUrl(data: any): string | null {
    console.log("Extracting image URL from response:", data);

    // Direct string URL
    if (typeof data === "string") {
        // Check if it's a base64 image
        if (data.startsWith("data:image")) {
            return data;
        }
        // Check if it's a URL
        if (data.startsWith("http")) {
            return data;
        }
        return data;
    }

    // Check common response formats
    if (data.imageUrl) return data.imageUrl;
    if (data.image_url) return data.image_url;
    if (data.url) return data.url;
    if (data.image) {
        // Could be base64 or URL
        if (typeof data.image === "string") {
            return data.image;
        }
    }
    if (data.output) {
        if (typeof data.output === "string") return data.output;
        if (data.output.url) return data.output.url;
        if (data.output.imageUrl) return data.output.imageUrl;
    }

    // Check for array responses
    if (Array.isArray(data)) {
        if (data.length > 0) {
            const first = data[0];
            if (typeof first === "string") return first;
            if (first.url) return first.url;
            if (first.imageUrl) return first.imageUrl;
            if (first.image_url) return first.image_url;
            if (first.image) return first.image;
        }
    }

    // Check for nested input array (n8n format)
    if (data.input && Array.isArray(data.input)) {
        if (data.input.length > 0) {
            const first = data.input[0];
            if (first.imageUrl) return first.imageUrl;
            if (first.image_url) return first.image_url;
            if (first.url) return first.url;
            if (first.image) return first.image;
        }
    }

    // Check for data field
    if (data.data) {
        return extractImageUrl(data.data);
    }

    // Check for result field
    if (data.result) {
        return extractImageUrl(data.result);
    }

    return null;
}

export async function handleImageGeneration(
    prompt: string,
    opts?: {
        signal?: AbortSignal;
    },
): Promise<string> {
    const formData = new FormData();
    formData.append("prompt", prompt);

    console.log("Sending image generation request with prompt:", prompt);

    // Try direct POST first (may fail due to CORS)
    try {
        const res = await fetch(GENERATE_IMAGE_URL, {
            method: "POST",
            body: formData,
            signal: opts?.signal,
        });

        console.log("Direct response status:", res.status);

        if (!res.ok) {
            throw new Error(`Image generation failed with status ${res.status}`);
        }

        const contentType = res.headers.get("content-type") || "";
        console.log("Response content-type:", contentType);

        let data: any;

        // Check if response is an image directly
        if (contentType.includes("image/")) {
            const blob = await res.blob();
            const imageUrl = URL.createObjectURL(blob);
            console.log("Received direct image blob, created URL:", imageUrl);
            return imageUrl;
        }

        if (contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            console.log("Response text:", text);
            try {
                data = JSON.parse(text);
            } catch {
                // If response is not JSON, assume it's a direct image URL or base64
                console.log("Response is plain text, treating as URL");
                return text;
            }
        }

        console.log("Parsed response data:", data);

        const imageUrl = extractImageUrl(data);
        if (imageUrl) {
            console.log("Extracted image URL:", imageUrl);
            return imageUrl;
        }

        throw new Error("Could not extract image URL from response");
    } catch (err) {
        console.warn(
            "Direct image generation POST failed, falling back to server proxy:",
            err,
        );
    }

    // Fallback: proxy through our server to avoid CORS/network issues
    console.log("Trying proxy endpoint...");
    const proxyRes = await fetch("/api/proxy-generate-image", {
        method: "POST",
        body: formData,
        signal: opts?.signal,
    });

    console.log("Proxy response status:", proxyRes.status);

    if (!proxyRes.ok) {
        throw new Error(`Proxy image generation failed with status ${proxyRes.status}`);
    }

    const proxyCt = proxyRes.headers.get("content-type") || "";
    console.log("Proxy response content-type:", proxyCt);

    let proxyData: any;

    // Check if response is an image directly
    if (proxyCt.includes("image/")) {
        const blob = await proxyRes.blob();
        const imageUrl = URL.createObjectURL(blob);
        console.log("Received direct image blob from proxy, created URL:", imageUrl);
        return imageUrl;
    }

    if (proxyCt.includes("application/json")) {
        proxyData = await proxyRes.json();
    } else {
        const text = await proxyRes.text();
        console.log("Proxy response text:", text);
        try {
            proxyData = JSON.parse(text);
        } catch {
            console.log("Proxy response is plain text, treating as URL");
            return text;
        }
    }

    console.log("Parsed proxy response data:", proxyData);

    const imageUrl = extractImageUrl(proxyData);
    if (imageUrl) {
        console.log("Extracted image URL from proxy:", imageUrl);
        return imageUrl;
    }

    throw new Error("Could not extract image URL from proxy response");
}
