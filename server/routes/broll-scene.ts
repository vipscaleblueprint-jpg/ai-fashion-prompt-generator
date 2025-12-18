import express from 'express';
import BrollScene from '../models/BrollScene.js';

const router = express.Router();

// Create
router.post('/', async (req, res) => {
    try {
        const newItem = new BrollScene(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Read All
router.get('/', async (req, res) => {
    console.log('[API] /broll-scene hit');
    try {
        console.log('[API] Fetching all Broll Scenes...');
        const items = await BrollScene.find().sort({ createdAt: -1 });
        console.log(`[API] Found ${items.length} scenes`);
        res.json(items);
    } catch (error: any) {
        console.error('[API] Error in /broll-scene:', error);
        res.status(500).json({ message: error.message, detail: String(error) });
    }
});

// Read One
router.get('/:id', async (req, res) => {
    try {
        const item = await BrollScene.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const updatedItem = await BrollScene.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Return the updated document
        );
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.json(updatedItem);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const deletedItem = await BrollScene.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Increment usage count by image URL
router.post('/increment-usage', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ message: 'imageUrl is required' });
        }

        console.log('Incrementing usage for URL:', imageUrl);

        // Try multiple field name variations
        let item = await BrollScene.findOneAndUpdate(
            { image_url: imageUrl },
            { $inc: { usageCount: 1 } },
            { new: true }
        );

        // If not found, try imageUrl field
        if (!item) {
            item = await BrollScene.findOneAndUpdate(
                { imageUrl: imageUrl },
                { $inc: { usageCount: 1 } },
                { new: true }
            );
        }

        // If still not found, try url field
        if (!item) {
            item = await BrollScene.findOneAndUpdate(
                { url: imageUrl },
                { $inc: { usageCount: 1 } },
                { new: true }
            );
        }

        if (!item) {
            console.log('Item not found for URL:', imageUrl);
            return res.status(404).json({ message: 'Item not found' });
        }

        console.log('Usage count incremented. New count:', item.usageCount);
        res.json(item);
    } catch (error: any) {
        console.error('Error incrementing usage:', error);
        res.status(500).json({ message: error.message });
    }
});

// Search broll scenes
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        const lowerQuery = (query || '').toLowerCase().trim();

        // Fetch all items
        const items = await BrollScene.find().sort({ createdAt: -1 });

        // If no query, return all items
        if (!lowerQuery) {
            return res.json(items);
        }

        // Client-side compatible filtering
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

        res.json(filtered);
    } catch (error: any) {
        console.error('Error searching broll scenes:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
