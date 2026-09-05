const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        paymentId: {
            type: String,
            default: null
        },

        orderId: {
            type: String,
            default: null
        },

        amount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "SUCCESS",
                "FAILED",
                "PENDING",
                "CANCELLED",
                "ABANDONED"
            ],
            default: "PENDING"
        },

        failureReason: {
            type: String,
            default: null
        },

        productName: {
            type: String,
            default: null
        },

        // Customer identifier for recovery
        customerRef: {
            type: String,
            default: "Customer #101"
        },

        customerEmail: {
            type: String,
            default: "shopper@example.com"
        },

        // Recovery linkage
        recoveryLink: {
            type: String,
            default: null
        },

        recoveryStatus: {
            type: String,
            enum: ["UNATTEMPTED", "LINK_GENERATED", "RECOVERED"],
            default: "UNATTEMPTED"
        },

        diagnostics: {
            priority: { type: String, default: "HIGH" },
            action: { type: String, default: "Retry payment" },
            reason: { type: String, default: "" }
        },

        // Retry information
        isRetry: {
            type: Boolean,
            default: false
        },

        originalTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Transaction",
    transactionSchema
);