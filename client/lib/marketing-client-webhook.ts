export const MARKETING_CLIENT_WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/marketing-clients";

export type MarketingClient = {
    client_name: string;
    clickup_id: string;
    clockify_id: string;
    [key: string]: any;
};

export async function fetchMarketingClients(): Promise<MarketingClient[]> {
    try {
        const response = await fetch(MARKETING_CLIENT_WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch marketing clients: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        console.log("Marketing Clients Webhook Response:", data);

        if (Array.isArray(data)) {
            return data;
        }

        return [];
    } catch (error) {
        console.error("Error fetching marketing clients:", error);
        return [];
    }
}
