const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
});

// Create a product
router.post("/", async (req, res) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
});

// Budget-aware product search
router.get("/search", async (req, res) => {
    try {
        const { keyword, maxPrice } = req.query;

        let filter = {};

        // Search product information
        if (keyword) {
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { category: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { style: { $regex: keyword, $options: "i" } }
            ];
        }

        // Apply maximum budget
        if (maxPrice) {
            filter.price = {
                $lte: Number(maxPrice)
            };
        }

        const products = await Product.find(filter);

        res.json(products);

    } catch (error) {
        console.error("Product search error:", error);

        res.status(500).json({
            message: "Product search failed",
            error: error.message
        });
    }
});

module.exports = router;