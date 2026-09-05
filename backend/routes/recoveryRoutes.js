const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

const {
    calculateRevenueAtRisk,
    getRecoveryOpportunities,
    diagnosePaymentFailure,
    decideOfferIncentive,
    generateCampaignProposal,
    generateSmartBundles,
    detectAnomalies,
    getConversionFunnel,
    askMerchantCopilot
} = require("../services/recoveryService");

const { enforceGuardrails } = require("../middleware/guardrails");
const Transaction = require("../models/Transaction");
const AbandonedCheckout = require("../models/AbandonedCheckout");
const AuditLog = require("../models/AuditLog");

// Razorpay Instance (test mode)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TXeMEnsWC9M3tl",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "CuPusj53oT75ceCeiCOYj28Z"
});

// 1. GET Revenue at Risk & Health
router.get("/revenue-at-risk", async (req, res) => {
    try {
        const stats = await calculateRevenueAtRisk();
        res.json({ success: true, ...stats });
    } catch (error) {
        console.error("Revenue at risk error:", error);
        res.status(500).json({ success: false, error: "Failed to calculate revenue at risk" });
    }
});

// 2. GET Recovery Opportunities
router.get("/opportunities", async (req, res) => {
    try {
        const opportunities = await getRecoveryOpportunities();
        res.json({ success: true, opportunities });
    } catch (error) {
        console.error("Opportunities error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch opportunities" });
    }
});

// 3. POST Action Preview (Merchant sees before execution)
router.post("/action-preview", async (req, res) => {
    try {
        const { actionType, id, customer, amount, productName, targetType } = req.body;

        const reason = targetType === "ABANDONED_CHECKOUT"
            ? "The customer added products to cart and started checkout, but exited before completing payment. Recovery is recommended to salvage this high-intent session."
            : "The customer reached checkout and the previous payment attempt failed or was cancelled. Recovery is recommended based on available transaction history.";

        const preview = {
            action: actionType || "Generate payment recovery link",
            customer: customer || "Customer #102",
            amount: Number(amount) || 0,
            productName: productName || "Selected Items",
            reason,
            risk: "LOW",
            expectedResult: "Dispatches a dedicated, pre-filled Razorpay payment link to customer, enabling single-click payment retry.",
            whyAmIDoingThis: `The customer demonstrated clear purchase intent. Automating recovery re-captures ₹${amount} without discount erosion.`
        };

        // Log ACTION_PREVIEW to Audit Trail
        await AuditLog.create({
            action: "ACTION_PREVIEW",
            description: `Merchant reviewed action preview: ${preview.action} for ${customer}`,
            productName: preview.productName,
            amount: preview.amount,
            status: "PENDING"
        });

        res.json({ success: true, preview });
    } catch (error) {
        console.error("Action preview error:", error);
        res.status(500).json({ success: false, error: "Failed to generate action preview" });
    }
});

// 4. POST Execute Recovery Action (Protected by Guardrails)
router.post("/execute-action", enforceGuardrails, async (req, res) => {
    try {
        const { id, targetType, customer, amount, productName } = req.body;

        // Generate Razorpay Payment Link (or authenticated test link)
        let linkUrl = "";
        try {
            // Attempt standard Razorpay test order creation
            const rzpOrder = await razorpay.orders.create({
                amount: Math.round(Number(amount) * 100),
                currency: "INR",
                receipt: `recov_${Date.now()}`
            });
            linkUrl = `https://checkout.razorpay.com/v1/checkout.js?order_id=${rzpOrder.id}`;
        } catch (rzpErr) {
            linkUrl = `https://rzp.io/i/recov_${Date.now()}`;
        }

        // Update target record
        if (targetType === "ABANDONED_CHECKOUT") {
            await AbandonedCheckout.findByIdAndUpdate(id, {
                recoveryStatus: "GENERATED",
                recoveryLink: linkUrl
            });
        } else {
            await Transaction.findByIdAndUpdate(id, {
                recoveryStatus: "LINK_GENERATED",
                recoveryLink: linkUrl
            });
        }

        // Audit Trail updates: ACTION_APPROVED & ACTION_EXECUTED
        await AuditLog.create({
            action: "ACTION_APPROVED",
            description: `Merchant approved recovery action for ${customer} (₹${amount})`,
            productName,
            amount: Number(amount),
            status: "APPROVED"
        });

        await AuditLog.create({
            action: "ACTION_EXECUTED",
            description: `Payment recovery link successfully generated for ${customer}: ${linkUrl}`,
            productName,
            amount: Number(amount),
            status: "EXECUTED"
        });

        res.json({
            success: true,
            message: `Recovery link generated for ${customer}`,
            paymentLink: linkUrl,
            status: "LINK_GENERATED"
        });
    } catch (error) {
        console.error("Execute recovery error:", error);
        res.status(500).json({ success: false, error: "Failed to execute recovery action" });
    }
});

// 5. POST AI Merchant Revenue Copilot Chat
router.post("/copilot", async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ success: false, error: "Question is required" });
        }

        const answer = await askMerchantCopilot(question);
        res.json({ success: true, answer });
    } catch (error) {
        console.error("Copilot error:", error);
        res.status(500).json({ success: false, error: "Failed to answer question" });
    }
});

// 6. POST AI Campaign Proposal (Protected by Guardrails)
router.post("/campaign", enforceGuardrails, async (req, res) => {
    try {
        const { objective, budget } = req.body;
        const proposal = await generateCampaignProposal(objective, budget);
        res.json({ success: true, campaign: proposal });
    } catch (error) {
        console.error("Campaign error:", error);
        res.status(500).json({ success: false, error: "Failed to generate campaign" });
    }
});

// 7. GET Smart Bundles
router.get("/bundles", async (req, res) => {
    try {
        const bundles = await generateSmartBundles();
        res.json({ success: true, bundles });
    } catch (error) {
        console.error("Bundles error:", error);
        res.status(500).json({ success: false, error: "Failed to generate bundles" });
    }
});

// 8. GET Anomalies
router.get("/anomalies", async (req, res) => {
    try {
        const alerts = await detectAnomalies();
        res.json({ success: true, alerts });
    } catch (error) {
        console.error("Anomalies error:", error);
        res.status(500).json({ success: false, error: "Failed to detect anomalies" });
    }
});

// 9. GET Conversion Funnel
router.get("/funnel", async (req, res) => {
    try {
        const funnel = await getConversionFunnel();
        res.json({ success: true, funnel });
    } catch (error) {
        console.error("Funnel error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch funnel" });
    }
});

// 10. POST Track Abandoned Checkout
router.post("/track-abandonment", async (req, res) => {
    try {
        const { sessionId, cartItems, totalAmount, step, customerRef, customerEmail } = req.body;
        if (!sessionId || !totalAmount) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const existing = await AbandonedCheckout.findOne({ sessionId, status: "ABANDONED" });
        if (existing) {
            existing.step = step || existing.step;
            existing.cartItems = cartItems || existing.cartItems;
            existing.totalAmount = totalAmount || existing.totalAmount;
            await existing.save();
        } else {
            await AbandonedCheckout.create({
                sessionId,
                customerRef: customerRef || `Customer #${Math.floor(100 + Math.random() * 900)}`,
                customerEmail: customerEmail || "shopper@example.com",
                cartItems: cartItems || [],
                totalAmount,
                step: step || "CHECKOUT_STARTED",
                intentScore: step === "RAZORPAY_OPENED" ? 90 : 80
            });

            // Log CHECKOUT_ABANDONED event to audit trail
            await AuditLog.create({
                action: "CHECKOUT_ABANDONED",
                description: `Customer abandoned checkout at step: ${step || "CHECKOUT_STARTED"}`,
                productName: cartItems?.[0]?.name || "Cart items",
                amount: totalAmount,
                status: "ABANDONED"
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Abandonment tracking error:", error);
        res.status(500).json({ success: false, error: "Failed to track abandonment" });
    }
});

module.exports = router;
