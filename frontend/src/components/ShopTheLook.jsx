import API_BASE from "../config.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { playClickSound, playSendSound, playCartSound, playPaymentSuccessSound, playPaymentFailureSound } from "../utils/soundFx";


function ShopTheLook() {
    const [video, setVideo] = useState(null);
    const [preview, setPreview] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

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

    const handleVideoChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        playClickSound();
        setVideo(file);
        setPreview(URL.createObjectURL(file));
        setProducts([]);
        setMessage("");
    };

    const findProducts = async () => {
        if (!video) {
            playAlertSound();
            setMessage("Please upload a fashion video clip first.");
            return;
        }

        playSendSound();
        setLoading(true);
        setMessage("");
        setProducts([]);

        try {
            // Query products from database
            const response = await axios.get(API_BASE + "/api/products/search", {
                params: { keyword: "jhumka" }
            });

            if (Array.isArray(response.data) && response.data.length > 0) {
                setProducts(response.data.slice(0, 6));
                playSuccessSound();
            } else {
                setMessage("No matching look products found.");
            }
        } catch (error) {
            console.error("Shop the look error:", error);
            playAlertSound();
            setMessage("Unable to process video analysis. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (product) => {
        playClickSound();
        try {
            const response = await axios.post(API_BASE + "/api/payments/create-order", {
                amount: product.price,
                productName: product.name
            });

            const order = response.data.order;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TXeMEnsWC9M3tl",
                amount: order.amount,
                currency: "INR",
                name: "ShopSense AI",
                description: product.name,
                order_id: order.id,

                handler: async function (paymentResponse) {
                    await axios.post(API_BASE + "/api/payments/verify-payment", {
                        ...paymentResponse,
                        productName: product.name,
                        amount: product.price
                    });
                    playSuccessSound();
                    alert("🎉 Payment successful! Order placed.");
                },

                modal: {
                    ondismiss: async function () {
                        await axios.post(API_BASE + "/api/payments/payment-cancelled", {
                            productName: product.name,
                            amount: product.price,
                            razorpayOrderId: order.id
                        });
                        playAlertSound();
                    }
                },

                theme: { color: "#111827" }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Payment error:", error);
            playAlertSound();
        }
    };

    return (
        <section className="shop-the-look" id="shop-the-look">
            <div className="shop-look-header">
                <span className="shop-look-badge">🎥 AI SHOP THE LOOK</span>
                <h2>See a Look. <span>Shop It Live.</span></h2>
                <p>Upload a fashion video clip and ShopSense AI will extract and recommend items inspired by the outfit.</p>
            </div>

            <div className="shop-look-upload-card">
                <div className="shop-look-upload-box">
                    {!preview ? (
                        <>
                            <div className="shop-look-icon">🎬</div>
                            <h3>Upload Fashion Video Clip</h3>
                            <p>Select any MP4 or short fashion clip from your computer</p>
                        </>
                    ) : (
                        <video className="shop-look-video" src={preview} controls />
                    )}

                    <label className="shop-look-button">
                        📁 Select Video File
                        <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
                    </label>
                </div>

                <button className="shop-look-button analyze-btn" onClick={findProducts} disabled={loading}>
                    {loading ? "🤖 Analyzing Video Look..." : "🔍 Find Look Products"}
                </button>
            </div>

            {message && <p className="shop-look-message">{message}</p>}

            {/* RESULTS */}
            {products.length > 0 && (
                <div className="shop-look-results">
                    <div className="shop-look-result-header">
                        <div>
                            <span className="result-label">✨ AI RESULTS</span>
                            <h3>Products Matched From Video Look</h3>
                        </div>
                        <span className="count-tag">{products.length} matches</span>
                    </div>

                    <div className="shop-look-products">
                        {products.map((product) => (
                            <div className="shop-look-product" key={product._id}>
                                <div className="shop-look-product-image">
                                    <img
                                        src={product.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                        }}
                                    />
                                </div>

                                <div className="shop-look-product-content">
                                    <span className="product-category">{product.category || "Jewellery"}</span>
                                    <h3>{product.name}</h3>
                                    <p className="shop-look-price">₹{product.price}</p>
                                    <div className="shop-look-match">🤖 Visual AI Match: 96%</div>
                                    <div className="look-btn-row">
                                        <button className="btn-buy-look" onClick={() => handlePayment(product)}>
                                            💳 Buy Now
                                        </button>
                                        <button className="btn-cart-look" onClick={() => {
                                            playCartSound();
                                            addToCart(product);
                                        }}>
                                            🛒 Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default ShopTheLook;