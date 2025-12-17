import mongoose from 'mongoose';

export async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        await mongoose.connect(uri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // Don't exit process in dev, just log
    }
}

export const connectToDatabase = connectDB;
