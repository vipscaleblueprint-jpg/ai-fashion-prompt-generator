import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/db.js';
import BrollScene from '../models/BrollScene.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectDB();

        const { query } = req.body;
        const lowerQuery = (query || '').toLowerCase().trim();

        // Fetch all items (Naive implementation from original)
        // Ideally use MongoDB text search index for better performance
        const items = await BrollScene.find().sort({ createdAt: -1 });

        if (!lowerQuery) {
            return res.json(items);
        }

        const filtered = items.filter((item: any) => {
            // Check Description
            if (item.Description && typeof item.Description === 'string' && item.Description.toLowerCase().includes(lowerQuery)) return true;
            // Check Category
            if (item.Category && typeof item.Category === 'string' && item.Category.toLowerCase().includes(lowerQuery)) return true;
            // Check Camera Angle
            if (item['Camera Angle'] && typeof item['Camera Angle'] === 'string' && item['Camera Angle'].toLowerCase().includes(lowerQuery)) return true;
            // Check Setting_Location
            if (item.Setting_Location && typeof item.Setting_Location === 'string' && item.Setting_Location.toLowerCase().includes(lowerQuery)) return true;
            // Check Tags (array)
            if (Array.isArray(item.Tags)) {
                if (item.Tags.some((tag: any) => typeof tag === 'string' && tag.toLowerCase().includes(lowerQuery))) return true;
            }
            // Check output field
            if (item.output && typeof item.output === 'string' && item.output.toLowerCase().includes(lowerQuery)) return true;
            return false;
        });

        return res.json(filtered);
    } catch (error: any) {
        console.error('Error searching:', error);
        return res.status(500).json({ message: error.message });
    }
}
