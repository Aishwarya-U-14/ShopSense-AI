const express = require("express");
const { analyzeImage } = require("../services/geminiService");
const { processAgentShoppingRequest } = require("../services/agentService");

const router = express.Router();

// AI Context-Aware Shopping Agent Endpoint
router.post("/agent-chat", async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const agentResponse = await processAgentShoppingRequest({
            message,
            conversationHistory: history || []
        });

        res.json({
            success: true,
            ...agentResponse
        });
    } catch (error) {
        console.error("Agent chat endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "AI Shopping Agent error",
            error: error.message
        });
    }
});

router.post("/analyze-image", async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({
                message: "Image is required"
            });
        }

        console.log("Gemini image request received");

        const result = await analyzeImage(
            image,
            mimeType || "image/jpeg"
        );

        console.log("Gemini response received");

        res.json({
            success: true,
            analysis: result
        });

    } catch (error) {
        console.error("Gemini error:", error);

        res.status(500).json({
            success: false,
            message: "Gemini image analysis failed",
            error: error.message
        });
    }
});

module.exports = router;