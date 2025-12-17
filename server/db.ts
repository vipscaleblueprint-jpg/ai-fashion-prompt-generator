import mongoose from 'mongoose';

export async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        // Connect to 'Snaply' database explicitly to fix missing DB name in .env
        await mongoose.connect(uri, { dbName: 'Snaply' });
        console.log("MongoDB connected successfully to 'Snaply' database");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // Don't exit process in dev, just log
    }
}

export const connectToDatabase = connectDB;
