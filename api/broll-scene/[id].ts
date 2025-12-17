import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../_db';
import BrollScene from '../models/BrollScene';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    try {
        await connectDB();
    } catch (e) {
        return res.status(500).json({ error: 'Database connection failed' });
    }

    switch (method) {
        case 'GET':
            try {
                const item = await BrollScene.findById(id);
                if (!item) return res.status(404).json({ message: 'Item not found' });
                return res.json(item);
            } catch (error: any) {
                return res.status(500).json({ message: error.message });
            }

        case 'PUT':
            try {
                const updatedItem = await BrollScene.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true }
                );
                if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
                return res.json(updatedItem);
            } catch (error: any) {
                return res.status(500).json({ message: error.message });
            }

        case 'DELETE':
            try {
                const deletedItem = await BrollScene.findByIdAndDelete(id);
                if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
                return res.json({ message: 'Item deleted successfully' });
            } catch (error: any) {
                return res.status(500).json({ message: error.message });
            }

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
