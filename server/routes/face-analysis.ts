import express from "express";
import { FaceAnalysis } from "../models/FaceAnalysis.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { clientName, prompts } = req.body;

        if (!clientName || !prompts || !Array.isArray(prompts) || prompts.length === 0) {
            return res.status(400).json({ error: "Missing clientName or prompts" });
        }

        const newAnalysis = await FaceAnalysis.create({
            clientName,
            prompts,
        });

        res.status(201).json(newAnalysis);
    } catch (error) {
        console.error("Error saving face analysis:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
