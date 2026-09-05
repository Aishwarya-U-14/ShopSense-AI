import API_BASE from "../config.js";
import { useState } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { playPaymentSuccessSound, playPaymentFailureSound } from "../utils/soundFx";
import { showSuccessToast, showFailureToast } from "./PaymentToast";

function Cart() {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        userBudget,
        setUserBudget,
        isOverBudget,
        remainingBudget
    } = useCart();

    const [alternatives, setAlternatives] = useState([]);
    const [loadingAlternatives, setLoadingAlternatives] = useState(false);

    // Find cheaper alternatives
    const findCheaperAlternatives = async () => {
        if (cartItems.length === 0) return;

        try {
            setLoadingAlternatives(true);
            setAlternatives([]);

            const mainCategory = cartItems[0]?.category || "jewellery";
            const response = await axios.get(API_BASE + "/api/products/search", {
                params: {
                    keyword: mainCategory,
                    maxPrice: userBudget
                }
            });

            setAlternatives(Array.isArray(response.data) ? response.data.slice(0, 4) : []);
        } catch (error) {
            console.error("Failed to find alternatives:", error);
        } finally {
            setLoadingAlternatives(false);
        }
    };

    // Handle Direct Razorpay Checkout for Cart
    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        try {
            const summaryName = cartItems.length === 1
                ? cartItems[0].name
                : `${cartItems[0].name} + ${cartItems.length - 1} more items`;

            // Audit
            await axios.post(API_BASE + "/api/audit", {
                action: "PAYMENT_STARTED",
                description: `Cart checkout initiated for ${cartItems.length} items`,
                productName: summaryName,
                amount: totalAmount,
                status: "PENDING"
            });

            // Create Order
            const response = await axios.post(API_BASE + "/api/payments/create-order", {
                amount: totalAmount,
                productName: summaryName
            });

            const order = response.data.order;
            if (!order || !order.id) {
                alert("Unable to create payment order.");
                return;
            }

            if (!window.Razorpay) {
                alert("Razorpay is loading. Please try again in a moment.");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TXeMEnsWC9M3tl",
                amount: order.amount,
                currency: "INR",
                name: "ShopSense AI",
                description: summaryName,
                order_id: order.id,

                handler: async function (paymentResponse) {
                    try {
                        const verifyRes = await axios.post(API_BASE + "/api/payments/verify-payment", {
                            ...paymentResponse,
                            productName: summaryName,
                            amount: totalAmount
                        });

                        await axios.post(API_BASE + "/api/audit", {
                            action: "PAYMENT_SUCCESS",
                            description: `Cart checkout completed successfully!`,
                            productName: summaryName,
                            amount: totalAmount,
                            status: "SUCCESS",
                            transactionId: verifyRes.data.transaction?._id || null
                        });

                        alert("✅ Cart Payment Successful! Thank you for shopping with ShopSense AI.");
                        playPaymentSuccessSound();
                        showSuccessToast();
                        clearCart();
                    } catch (e) {
                        alert("Payment verification failed.");
                        playPaymentFailureSound();
                        showFailureToast();
                    }
                },

                modal: {
                    ondismiss: async function () {
                        // Track cancellation
                        await axios.post(API_BASE + "/api/payments/payment-cancelled", {
                            productName: summaryName,
                            amount: totalAmount,
                            razorpayOrderId: order.id
                        });

                        // Track abandoned checkout behavior for Revenue Recovery
                        try {
                            await axios.post(API_BASE + "/api/recovery/track-abandonment", {
                                sessionId: `sess_${Date.now()}`,
                                cartItems: cartItems.map(i => ({ productId: i._id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, category: i.category })),
                                totalAmount,
                                step: "RAZORPAY_DISMISSED"
                            });
                        } catch (e) {}

                        await axios.post(API_BASE + "/api/audit", {
                            action: "PAYMENT_CANCELLED",
                            description: `Cart checkout cancelled by user`,
                            productName: summaryName,
                            amount: totalAmount,
                            status: "CANCELLED"
                        });

                        alert("Cart checkout was cancelled.");
                    }
                },

                theme: { color: "#7c3aed" }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", async function (res) {
                await axios.post(API_BASE + "/api/payments/payment-failed", {
                    productName: summaryName,
                    amount: totalAmount,
                    razorpayOrderId: res.error.metadata?.order_id || order.id,
                    failureReason: res.error.description || "Payment failed"
                });

                await axios.post(API_BASE + "/api/audit", {
                    action: "PAYMENT_FAILED",
                    description: `Cart checkout failed: ${res.error.description || "Payment failed"}`,
                    productName: summaryName,
                    amount: totalAmount,
                    status: "FAILED"
                });

                alert(`Payment failed: ${res.error.description || "Declined"}`);
                playPaymentFailureSound();
                showFailureToast();
            });

            rzp.open();
        } catch (err) {
            console.error("Cart checkout error:", err);
            alert("Unable to process checkout.");
        }
    };

    return (
        <section className="cart-section" id="cart">
            <div className="cart-header">
                <span className="section-badge">🛒 SMART CART</span>
                <h2>Your Shopping <span>Cart</span></h2>
                <p>Manage items, monitor your budget guardian, and proceed directly to payment.</p>
            </div>

            {cartItems.length === 0 ? (
                <div className="cart-empty-box">
                    <div className="empty-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Discover products in our catalog or ask ShopSense AI to find items for you.</p>
                </div>
            ) : (
                <div className="cart-layout">
                    {/* CART ITEMS LIST */}
                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div className="cart-item-card" key={item._id}>
                                <img
                                    src={item.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                    alt={item.name}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                    }}
                                />
                                <div className="cart-item-info">
                                    <span className="item-cat">{item.category}</span>
                                    <h3>{item.name}</h3>
                                    <p className="item-price">₹{item.price}</p>
                                    <div className="qty-controls">
                                        <button onClick={() => updateQuantity(item._id, -1)}>−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                                    </div>
                                </div>
                                <button className="btn-remove" onClick={() => removeFromCart(item._id)}>
                                    🗑 Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* CART SUMMARY & BUDGET GUARDIAN */}
                    <div className="cart-summary-panel">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Total Items</span>
                            <strong>{cartItems.reduce((sum, i) => sum + i.quantity, 0)}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <strong>₹{totalAmount}</strong>
                        </div>
                        <hr />
                        <div className="summary-row total-row">
                            <span>Grand Total</span>
                            <strong className="grand-price">₹{totalAmount}</strong>
                        </div>

                        {/* BUDGET GUARDIAN CARD */}
                        <div className="budget-guardian-card">
                            <h4>🛡️ Budget Guardian</h4>
                            <div className="budget-input-row">
                                <label>Target Budget (₹):</label>
                                <input
                                    type="number"
                                    value={userBudget}
                                    onChange={(e) => setUserBudget(Number(e.target.value) || 0)}
                                />
                            </div>

                            {isOverBudget ? (
                                <div className="budget-status over-budget">
                                    <p>⚠️ Your cart total is <strong>₹{Math.abs(remainingBudget)}</strong> over your target budget!</p>
                                    <button
                                        className="btn-find-cheaper"
                                        onClick={findCheaperAlternatives}
                                        disabled={loadingAlternatives}
                                    >
                                        {loadingAlternatives ? "Searching..." : "🔎 Find Cheaper Alternatives"}
                                    </button>
                                </div>
                            ) : (
                                <div className="budget-status within-budget">
                                    <p>✅ Within budget! <strong>₹{remainingBudget}</strong> balance remaining.</p>
                                </div>
                            )}

                            {/* ALTERNATIVE RECOMMENDATIONS */}
                            {alternatives.length > 0 && (
                                <div className="cart-alternatives-grid">
                                    <h5>💡 Cheaper AI Recommendations</h5>
                                    {alternatives.map(alt => (
                                        <div className="alt-item-card" key={alt._id}>
                                            <img
                                                src={alt.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                                alt={alt.name}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                                }}
                                            />
                                            <div>
                                                <h6>{alt.name}</h6>
                                                <span>₹{alt.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DIRECT CHECKOUT BUTTON */}
                        <button className="btn-checkout" onClick={handleCheckout}>
                            ⚡ Pay ₹{totalAmount} with Razorpay
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Cart;