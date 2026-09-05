import API_BASE from "../config.js";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { playClickSound, playSendSound, playCartSound, playPaymentSuccessSound, playPaymentFailureSound } from "../utils/soundFx";
import { showSuccessToast, showFailureToast } from "./PaymentToast";
import { useVoiceInput } from "../hooks/useVoiceInput";


function AIChat() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
    const { addToCart } = useCart();

    // Voice Speech-to-Text & Speech-Synthesis Hook
    const { isListening, startListening, stopListening, isSupported, speak } = useVoiceInput({
        onTranscript: (spokenText) => {
            setInput(spokenText);
        }
    });

    // Messages history: array of { sender: 'ai'|'user', text: string, products?: [], comparisonData?: any }
    const [messages, setMessages] = useState([
        {
            sender: "ai",
            text: "Hello! 👋 I am your ShopSense AI Shopping Agent. Tell me or speak what you're looking for! For example:\n• *'I need a traditional jhumka for a wedding under ₹1500.'*\n• *'Find me a black handbag under ₹2000.'*\n• *'Gift for my sister who likes elegant jewellery.'*"
        }
    ]);

    // Payment lifecycle state
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [failureReason, setFailureReason] = useState("");
    const [paymentStatusType, setPaymentStatusType] = useState("FAILED"); // FAILED or CANCELLED
    const [retryContext, setRetryContext] = useState(null); // { product, originalTransactionId }

    // Comparison modal state
    const [activeComparison, setActiveComparison] = useState(null);

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Load Razorpay Checkout SDK
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

    // Create Audit Log Helper
    const createAuditLog = async ({ action, description, productName = null, amount = null, status = null, transactionId = null }) => {
        try {
            await axios.post(API_BASE + "/api/audit", {
                action,
                description,
                productName,
                amount,
                status,
                transactionId
            });
        } catch (error) {
            console.error("Audit log creation error:", error.message);
        }
    };

    // Handle sending user query
    const sendMessage = async (presetText = null) => {
        const textToSend = presetText || input;
        if (!textToSend.trim()) return;

        const userText = textToSend.trim();
        if (!presetText) setInput("");

        // Audit user request
        await createAuditLog({
            action: "USER_REQUEST",
            description: `User query: "${userText}"`
        });

        // Add user message to UI
        const updatedMessages = [
            ...messages,
            { sender: "user", text: userText }
        ];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // Call AI agent backend
            const response = await axios.post(API_BASE + "/api/gemini/agent-chat", {
                message: userText,
                history: updatedMessages.slice(-6) // send recent conversation context
            });

            const { replyText, products, approvedProduct, comparisonData } = response.data;

            if (approvedProduct) {
                await createAuditLog({
                    action: "AI_RECOMMENDATION",
                    description: `AI recommended ${approvedProduct.name} for ₹${approvedProduct.price}`,
                    productName: approvedProduct.name,
                    amount: approvedProduct.price
                });
            }

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text: replyText,
                    products: products || [],
                    comparisonData: comparisonData || null
                }
            ]);

            if (voiceResponseEnabled && replyText) {
                speak(replyText);
            }
        } catch (error) {
            console.error("AI agent request error:", error);
            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text: "⚠️ Sorry, I ran into an issue connecting to the ShopSense recommendation engine. Please check your backend connection."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Razorpay Payment Handler
    const handleStartPayment = async (product, retryInfo = null) => {
        if (!product) return;

        try {
            const isRetry = Boolean(retryInfo);
            const originalTxId = retryInfo?.originalTransactionId || null;

            await createAuditLog({
                action: isRetry ? "RETRY_STARTED" : "PAYMENT_STARTED",
                description: isRetry
                    ? `Retry payment attempt initiated for ${product.name} (₹${product.price})`
                    : `Payment initiated for ${product.name} (₹${product.price})`,
                productName: product.name,
                amount: product.price,
                status: "PENDING"
            });

            setPaymentFailed(false);

            // Create Order on backend
            const orderRes = await axios.post(API_BASE + "/api/payments/create-order", {
                amount: product.price,
                productName: product.name,
                isRetry,
                originalTransactionId: originalTxId
            });

            const order = orderRes.data.order;
            if (!order || !order.id) {
                alert("Unable to create Razorpay payment order.");
                return;
            }

            if (!window.Razorpay) {
                alert("Razorpay Checkout SDK is still loading. Please wait a moment.");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TXeMEnsWC9M3tl",
                amount: order.amount,
                currency: "INR",
                name: "ShopSense AI",
                description: product.name,
                order_id: order.id,

                // 1. PAYMENT SUCCESS HANDLER
                handler: async function (paymentResponse) {
                    try {
                        const verifyRes = await axios.post(API_BASE + "/api/payments/verify-payment", {
                            ...paymentResponse,
                            productName: product.name,
                            amount: product.price,
                            isRetry,
                            originalTransactionId: originalTxId
                        });

                        const transaction = verifyRes.data.transaction;

                        await createAuditLog({
                            action: "PAYMENT_SUCCESS",
                            description: `Payment verified & order completed for ${product.name}`,
                            productName: product.name,
                            amount: product.price,
                            status: "SUCCESS",
                            transactionId: transaction?._id || null
                        });

                        setPaymentFailed(false);
                        setRetryContext(null);

                        // 🎉 Play fun success melody + toast
                        playPaymentSuccessSound();
                        showSuccessToast();


                        setMessages(prev => [
                            ...prev,
                            {
                                sender: "ai",
                                text: `🎉 **Yayyy! You got it!** 🎊\nPayment of ₹${product.price} for **${product.name}** was successful!\nPayment ID: \`${paymentResponse.razorpay_payment_id}\``
                            }
                        ]);
                    } catch (err) {
                        console.error("Verification failed:", err);
                        // 😢 Play sad failure melody
                        playPaymentFailureSound();
                        setPaymentFailed(true);
                        setPaymentStatusType("FAILED");
                        setFailureReason("Signature verification failed.");
                    }
                },

                // 2. CHECKOUT POPUP DISMISSED / CANCELLED HANDLER
                modal: {
                    ondismiss: async function () {
                        console.log("Razorpay checkout window closed by user");
                        try {
                            const cancelRes = await axios.post(API_BASE + "/api/payments/payment-cancelled", {
                                productName: product.name,
                                amount: product.price,
                                razorpayOrderId: order.id,
                                isRetry,
                                originalTransactionId: originalTxId
                            });

                            const transaction = cancelRes.data.transaction;

                            await createAuditLog({
                                action: "PAYMENT_CANCELLED",
                                description: `User cancelled payment window for ${product.name}`,
                                productName: product.name,
                                amount: product.price,
                                status: "CANCELLED",
                                transactionId: transaction?._id || null
                            });

                            setPaymentFailed(true);
                            setPaymentStatusType("CANCELLED");
                            setFailureReason("Checkout window dismissed by user.");
                            setRetryContext({
                                product,
                                originalTransactionId: transaction?._id || originalTxId
                            });
                        } catch (e) {
                            console.error("Failed to record payment cancellation:", e);
                            setPaymentFailed(true);
                            setPaymentStatusType("CANCELLED");
                            setFailureReason("Checkout window dismissed by user.");
                            setRetryContext({ product, originalTransactionId: originalTxId });
                        }
                    }
                },

                theme: { color: "#7c3aed" }
            };

            const rzp = new window.Razorpay(options);

            // 3. PAYMENT FAILED EVENT HANDLER
            rzp.on("payment.failed", async function (response) {
                console.log("Razorpay payment.failed event:", response.error);
                try {
                    const failReason = response.error.description || "Payment declined by bank";
                    const failRes = await axios.post(API_BASE + "/api/payments/payment-failed", {
                        productName: product.name,
                        amount: product.price,
                        razorpayOrderId: response.error.metadata?.order_id || order.id,
                        razorpayPaymentId: response.error.metadata?.payment_id || null,
                        failureReason: failReason,
                        isRetry,
                        originalTransactionId: originalTxId
                    });

                    const transaction = failRes.data.transaction;

                    await createAuditLog({
                        action: "PAYMENT_FAILED",
                        description: `Payment failed for ${product.name}: ${failReason}`,
                        productName: product.name,
                        amount: product.price,
                        status: "FAILED",
                        transactionId: transaction?._id || null
                    });

                    // 😢 Play sad failure melody
                    playPaymentFailureSound();

                    setPaymentFailed(true);
                    setPaymentStatusType("FAILED");
                    setFailureReason(failReason);
                    setRetryContext({
                        product,
                        originalTransactionId: transaction?._id || originalTxId
                    });
                } catch (e) {
                    console.error("Error recording payment failure:", e);
                    setPaymentFailed(true);
                    setPaymentStatusType("FAILED");
                    setFailureReason(response.error.description || "Payment failed");
                    setRetryContext({ product, originalTransactionId: originalTxId });
                }
            });

            rzp.open();
        } catch (err) {
            console.error("Payment initialization error:", err);
            alert("Payment could not be started. Check connection.");
        }
    };

    return (
        <div className="chat-container">

            {/* PAYMENT FAILURE / CANCELLATION NOTICE MODAL */}
            {paymentFailed && (
                <div className="payment-alert-banner">
                    <div className="alert-content">
                        <span className="alert-icon">
                            {paymentStatusType === "CANCELLED" ? "⚠️" : "❌"}
                        </span>
                        <div>
                            <h3>
                                {paymentStatusType === "CANCELLED" ? "Payment Cancelled" : "Payment Failed"}
                            </h3>
                            <p className="reason-text">Reason: {failureReason}</p>
                            {retryContext && (
                                <p className="product-text">
                                    Item: <strong>{retryContext.product.name}</strong> (₹{retryContext.product.price})
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="alert-actions">
                        <button
                            className="btn-retry"
                            onClick={() => {
                                setPaymentFailed(false);
                                if (retryContext) {
                                    handleStartPayment(retryContext.product, retryContext);
                                }
                            }}
                        >
                            🔄 Retry Payment
                        </button>
                        <button
                            className="btn-dismiss"
                            onClick={() => setPaymentFailed(false)}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* CHAT HEADER */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="ai-avatar">🤖</div>
                    <div>
                        <h2>ShopSense AI Agent</h2>
                        <p>Contextual Product Recommendations & Comparison</p>
                    </div>
                </div>
                <div className="status-indicator">
                    <span className="dot" /> Conversational AI Active
                </div>
            </div>

            {/* CHAT MESSAGES */}
            <div className="chat-messages">
                {messages.map((item, index) => (
                    <div
                        key={index}
                        className={`message-bubble ${item.sender === "user" ? "user-bubble" : "ai-bubble"}`}
                    >
                        <div className="bubble-content">
                            <p className="message-text">{item.text}</p>

                            {/* EMBEDDED RECOMMENDED PRODUCTS */}
                            {item.products && item.products.length > 0 && (
                                <div className="embedded-products-grid">
                                    {item.products.map(product => (
                                        <div className="embedded-product-card" key={product._id}>
                                            <div className="card-media">
                                                <img
                                                    src={product.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                                    alt={product.name}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                                    }}
                                                />
                                                <span className="rating-badge">★ {product.rating || 4.5}</span>
                                            </div>
                                            <div className="card-body">
                                                <span className="card-cat">{product.category} • {product.style}</span>
                                                <h4>{product.name}</h4>
                                                <p className="card-desc">{product.description}</p>
                                                <div className="card-price-row">
                                                    <span className="price">₹{product.price}</span>
                                                    <span className="stock-info">In Stock ({product.stock})</span>
                                                </div>
                                                <div className="card-actions">
                                                    <button
                                                        className="btn-buy-now"
                                                        onClick={async () => {
                                                            await createAuditLog({
                                                                action: "PRODUCT_SELECTED",
                                                                description: `User selected ${product.name} for purchase`,
                                                                productName: product.name,
                                                                amount: product.price
                                                            });
                                                            handleStartPayment(product);
                                                        }}
                                                    >
                                                        ⚡ Buy Now
                                                    </button>
                                                    <button
                                                        className="btn-add-cart"
                                                        onClick={() => {
                                                            addToCart(product);
                                                            alert(`Added ${product.name} to cart!`);
                                                        }}
                                                    >
                                                        🛒 Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* COMPARISON VERDICT */}
                            {item.comparisonData && (
                                <div className="comparison-preview-box">
                                    <h4>📊 Side-by-Side Comparison</h4>
                                    <p>{item.comparisonData.verdict}</p>
                                    <button
                                        className="btn-view-comparison"
                                        onClick={() => setActiveComparison(item.comparisonData)}
                                    >
                                        Inspect Comparison Details
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="message-bubble ai-bubble loading-bubble">
                        <div className="typing-indicator">
                            <span /><span /><span />
                        </div>
                        <span className="typing-text">ShopSense AI is reasoning & querying products...</span>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* PRESET QUERY QUICK PILLS */}
            <div className="quick-prompts">
                <button onClick={() => sendMessage("I need a traditional jhumka for a wedding under ₹1500.")}>
                    🪔 Traditional Jhumka under ₹1500
                </button>
                <button onClick={() => sendMessage("Show me something more traditional.")}>
                    ✨ Show something more traditional
                </button>
                <button onClick={() => sendMessage("Find me a black handbag under ₹2000.")}>
                    👜 Black Handbag under ₹2000
                </button>
                <button onClick={() => sendMessage("Which one is better?")}>
                    ⚖️ Compare top recommendations
                </button>
            </div>

            {/* CHAT INPUT FORM */}
            <div className="chat-input-bar">
                {isSupported && (
                    <button
                        type="button"
                        className={`btn-voice-mic ${isListening ? "listening" : ""}`}
                        onClick={isListening ? stopListening : startListening}
                        title={isListening ? "Listening... Click to finish speaking" : "Speak to ShopSense AI"}
                    >
                        {isListening ? "🔴 Listening..." : "🎙️ Voice"}
                    </button>
                )}
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder={isListening ? "Listening to your voice..." : "Describe what you want or click 🎙️ Voice to speak..."}
                />
                <button
                    type="button"
                    className={`btn-voice-toggle ${voiceResponseEnabled ? "active" : ""}`}
                    onClick={() => setVoiceResponseEnabled(!voiceResponseEnabled)}
                    title={voiceResponseEnabled ? "Voice Speech Responses: ON" : "Voice Speech Responses: OFF"}
                >
                    {voiceResponseEnabled ? "🔊" : "🔇"}
                </button>
                <button className="btn-send" onClick={() => sendMessage()} disabled={loading || isListening}>
                    Send ➤
                </button>
            </div>

            {/* COMPARISON MODAL */}
            {activeComparison && (
                <div className="modal-backdrop" onClick={() => setActiveComparison(null)}>
                    <div className="comparison-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚖️ Detailed Product Comparison</h3>
                            <button className="btn-close" onClick={() => setActiveComparison(null)}>✕</button>
                        </div>
                        <div className="comparison-grid">
                            <div className="comp-card">
                                <h4>{activeComparison.item1.name}</h4>
                                <p className="comp-price">₹{activeComparison.item1.price}</p>
                                <p><strong>Category:</strong> {activeComparison.item1.category}</p>
                                <p><strong>Style:</strong> {activeComparison.item1.style}</p>
                                <p><strong>Occasion:</strong> {activeComparison.item1.occasion}</p>
                                <p><strong>Rating:</strong> {activeComparison.item1.rating} ★</p>
                                <p><strong>Popularity:</strong> {activeComparison.item1.popularity}/100</p>
                                <button className="btn-buy-now" onClick={() => handleStartPayment(activeComparison.item1)}>
                                    Buy {activeComparison.item1.name}
                                </button>
                            </div>
                            <div className="comp-card">
                                <h4>{activeComparison.item2.name}</h4>
                                <p className="comp-price">₹{activeComparison.item2.price}</p>
                                <p><strong>Category:</strong> {activeComparison.item2.category}</p>
                                <p><strong>Style:</strong> {activeComparison.item2.style}</p>
                                <p><strong>Occasion:</strong> {activeComparison.item2.occasion}</p>
                                <p><strong>Rating:</strong> {activeComparison.item2.rating} ★</p>
                                <p><strong>Popularity:</strong> {activeComparison.item2.popularity}/100</p>
                                <button className="btn-buy-now" onClick={() => handleStartPayment(activeComparison.item2)}>
                                    Buy {activeComparison.item2.name}
                                </button>
                            </div>
                        </div>
                        <div className="verdict-banner">
                            <strong>AI Recommendation:</strong> {activeComparison.verdict}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIChat;
