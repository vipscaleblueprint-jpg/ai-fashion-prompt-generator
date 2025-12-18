import express from 'express';
import MarketingClient from '../models/MarketingClient.js';

const router = express.Router();

// Get all marketing clients
router.get('/', async (req, res) => {
    console.log('[API] /marketing-clients hit');
    try {
        const webhookUrl = 'https://n8n.srv1151765.hstgr.cloud/webhook/marketing-clients';
        console.log(`[API] Fetching clients from: ${webhookUrl}`);

        // Fetch from n8n webhook as requested
        const response = await fetch(webhookUrl);
        console.log(`[API] Webhook response status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API] Webhook failed. Body: ${text}`);
            throw new Error(`Webhook returned status ${response.status}`);
        }

        const text = await response.text();
        // console.log(`[API] Raw response body: ${text.substring(0, 100)}...`);

        let clients;
        try {
            clients = JSON.parse(text);
        } catch (e) {
            console.error(`[API] Failed to parse JSON: ${text}`);
            throw new Error('Invalid JSON response from webhook');
        }

        // Sort clients alphabetically by name for better UX
        if (Array.isArray(clients)) {
            clients.sort((a: any, b: any) =>
                (a.client_name || '').localeCompare(b.client_name || '')
            );
        }

        console.log(`[API] Successfully retrieved ${Array.isArray(clients) ? clients.length : 0} clients`);
        res.json(clients);
    } catch (error: any) {
        console.error('[API] Error in /marketing-clients:', error);
        res.status(500).json({ message: error.message, detail: String(error) });
    }
});

// Get face profile for a specific client by name
router.get('/:clientName/face-profile', async (req, res) => {
    try {
        const { clientName } = req.params;

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
            res.json([{ face: data[0].face }]);
        } else {
            // If webhooks returns empty or structure doesn't match
            res.json([{ face: '' }]);
        }

    } catch (error: any) {
        console.error('Error fetching face profile from webhook:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new client (for admin purposes)
router.post('/', async (req, res) => {
    try {
        const newClient = new MarketingClient(req.body);
        const savedClient = await newClient.save();
        res.status(201).json(savedClient);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
