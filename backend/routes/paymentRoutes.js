const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// 1. CREATE RAZORPAY ORDER
// =====================================================

router.post("/create-order", async (req, res) => {
    try {

        const {
            amount,
            productName,
            isRetry,
            originalTransactionId
        } = req.body;

        if (!amount) {
            return res.status(400).json({
                message: "Amount is required"
            });
        }

        const options = {
            amount: Number(amount) * 100,
            currency: "INR",
            receipt: `shopsense_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order,
            productName,
            isRetry: isRetry || false,
            originalTransactionId:
                originalTransactionId || null
        });

    } catch (error) {

        console.error("Razorpay order error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order"
        });
    }
});


// =====================================================
// 2. VERIFY SUCCESSFUL PAYMENT
// =====================================================

router.post("/verify-payment", async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            productName,
            amount,
            isRetry,
            originalTransactionId
        } = req.body;


        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpay_order_id +
                "|" +
                razorpay_payment_id
            )
            .digest("hex");


        // -------------------------------------------------
        // PAYMENT VERIFICATION FAILED
        // -------------------------------------------------

        if (generatedSignature !== razorpay_signature) {

            const transaction = await Transaction.create({

                productName:
                    productName || "Unknown Product",

                amount:
                    Number(amount) || 0,

                orderId:
                    razorpay_order_id,

                paymentId:
                    razorpay_payment_id,

                status:
                    "FAILED",

                failureReason:
                    "Payment signature verification failed",

                isRetry:
                    isRetry || false,

                originalTransactionId:
                    originalTransactionId || null
            });


            return res.status(400).json({

                success: false,

                message:
                    "Payment verification failed",

                transaction
            });
        }


        // -------------------------------------------------
        // PAYMENT SUCCESS
        // -------------------------------------------------

        const transaction = await Transaction.create({

            productName:
                productName || "Unknown Product",

            amount:
                Number(amount) || 0,

            orderId:
                razorpay_order_id,

            paymentId:
                razorpay_payment_id,

            status:
                "SUCCESS",

            failureReason:
                null,

            isRetry:
                isRetry || false,

            originalTransactionId:
                originalTransactionId || null
        });


        res.json({

            success: true,

            message:
                "Payment verified successfully",

            transaction
        });


    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Payment verification failed"
        });
    }
});


// =====================================================
// 3. RECORD FAILED PAYMENT
// =====================================================

router.post("/payment-failed", async (req, res) => {
    try {

        const {
            productName,
            amount,
            razorpayOrderId,
            razorpayPaymentId,
            failureReason,
            isRetry,
            originalTransactionId
        } = req.body;


        const transaction = await Transaction.create({

            productName:
                productName || "Unknown Product",

            amount:
                Number(amount) || 0,

            orderId:
                razorpayOrderId || null,

            paymentId:
                razorpayPaymentId || null,

            status:
                "FAILED",

            failureReason:
                failureReason || "Payment failed",

            isRetry:
                isRetry || false,

            originalTransactionId:
                originalTransactionId || null
        });


        res.json({

            success: true,

            message:
                "Failed payment recorded",

            transaction
        });


    } catch (error) {

        console.error(
            "Failed payment error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to record payment failure"
        });
    }
});


// =====================================================
// 3B. RECORD CANCELLED PAYMENT (DISMISSED POPUP)
// =====================================================

router.post("/payment-cancelled", async (req, res) => {
    try {

        const {
            productName,
            amount,
            razorpayOrderId,
            isRetry,
            originalTransactionId
        } = req.body;

        const transaction = await Transaction.create({

            productName:
                productName || "Unknown Product",

            amount:
                Number(amount) || 0,

            orderId:
                razorpayOrderId || null,

            paymentId:
                null,

            status:
                "CANCELLED",

            failureReason:
                "Payment cancelled by user",

            isRetry:
                isRetry || false,

            originalTransactionId:
                originalTransactionId || null
        });

        res.json({

            success: true,

            message:
                "Cancelled payment recorded successfully",

            transaction
        });

    } catch (error) {

        console.error(
            "Cancelled payment error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to record cancelled payment"
        });
    }
});


// =====================================================
// 4. GET ALL TRANSACTIONS
// =====================================================

router.get("/transactions", async (req, res) => {
    try {

        const transactions =
            await Transaction
                .find()
                .sort({
                    createdAt: -1
                });


        res.json({

            success: true,

            transactions
        });


    } catch (error) {

        console.error(
            "Transaction fetch error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch transactions"
        });
    }
});
// =====================================================
// 5. GENERATE DEMO TRANSACTIONS
// =====================================================

router.post("/demo-transactions", async (req, res) => {
    try {

        const products = [
            {
                name: "Traditional Gold Jhumka",
                price: 799
            },
            {
                name: "Rose Matte Lipstick",
                price: 599
            },
            {
                name: "Elegant Handbag",
                price: 1299
            },
            {
                name: "Wireless Earphones",
                price: 999
            },
            {
                name: "Fast Charger",
                price: 499
            }
        ];

        const failureReasons = [
            "Insufficient funds",
            "Payment declined",
            "Network error",
            "Bank server unavailable",
            "Payment timeout"
        ];

        const demoTransactions = [];

        for (let i = 0; i < 50; i++) {

            const product =
                products[
                    Math.floor(
                        Math.random() * products.length
                    )
                ];

            const isFailed =
                Math.random() < 0.25;

            const transaction = {
                productName: product.name,

                amount: product.price,

                status: isFailed
                    ? "FAILED"
                    : "SUCCESS",

                failureReason: isFailed
                    ? failureReasons[
                        Math.floor(
                            Math.random() *
                            failureReasons.length
                        )
                    ]
                    : null,

                paymentId:
                    `demo_pay_${Date.now()}_${i}`,

                orderId:
                    `demo_order_${Date.now()}_${i}`,

                isRetry: false,

                originalTransactionId: null
            };

            demoTransactions.push(transaction);
        }


        // Insert normal transactions
        const createdTransactions =
            await Transaction.insertMany(
                demoTransactions
            );


        // Create some retry recoveries
        const failedTransactions =
            createdTransactions.filter(
                (transaction) =>
                    transaction.status === "FAILED"
            );


        const retryCount =
            Math.min(
                5,
                failedTransactions.length
            );


        for (let i = 0; i < retryCount; i++) {

            const original =
                failedTransactions[i];

            await Transaction.create({

                productName:
                    original.productName,

                amount:
                    original.amount,

                status:
                    "SUCCESS",

                failureReason:
                    null,

                paymentId:
                    `demo_retry_pay_${Date.now()}_${i}`,

                orderId:
                    `demo_retry_order_${Date.now()}_${i}`,

                isRetry:
                    true,

                originalTransactionId:
                    original._id
            });
        }


        res.json({

            success: true,

            message:
                "50 demo transactions generated successfully",

            transactionsCreated:
                50,

            retryRecoveries:
                retryCount
        });


    } catch (error) {

        console.error(
            "Demo transaction error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate demo transactions"
        });
    }
});


module.exports = router;