import API_BASE from "../config.js";
import { useState } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { playClickSound, playSendSound, playCartSound, playPaymentSuccessSound, playPaymentFailureSound } from "../utils/soundFx";


function VisualShopping() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const { addToCart } = useCart();

    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        playClickSound();
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setAnalysis("");
        setProducts([]);
    };

    const handleImageChange = (e) => {
        handleFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const analyzeImage = async () => {
        if (!image) {
            playAlertSound();
            alert("Please upload or drag & drop a photo first!");
            return;
        }

        playSendSound();
        setLoading(true);
        setAnalysis("");
        setProducts([]);

        try {
            const base64Image = await fileToBase64(image);

            // Call Gemini AI Image Analysis
            const geminiRes = await axios.post(API_BASE + "/api/gemini/analyze-image", {
                image: base64Image,
                mimeType: image.type || "image/jpeg"
            });

            const resultText = geminiRes.data?.analysis || "AI Analysis Completed";
            setAnalysis(resultText);

            // Extract keyword for product matching (e.g. jhumka, jewellery, handbag)
            let searchKeyword = "jewellery";
            const lowerRes = resultText.toLowerCase();
            if (lowerRes.includes("jhumka") || lowerRes.includes("earring")) searchKeyword = "jhumkas";
            else if (lowerRes.includes("handbag") || lowerRes.includes("bag")) searchKeyword = "handbags";
            else if (lowerRes.includes("lipstick") || lowerRes.includes("beauty")) searchKeyword = "lipsticks";
            else if (lowerRes.includes("earphone") || lowerRes.includes("headphone")) searchKeyword = "earphones";

            // Query MongoDB Products
            const productRes = await axios.get(API_BASE + "/api/products/search", {
                params: { keyword: searchKeyword }
            });

            setProducts(productRes.data || []);
            playSuccessSound();
        } catch (error) {
            console.error("Visual shopping error:", error);
            playAlertSound();
            alert("Visual AI analysis failed. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = async (product) => {
        playClickSound();
        try {
            await axios.post(API_BASE + "/api/audit", {
                action: "PRODUCT_SELECTED",
                description: `Visual Shopping selected ${product.name}`,
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
                name: "ShopSense Visual AI",
                description: product.name,
                order_id: order.id,

                handler: async function (paymentResponse) {
                    await axios.post(API_BASE + "/api/payments/verify-payment", {
                        ...paymentResponse,
                        productName: product.name,
                        amount: product.price
                    });

                    await axios.post(API_BASE + "/api/audit", {
                        action: "PAYMENT_SUCCESS",
                        description: `Visual purchase successful for ${product.name}`,
                        productName: product.name,
                        amount: product.price,
                        status: "SUCCESS"
                    });

                    playSuccessSound();
                    alert("✅ Payment Successful! Order placed.");
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

                theme: { color: "#7c3aed" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            playAlertSound();
        }
    };

    return (
        <section className="visual-shopping" id="visual-shopping">
            <div className="visual-header">
                <span className="section-badge">📸 VISUAL AI SEARCH</span>
                <h2>Upload Photo. <span>Find Matching Items.</span></h2>
                <p>Upload any outfit or jewellery photo and let Gemini AI understand your aesthetic to match catalog items.</p>
            </div>

            <div className="upload-card">
                <div
                    className={`upload-box ${isDragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                >
                    {preview ? (
                        <div className="preview-wrapper">
                            <img src={preview} alt="Uploaded Look" className="uploaded-image" />
                            <span className="change-photo-badge">Click or drag new photo to replace</span>
                        </div>
                    ) : (
                        <div className="empty-upload-prompt">
                            <div className="upload-icon-animated">📷</div>
                            <h3>Drag & Drop Your Outfit Photo</h3>
                            <p>or click anywhere to browse from your device</p>
                            <span className="file-types">Supports JPG, PNG, WEBP</span>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="file-input-hidden"
                    />
                </div>

                <button
                    className="analyze-button"
                    onClick={analyzeImage}
                    disabled={loading}
                >
                    {loading ? "🤖 Gemini AI is Analyzing Visuals..." : "✨ Analyze Look with Gemini AI"}
                </button>
            </div>

            {/* ANALYSIS RESULT */}
            {analysis && (
                <div className="analysis-card animate-fade-in">
                    <div className="analysis-card-header">
                        <span className="ai-icon-chip">🤖</span>
                        <h3>Gemini Vision AI Insight</h3>
                    </div>
                    <p className="analysis-body-text">{analysis}</p>
                </div>
            )}

            {/* RECOMMENDED PRODUCTS */}
            {products.length > 0 && (
                <div className="visual-results">
                    <div className="results-header-row">
                        <h3>✨ Recommended Products Matching Your Look</h3>
                        <span className="matches-pill">{products.length} catalog items matched</span>
                    </div>

                    <div className="visual-products-grid">
                        {products.map((product) => (
                            <div className="visual-product-card" key={product._id}>
                                <div className="img-container">
                                    <img
                                        src={product.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                        }}
                                    />
                                    <span className="match-tag">★ {product.rating || 4.7}</span>
                                </div>
                                <div className="product-details">
                                    <span className="subcat-chip">{product.subcategory || product.category}</span>
                                    <h4>{product.name}</h4>
                                    <p className="price-tag">₹{product.price}</p>
                                    <p className="match-reason-box">
                                        ✨ Recommended based on visual style detected in your photo.
                                    </p>
                                    <div className="action-row">
                                        <button className="btn-buy-visual" onClick={() => handleBuyNow(product)}>
                                            💳 Buy Now
                                        </button>
                                        <button className="btn-cart-visual" onClick={() => {
                                            playCartSound();
                                            addToCart(product);
                                        }}>
                                            🛒 Add
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

export default VisualShopping;