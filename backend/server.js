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

app.listen(PORT, () => {
    console.log(`🚀 ShopSense AI backend running on port ${PORT}`);
});

// Connect to MongoDB with 15s timeout
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000
    })
    .then(() => {
        console.log("✅ MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error("⚠️ MongoDB connection warning:", error.message);
        console.log("Retrying MongoDB connection...");
    });
}

