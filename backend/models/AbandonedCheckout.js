const mongoose = require("mongoose");

const abandonedCheckoutSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            index: true
        },
        customerRef: {
            type: String,
            default: "Customer #118"
        },
        customerEmail: {
            type: String,
            default: "shopper@example.com"
        },
        cartItems: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                name: String,
                price: Number,
                quantity: Number,
                image: String,
                category: String
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        step: {
            type: String,
            enum: ["CART_VIEWED", "CHECKOUT_STARTED", "RAZORPAY_OPENED", "RAZORPAY_DISMISSED"],
            default: "CHECKOUT_STARTED"
        },
        intentScore: {
            type: Number,
            default: 85
        },
        status: {
            type: String,
            enum: ["ABANDONED", "RECOVERED", "EXPIRED"],
            default: "ABANDONED"
        },
        recoveryLink: {
            type: String,
            default: null
        },
        recoveryStatus: {
            type: String,
            enum: ["NONE", "GENERATED", "PAID"],
            default: "NONE"
        },
        suggestedAction: {
            type: String,
            default: "Generate payment recovery link"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AbandonedCheckout", abandonedCheckoutSchema);
