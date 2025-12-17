import mongoose, { Schema, Document } from 'mongoose';

export interface IBrollScene extends Document {
    [key: string]: any; // Flexible schema
}

const BrollSceneSchema: Schema = new Schema({
    // specific fields can be added here if known, but keeping it flexible for now
    imageUrl: { type: String },
    prompt: { type: String },
    tags: { type: [String] },
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, {
    strict: false, // Allow other fields not in schema
    collection: 'broll-scene' // Explicitly set collection name as requested
});

export default mongoose.model<IBrollScene>('BrollScene', BrollSceneSchema);
