import mongoose from "mongoose";

const FaceAnalysisSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
    },
    prompts: {
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const FaceAnalysis = mongoose.models.FaceAnalysis || mongoose.model("FaceAnalysis", FaceAnalysisSchema);
