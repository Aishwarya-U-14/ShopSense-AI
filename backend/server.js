const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const auditRoutes = require("./routes/auditRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

/* Middleware */
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "20mb" }));

// Serverless DB connection caching
let cachedDbPromise = null;
const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (!cachedDbPromise) {
        cachedDbPromise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000
        }).catch(err => {
            cachedDbPromise = null;
            throw err;
        });
    }
    return cachedDbPromise;
};

app.use(async (req, res, next) => {
    if (req.path === "/") return next();
    try {
        await connectToDatabase();
    } catch (err) {
        console.error("DB connection error:", err.message);
    }
    next();
});

/* Routes */

app.use("/api/audit", auditRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/recovery", recoveryRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "ShopSense AI Backend is running!",
        mongoStatus: mongoose.connection.readyState === 1 ? "Connected" : "Connecting/Disconnected"
    });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    connectToDatabase()
        .then(() => console.log("✅ MongoDB connected successfully!"))
        .catch(err => console.error("⚠️ MongoDB connection warning:", err.message));

    app.listen(PORT, () => {
        console.log(`🚀 ShopSense AI backend running on port ${PORT}`);
    });
}

module.exports = app;

