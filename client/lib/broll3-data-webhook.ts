export interface BrollDataResponse {
    _id: string;
    Category: string;
    Description: string;
    "Camera Angle": string;
    Setting_Location: string;
    Tags: string[];
    image_url: string;
    [key: string]: any;
}

const DATA_WEBHOOK_URL = "https://n8n.heysnaply.com/webhook/fetch-data";

export async function fetchBrollData(imageUrl?: string): Promise<BrollDataResponse | BrollDataResponse[]> {
    try {
        const body = imageUrl ? { imageUrl } : {}; // If no imageUrl, send empty body (or whatever webhook expects for "fetch all")

        const response = await fetch(DATA_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Data webhook failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching broll data:", error);
        throw error;
    }
}
