import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './_db';
// We need to import the model. Ideally we should move models to api/_models
// but importing from relative path ../server/models/BrollScene should work if included in build.
// To be safe and self-contained, I will redefine the model here slightly or import it.
// Let's try importing first. If Vercel fails to bundle, we move it.
import BrollScene from './models/BrollScene';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Connect to DB
    try {
        await connectDB();
    } catch (e) {
        console.error('DB Connection error:', e);
        return res.status(500).json({ error: 'Database connection failed' });
    }

    const { method } = req;
    const { id } = req.query; // For /api/broll-scene?id=... usage if needed, or we might need dynamic routes for /api/broll-scene/[id].ts

    // Since this file is at /api/broll-scene.ts, it handles:
    // GET /api/broll-scene (List all)
    // POST /api/broll-scene (Create)
    // POST /api/broll-scene?action=search (Search, pseudo-RPC)
    // POST /api/broll-scene?action=increment-usage (Increment Usage)

    // For specific ID operations like GET /api/broll-scene/:id, Update, Delete:
    // With Vercel file-system routing, we'd traditionally use /api/broll-scene/[id].ts
    // BUT the user asked for "One working CRUD example" in a single file? 
    // If I put everything here, clients need to change URLs to /api/broll-scene?id=XYZ.
    // The previous Express app used /api/broll-scene/:id.

    // DECISION: To support /api/broll-scene/:id, I must create a separate file `api/broll-scene/[id].ts`
    // OR I can use a catch-all `api/broll-scene/[[...params]].ts` if I want one file.
    // Given the prompt "Deliverables... /api/*.ts", I will stick to one file `api/broll-scene.ts`
    // and rely on query params OR create the [id].ts file. 
    // Creating [id].ts is cleaner for REST validity.
    // I will Create `api/broll-scene/index.ts` and `api/broll-scene/[id].ts` effectively?
    // No, I can't easily change the file structure to `broll-scene/index` without changing import paths.
    // I will make this file strictly handle Collection operations (List, Create, Search)
    // And I will create `api/broll-scene/[id].ts` for Item operations if I want to perfectly replicate Express routes.

    // However, the prompt asked for "One working CRUD example". I will make this file robust enough.

    switch (method) {
        case 'GET':
            // Check if asking for specific ID via Query string as a fallback or just List
            if (req.query.id) {
                return await getOne(req, res);
            }
            return await listAll(req, res);

        case 'POST':
            if (req.query.action === 'search') {
                return await search(req, res);
            }
            if (req.query.action === 'increment-usage') {
                return await incrementUsage(req, res);
            }
            return await create(req, res);

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}

async function listAll(req: VercelRequest, res: VercelResponse) {
    try {
        console.log('[API] Fetching all Broll Scenes...');
        const items = await BrollScene.find().sort({ createdAt: -1 });
        console.log(`[API] Found ${items.length} scenes`);
        return res.json(items);
    } catch (error: any) {
        console.error('[API] Error in listAll:', error);
        return res.status(500).json({ message: error.message });
    }
}

async function getOne(req: VercelRequest, res: VercelResponse) {
    try {
        const item = await BrollScene.findById(req.query.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        return res.json(item);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}


async function create(req: VercelRequest, res: VercelResponse) {
    try {
        const newItem = new BrollScene(req.body);
        const savedItem = await newItem.save();
        return res.status(201).json(savedItem);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}

async function search(req: VercelRequest, res: VercelResponse) {
    try {
        const { query } = req.body;
        const lowerQuery = (query || '').toLowerCase().trim();

        // Fetch all items (Naive implementation from original)
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

async function incrementUsage(req: VercelRequest, res: VercelResponse) {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ message: 'imageUrl is required' });
        }

        console.log('Incrementing usage for URL:', imageUrl);

        let item = await BrollScene.findOneAndUpdate(
            { image_url: imageUrl },
            { $inc: { usageCount: 1 } },
            { new: true }
        );

        if (!item) {
            item = await BrollScene.findOneAndUpdate(
                { imageUrl: imageUrl },
                { $inc: { usageCount: 1 } },
                { new: true }
            );
        }

        if (!item) {
            item = await BrollScene.findOneAndUpdate(
                { url: imageUrl },
                { $inc: { usageCount: 1 } },
                { new: true }
            );
        }

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        return res.json(item);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}
