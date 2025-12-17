import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './_db';
import MarketingClient from './models/MarketingClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Connect to DB
    try {
        await connectDB();
    } catch (e) {
        console.error('DB Connection error:', e);
        return res.status(500).json({ error: 'Database connection failed' });
    }

    const { method } = req;
    const { clientName } = req.query; // For sub-routes like /:clientName/face-profile if we merged them

    // Handling multiple routes in one file via query params or method
    // Route 1: GET /api/marketing-clients (List all)
    // Route 2: POST /api/marketing-clients (Create)
    // Route 3: GET /api/marketing-clients?faceProfile=true&clientName=... (Face Profile - was /:clientName/face-profile)

    // Note: The previous Express app used /:clientName/face-profile.
    // To support that path structure exactly, we would need `api/marketing-clients/[clientName]/face-profile.ts`.
    // BUT the frontend might be calling /api/marketing-clients directly for list.

    // Let's implement the List and Create first.
    // If the frontend calls /api/marketing-clients/CLIENT/face-profile, that will 404 unless we create that file structure.

    // For now, I'll implment the root handler.

    switch (method) {
        case 'GET':
            if (req.query.faceProfile === 'true' && req.query.clientName) {
                return await getFaceProfile(req, res);
            }
            return await listAll(req, res);

        case 'POST':
            return await create(req, res);

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}

async function listAll(req: VercelRequest, res: VercelResponse) {
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
        return res.json(clients);
    } catch (error: any) {
        console.error('[API] Error in /marketing-clients:', error);
        return res.status(500).json({ message: error.message, detail: String(error) });
    }
}

async function create(req: VercelRequest, res: VercelResponse) {
    try {
        const newClient = new MarketingClient(req.body);
        const savedClient = await newClient.save();
        return res.status(201).json(savedClient);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

async function getFaceProfile(req: VercelRequest, res: VercelResponse) {
    // This logic logic was originally in /:clientName/face-profile
    try {
        const { clientName } = req.query;
        if (!clientName) return res.status(400).json({ message: 'Client Name required' });

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
