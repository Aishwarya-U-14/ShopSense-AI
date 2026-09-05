import API_BASE from "../config.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { playPaymentSuccessSound, playPaymentFailureSound } from "../utils/soundFx";
import { showSuccessToast, showFailureToast } from "./PaymentToast";

function GiftFinder() {
    const [recipient, setRecipient] = useState("sister");
    const [occasion, setOccasion] = useState("Birthday");
    const [interest, setInterest] = useState("jewellery");
    const [budget, setBudget] = useState("1500");
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const findGift = async () => {
        setLoading(true);
        try {
            const queryText = `Gift for my ${recipient} for ${occasion} who likes ${interest} under ₹${budget}`;

            // Log audit
            await axios.post(API_BASE + "/api/audit", {
                action: "USER_REQUEST",
                description: `Gift Finder query: "${queryText}"`
            });

            const response = await axios.post(API_BASE + "/api/gemini/agent-chat", {
                message: queryText
            });

            setRecommendations(response.data.products || []);
        } catch (error) {
            console.error("Gift recommendation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyGift = async (product) => {
        try {
            await axios.post(API_BASE + "/api/audit", {
                action: "PRODUCT_SELECTED",
                description: `Gift selected: ${product.name} for ${recipient}`,
                productName: product.name,
                amount: product.price
            });

            const orderRes = await axios.post(API_BASE + "/api/payments/create-order", {
                amount: product.price,
                productName: product.name
            });

            const order = orderRes.data.order;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TXeMEnsWC9M3tl",
                amount: order.amount,
                currency: "INR",
                name: "ShopSense Gift Finder",
                description: `Gift for ${recipient}: ${product.name}`,
                order_id: order.id,

                handler: async function (paymentResponse) {
                    await axios.post(API_BASE + "/api/payments/verify-payment", {
                        ...paymentResponse,
                        productName: product.name,
                        amount: product.price
                    });

                    await axios.post(API_BASE + "/api/audit", {
                        action: "PAYMENT_SUCCESS",
                        description: `Gift payment successful for ${product.name}`,
                        productName: product.name,
                        amount: product.price,
                        status: "SUCCESS"
                    });

                    alert(`🎁 Gift order confirmed for your ${recipient}!`);
                    playPaymentSuccessSound();
                    showSuccessToast();
                },

                modal: {
                    ondismiss: async function () {
                        await axios.post(API_BASE + "/api/payments/payment-cancelled", {
                            productName: product.name,
                            amount: product.price,
                            razorpayOrderId: order.id
                        });

                        await axios.post(API_BASE + "/api/audit", {
                            action: "PAYMENT_CANCELLED",
                            description: `Gift payment cancelled for ${product.name}`,
                            productName: product.name,
                            amount: product.price,
                            status: "CANCELLED"
                        });
                    }
                },

                theme: { color: "#ec4899" }
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", async function (res) {
                await axios.post(API_BASE + "/api/payments/payment-failed", {
                    productName: product.name,
                    amount: product.price,
                    razorpayOrderId: res.error.metadata?.order_id || order.id,
                    failureReason: res.error.description || "Payment failed"
                });

                await axios.post(API_BASE + "/api/audit", {
                    action: "PAYMENT_FAILED",
                    description: `Gift payment failed for ${product.name}: ${res.error.description || "Failed"}`,
                    productName: product.name,
                    amount: product.price,
                    status: "FAILED"
                });

                alert("Payment failed. Please try again.");
                playPaymentFailureSound();
                showFailureToast();
            });

            rzp.open();
        } catch (error) {
            console.error("Gift payment error:", error);
            alert("Unable to start payment.");
        }
    };

    return (
        <section className="gift-finder-section" id="gift-finder">
            <div className="gift-header">
                <span className="section-badge">🎁 AI GIFT FINDER</span>
                <h2>Find the <span>Perfect Gift</span></h2>
                <p>Tell us who you're buying for and ShopSense AI will recommend ideal items from our database.</p>
            </div>

            <div className="gift-form-card">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Who is the gift for?</label>
                        <select value={recipient} onChange={e => setRecipient(e.target.value)}>
                            <option value="sister">Sister</option>
                            <option value="mother">Mother / Mom</option>
                            <option value="friend">Best Friend</option>
                            <option value="wife">Wife / Partner</option>
                            <option value="brother">Brother</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Occasion</label>
                        <select value={occasion} onChange={e => setOccasion(e.target.value)}>
                            <option value="Birthday">Birthday</option>
                            <option value="Wedding">Wedding</option>
                            <option value="Anniversary">Anniversary</option>
                            <option value="Festival">Festival (Diwali / Eid)</option>
                            <option value="Casual Gift">Just Because / Surprise</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Recipient Interest</label>
                        <select value={interest} onChange={e => setInterest(e.target.value)}>
                            <option value="jewellery">Traditional & Elegant Jewellery</option>
                            <option value="fashion">Bags, Scarves & Fashion Accessories</option>
                            <option value="beauty">Skincare & Beauty Hampers</option>
                            <option value="electronics">Earphones & Tech Gadgets</option>
                            <option value="gifts">Bespoke Gift Boxes & Keepsakes</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Max Budget (₹)</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={e => setBudget(e.target.value)}
                            placeholder="e.g. 1500"
                        />
                    </div>
                </div>

                <button className="btn-find-gift" onClick={findGift} disabled={loading}>
                    {loading ? "✨ AI is selecting gifts..." : "✨ Discover Ideal Gifts"}
                </button>
            </div>

            {/* RESULTS */}
            {recommendations.length > 0 && (
                <div className="gift-results-grid">
                    {recommendations.map(product => (
                        <div className="gift-card" key={product._id}>
                            <img
                                src={product.image || "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80"}
                                alt={product.name}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80";
                                }}
                            />
                            <div className="gift-card-body">
                                <h3>{product.name}</h3>
                                <p className="gift-desc">{product.description}</p>
                                <div className="gift-why-box">
                                    💡 <strong>Why this gift:</strong> Matches interest in <em>{interest}</em> for your <em>{recipient}</em> within ₹{budget} budget.
                                </div>
                                <div className="gift-card-footer">
                                    <span className="gift-price">₹{product.price}</span>
                                    <div className="button-group">
                                        <button className="btn-buy-gift" onClick={() => handleBuyGift(product)}>
                                            💳 Buy Gift Now
                                        </button>
                                        <button className="btn-add-cart-sm" onClick={() => addToCart(product)}>
                                            🛒 Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default GiftFinder;