import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketingClient extends Document {
    client_name: string;
    clickup_id?: string;
    clockify_id?: string;
    face?: string; // Face analysis prompt for this client
    [key: string]: any; // Flexible schema for additional fields
}

const MarketingClientSchema: Schema = new Schema({
    client_name: { type: String, required: true },
    clickup_id: { type: String },
    clockify_id: { type: String },
    face: { type: String },
    createdAt: { type: Date, default: Date.now },
}, {
    strict: false, // Allow other fields not in schema
    collection: 'marketing-clients'
});

export default mongoose.models.MarketingClient || mongoose.model<IMarketingClient>('MarketingClient', MarketingClientSchema);
