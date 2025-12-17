import type { VercelRequest, VercelResponse } from '@vercel/node';

// This file handles /api/marketing-clients/[clientName]/face-profile
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { clientName } = req.query;

        // Call the specific webhook for face profile (POST request)
        const webhookUrl = `https://n8n.srv1151765.hstgr.cloud/webhook/fetch-faceprofile`;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_name: clientName })
        });

        if (!response.ok) {
            // Fallback or just return empty if webhook fails
            console.warn(`Face profile webhook failed for ${clientName}: status ${response.status}`);
            return res.json([{ face: '' }]);
        }

        const data = await response.json();

        // The webhook returns an array like [{ row_number, client, face: "analysis string" }]
        // We need to extract the 'face' field from the first item
        if (Array.isArray(data) && data.length > 0 && data[0].face) {
            return res.json([{ face: data[0].face }]);
        } else {
            // If webhooks returns empty or structure doesn't match
            return res.json([{ face: '' }]);
        }

    } catch (error: any) {
        console.error('Error fetching face profile from webhook:', error);
        return res.status(500).json({ message: error.message });
    }
}
