import mongoose, { Schema, Document } from 'mongoose';

export interface IBrollScene extends Document {
    [key: string]: any; // Flexible schema
}

const BrollSceneSchema: Schema = new Schema({
    Category: { type: String },
    Description: { type: String },
    "Camera Angle": { type: String },
    "Setting_Location": { type: String },
    Tags: { type: [String] },
    image_url: { type: String },
    imageUrl: { type: String }, // Keep for backward compatibility if needed
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, {
    strict: false, // Allow other fields not in schema
    collection: 'broll_scene' // Explicitly set collection name as requested
});

export default mongoose.models.BrollScene || mongoose.model<IBrollScene>('BrollScene', BrollSceneSchema);
