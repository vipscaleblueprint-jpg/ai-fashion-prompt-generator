import express from 'express';
import BrollScene from '../models/BrollScene';

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
    try {
        const items = await BrollScene.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
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

export default router;
