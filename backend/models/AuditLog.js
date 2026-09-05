const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        productName: {
            type: String,
            default: null
        },

        amount: {
            type: Number,
            default: null
        },

        status: {
            type: String,
            default: null
        },

        transactionId: {
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
    "AuditLog",
    auditLogSchema
);