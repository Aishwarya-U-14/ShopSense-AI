const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            index: true
        },

        subcategory: {
            type: String,
            default: "",
            index: true
        },

        price: {
            type: Number,
            required: true,
            index: true
        },

        description: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        },

        colors: {
            type: [String],
            default: []
        },

        style: {
            type: String,
            default: ""
        },

        occasion: {
            type: String,
            default: ""
        },

        brand: {
            type: String,
            default: "ShopSense Select"
        },

        rating: {
            type: Number,
            default: 4.5
        },

        popularity: {
            type: Number,
            default: 85
        },

        stock: {
            type: Number,
            default: 25
        },

        tags: {
            type: [String],
            default: []
        },

        material: {
            type: String,
            default: ""
        },

        budgetTier: {
            type: String,
            enum: ["budget", "mid-range", "premium", "luxury"],
            default: "mid-range"
        },

        useCases: {
            type: [String],
            default: []
        },

        color: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Add text index for powerful text search capability
productSchema.index({
    name: "text",
    category: "text",
    subcategory: "text",
    description: "text",
    style: "text",
    occasion: "text",
    brand: "text",
    tags: "text"
});

module.exports = mongoose.model("Product", productSchema);