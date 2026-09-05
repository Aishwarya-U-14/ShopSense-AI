import API_BASE from "./config.js";
import { useEffect, useState } from "react";
import axios from "axios";
import { CartProvider, useCart } from "./context/CartContext";
import { attachGlobalClickSounds, playClickSound } from "./utils/soundFx";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useVoiceInput } from "./hooks/useVoiceInput";
import FloatingParticles from "./components/FloatingParticles";
import SplashScreen from "./components/SplashScreen";
import QuotesTicker from "./components/QuotesTicker";
import AIChat from "./components/AIChat";
import Cart from "./components/Cart";
import GiftFinder from "./components/GiftFinder";
import VisualShopping from "./components/VisualShopping";
import ShopTheLook from "./components/ShopTheLook";
import AuditTrail from "./components/AuditTrail";
import TransactionDashboard from "./components/TransactionDashboard";
import MerchantDashboard from "./components/MerchantDashboard";
import PaymentToast from "./components/PaymentToast";
import OrbitVisualization from "./components/OrbitVisualization";


function MainApp() {
    const [showSplash, setShowSplash] = useState(true);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const { cartItems, addToCart } = useCart();

    const { isListening: isHeroListening, startListening: startHeroListening, stopListening: stopHeroListening, isSupported: isVoiceSupported } = useVoiceInput({
        onTranscript: (t) => setSearchQuery(t)
    });

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Attach global click sounds
    useEffect(() => {
        attachGlobalClickSounds();
    }, []);

    // Scroll reveal observer
    useScrollReveal(".reveal-on-scroll");

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = API_BASE + "/api/products";
            if (selectedCategory !== "all") {
                url = `http://localhost:5000/api/products/search?keyword=${selectedCategory}`;
            }
            const res = await axios.get(url);
            setProducts(res.data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const scrollTo = (id) => {
        playClickSound();
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            <PaymentToast />

            <div className={`app ${showSplash ? "app-hidden" : "app-revealed"}`}>
                {/* FLOATING BACKGROUND PARTICLES */}
                <FloatingParticles />

                {/* NAVBAR */}
                <nav className="navbar">
                    <div className="logo" onClick={() => { playClickSound(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                        🛍️ ShopSense <span className="logo-sparkle">AI</span>
                    </div>

                    <div className="nav-links">
                        <button onClick={() => scrollTo("ai-assistant")}>🤖 AI Assistant</button>
                        <button onClick={() => scrollTo("gift-finder")}>🎁 Gift Finder</button>
                        <button onClick={() => scrollTo("visual-shopping")}>📸 Visual</button>
                        <button onClick={() => scrollTo("shop-the-look")}>🎥 Shop Look</button>
                        <button onClick={() => scrollTo("audit-trail")}>📜 Audit Trail</button>
                        <button onClick={() => scrollTo("merchant-dashboard")}>📊 Merchant</button>
                        <button onClick={() => scrollTo("transactions")}>💳 Transactions</button>
                    </div>

                    <button className="cart-button glowing-btn" onClick={() => scrollTo("cart")}>
                        🛒 Cart <span className="cart-count-badge">{cartCount}</span>
                    </button>
                </nav>

                {/* HERO SECTION */}
                <section className="hero">
                    {/* Animated glow orbs */}
                    <div className="hero-orb hero-orb-1" />
                    <div className="hero-orb hero-orb-2" />
                    <div className="hero-orb hero-orb-3" />
                    {/* Dot grid pattern */}
                    <div className="hero-dot-grid" />

                    <div className="hero-content">
                        <div className="badge pulse-badge hero-badge-animate">
                            <span className="badge-dot" />
                            ✨ Autonomous AI Shopping &amp; Payment Agent
                        </div>

                        <h1 className="hero-title hero-title-animate">
                            See it.
                            <br />
                            Describe it.
                            <br />
                            <span className="gradient-text gradient-text-animate">Ask for it. Buy it.</span>
                        </h1>

                        <p className="hero-sub hero-sub-animate">
                            Shop naturally with an AI agent that understands your budget, style, and occasion.
                            <br />
                            <span className="hero-tech-badges">
                                <span className="tech-badge">MongoDB Atlas</span>
                                <span className="tech-badge">Razorpay</span>
                                <span className="tech-badge">Gemini 2.5</span>
                                <span className="tech-badge">React + Node</span>
                            </span>
                        </p>

                        <div className="search-box glowing-search hero-search-animate">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchQuery.trim()) {
                                        scrollTo("ai-assistant");
                                    }
                                }}
                                placeholder={isHeroListening ? "🔴 Listening to your voice..." : "e.g. Traditional jhumka for wedding under ₹1500..."}
                            />
                            {isVoiceSupported && (
                                <button
                                    type="button"
                                    className={`hero-mic-btn ${isHeroListening ? "listening" : ""}`}
                                    onClick={isHeroListening ? stopHeroListening : startHeroListening}
                                    title={isHeroListening ? "Listening... click to stop" : "Speak your search"}
                                >
                                    {isHeroListening ? "🔴" : "🎙️"}
                                </button>
                            )}
                            <button onClick={() => scrollTo("ai-assistant")}>
                                ✨ Ask AI
                            </button>
                        </div>

                        <div className="hero-stats hero-stats-animate">
                            <div className="hero-stat">
                                <strong>370+</strong>
                                <span>Real Products</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <strong>10</strong>
                                <span>AI Features</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <strong>₹0</strong>
                                <span>Fake Data</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <strong>Live</strong>
                                <span>Razorpay</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ORBIT VISUALIZATION — replaces feature grid */}
                <OrbitVisualization />

                {/* QUOTES TICKER */}
                <QuotesTicker />

                {/* MAIN CATALOG SECTION */}
                <section className="products-section reveal-on-scroll" id="catalog">
                    <div className="section-header">
                        <div>
                            <h2>🔥 Real Product Catalog</h2>
                            <p>Explore 370+ realistic items across Jewellery, Fashion, Beauty, Electronics &amp; Gifts in INR.</p>
                        </div>

                        <div className="category-tabs">
                            {["all", "jewellery", "fashion", "beauty", "electronics", "gifts"].map((cat) => (
                                <button
                                    key={cat}
                                    className={`cat-tab ${selectedCategory === cat ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">Loading database products...</div>
                    ) : (
                        <div className="product-grid">
                            {products.slice(0, 15).map((product) => (
                                <div className="product-card animated-card" key={product._id}>
                                    <div className="product-image">
                                        <img
                                            src={product.image || "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"}
                                            alt={product.name}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
                                            }}
                                        />
                                        <div className="popular-badge">★ {product.rating || 4.5}</div>
                                    </div>

                                    <div className="product-info">
                                        <p className="category">{product.category} • {product.style || "Classic"}</p>
                                        <h3>{product.name}</h3>
                                        <p className="description">{product.description}</p>

                                        <div className="product-bottom">
                                            <strong>₹{product.price}</strong>
                                            <button onClick={() => { addToCart(product); }}>
                                                Add +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* AI SHOPPING ASSISTANT SECTION */}
                <div id="ai-assistant" className="reveal-on-scroll">
                    <AIChat />
                </div>

                {/* SMART CART */}
                <div className="reveal-on-scroll">
                    <Cart />
                </div>

                {/* GIFT FINDER */}
                <div className="reveal-on-scroll">
                    <GiftFinder />
                </div>

                {/* VISUAL SHOPPING */}
                <div className="reveal-on-scroll">
                    <VisualShopping />
                </div>

                {/* SHOP THE LOOK */}
                <div className="reveal-on-scroll">
                    <ShopTheLook />
                </div>

                {/* AUDIT TRAIL */}
                <div className="reveal-on-scroll">
                    <AuditTrail />
                </div>

                {/* TRANSACTIONS */}
                <div className="reveal-on-scroll">
                    <TransactionDashboard />
                </div>

                {/* MERCHANT DASHBOARD */}
                <div className="reveal-on-scroll">
                    <MerchantDashboard />
                </div>

                {/* FOOTER */}
                <footer>
                    <div className="footer-logo">🛍️ ShopSense AI</div>
                    <p>"See it. Describe it. Ask for it. Buy it."</p>
                    <p className="copyright">© 2026 ShopSense AI • All Rights Reserved</p>
                </footer>
            </div>
        </>
    );
}

function App() {
    return (
        <CartProvider>
            <MainApp />
        </CartProvider>
    );
}

export default App;
