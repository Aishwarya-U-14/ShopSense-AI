const express = require("express");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// CREATE AUDIT LOG
router.post("/", async (req, res) => {
    try {
        const auditLog = await AuditLog.create(req.body);

        res.json({
            success: true,
            auditLog
        });

    } catch (error) {
        console.error("Audit log error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create audit log"
        });
    }
});

// GET AUDIT LOGS
router.get("/", async (req, res) => {
    try {
        const logs = await AuditLog
            .find()
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            logs
        });

    } catch (error) {
        console.error("Audit fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs"
        });
    }
});

// POST AI AUDIT ANALYSIS
router.post("/analyze", async (req, res) => {
    try {
        const { analyzeAuditHistory } = require("../services/recoveryService");
        const query = req.body.query || "Analyze my recent payment failures";
        const analysis = await analyzeAuditHistory(query);

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error("AI audit analysis error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to analyze audit history"
        });
    }
});

module.exports = router;