import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { connectDB } from '../server/db';
import marketingClientsRouter from '../server/routes/marketing-clients';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connected
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        console.error('DB connection failed', e);
        res.status(500).json({ error: 'Internal Server Error (DB)' });
    }
});

// Mount the router
app.use('/api/marketing-clients', marketingClientsRouter);

export default serverless(app);
