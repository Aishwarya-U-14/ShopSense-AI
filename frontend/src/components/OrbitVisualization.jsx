import { useState, useEffect, useRef } from "react";

const NODES = [
    {
        id: "ai-shopping",
        icon: "🤖",
        label: "AI Shopping",
        color: "#7c3aed",
        glow: "rgba(124,58,237,0.6)",
        desc: "Multi-turn conversational AI extracts intent, budget & style to recommend real products.",
        flow: ["🗣️ Natural Language", "🧠 AI Understands", "🔍 Searches DB", "🎯 Ranks Matches", "✅ Products Found"],
        target: "ai-assistant",
        angle: 0,
    },
    {
        id: "visual-shopping",
        icon: "📸",
        label: "Visual Search",
        color: "#0ea5e9",
        glow: "rgba(14,165,233,0.6)",
        desc: "Upload a photo — Gemini AI matches it to real catalogue items by style and color.",
        flow: ["📷 Photo Upload", "👁️ Gemini Sees", "🎨 Style Analysis", "🔍 DB Match", "🛍️ Products Shown"],
        target: "visual-shopping",
        angle: 36,
    },
    {
        id: "gift-finder",
        icon: "🎁",
        label: "Gift Finder",
        color: "#f59e0b",
        glow: "rgba(245,158,11,0.6)",
        desc: "Tell the AI who you're buying for, their interests, and budget — get curated gift suggestions.",
        flow: ["💭 Occasion Set", "👤 Profile Built", "💰 Budget Locked", "🤖 AI Curates", "🎁 Gift Ready"],
        target: "gift-finder",
        angle: 72,
    },
    {
        id: "smart-cart",
        icon: "🛡️",
        label: "Smart Cart",
        color: "#10b981",
        glow: "rgba(16,185,129,0.6)",
        desc: "Budget Guardian alerts you when over budget and finds cheaper alternatives automatically.",
        flow: ["🛒 Item Added", "💸 Budget Check", "⚠️ Over Budget?", "🤖 AI Suggests Alt", "✅ Budget Safe"],
        target: "cart",
        angle: 108,
    },
    {
        id: "razorpay",
        icon: "💳",
        label: "Razorpay Pay",
        color: "#3b82f6",
        glow: "rgba(59,130,246,0.6)",
        desc: "Secure payment processing with real Razorpay integration, order IDs and payment verification.",
        flow: ["🛒 Checkout", "📋 Order Created", "💳 Razorpay Opens", "🔐 Verifying", "🎉 Payment Done"],
        target: "cart",
        angle: 144,
    },
    {
        id: "recovery",
        icon: "🔄",
        label: "Payment Recovery",
        color: "#ef4444",
        glow: "rgba(239,68,68,0.6)",
        desc: "AI detects failed/abandoned payments and generates recovery opportunities with smart actions.",
        flow: ["❌ Payment Failed", "🤖 AI Detects", "📊 Risk Analysis", "⚡ Recovery Plan", "💰 Revenue Saved"],
        target: "merchant-dashboard",
        angle: 180,
    },
    {
        id: "merchant-ai",
        icon: "📊",
        label: "Merchant AI",
        color: "#8b5cf6",
        glow: "rgba(139,92,246,0.6)",
        desc: "AI Command Center with morning brief, anomaly detection, and revenue copilot from real data.",
        flow: ["🌅 Morning Brief", "🚨 Anomaly Alert", "📈 KPI Review", "🤖 AI Insight", "✅ Action Taken"],
        target: "merchant-dashboard",
        angle: 216,
    },
    {
        id: "revenue",
        icon: "💹",
        label: "Revenue Intel",
        color: "#06b6d4",
        glow: "rgba(6,182,212,0.6)",
        desc: "Revenue at Risk calculator, conversion funnel, smart bundles — all grounded in MongoDB data.",
        flow: ["📉 At Risk Found", "🔢 Funnel Analyzed", "📦 Bundles Built", "💡 Opportunity ID'd", "📈 Revenue Up"],
        target: "merchant-dashboard",
        angle: 252,
    },
    {
        id: "ai-audit",
        icon: "📜",
        label: "AI Audit",
        color: "#f97316",
        glow: "rgba(249,115,22,0.6)",
        desc: "Ask the AI about payment failures, recovery opportunities, and transaction journeys in plain English.",
        flow: ["❓ Question Asked", "🗄️ Logs Retrieved", "🧠 AI Analyzes", "📋 Evidence Found", "💡 Insight Given"],
        target: "audit-trail",
        angle: 288,
    },
    {
        id: "shop-the-look",
        icon: "🎥",
        label: "Shop The Look",
        color: "#ec4899",
        glow: "rgba(236,72,153,0.6)",
        desc: "Describe a video look or fashion scene — AI finds matching products from the real catalogue.",
        flow: ["🎬 Look Described", "🎨 Style Parsed", "🔍 AI Searches", "✨ Items Matched", "🛍️ Add to Cart"],
        target: "shop-the-look",
        angle: 324,
    },
];

export default function OrbitVisualization() {
    const [hoveredNode, setHoveredNode] = useState(null);
    const [clickedNode, setClickedNode] = useState(null);
    const [flowStep, setFlowStep] = useState(0);
    const [paused, setPaused] = useState(false);
    const flowRef = useRef(null);
    const orbitRef = useRef(null);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    // Animate flow steps when a node is clicked
    useEffect(() => {
        if (clickedNode) {
            setFlowStep(0);
            if (flowRef.current) clearInterval(flowRef.current);
            flowRef.current = setInterval(() => {
                setFlowStep((s) => {
                    if (s >= clickedNode.flow.length - 1) {
                        clearInterval(flowRef.current);
                        return s;
                    }
                    return s + 1;
                });
            }, 500);
        }
        return () => { if (flowRef.current) clearInterval(flowRef.current); };
    }, [clickedNode]);

    const handleNodeClick = (node) => {
        if (clickedNode?.id === node.id) {
            setClickedNode(null);
            setPaused(false);
        } else {
            setClickedNode(node);
            setFlowStep(0);
            setPaused(true);
        }
    };

    const handleOpenFeature = (targetId) => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        setClickedNode(null);
        setPaused(false);
    };

    const ORBIT_R = isMobile ? 110 : 200;
    const CENTER_SIZE = isMobile ? 80 : 120;
    const NODE_SIZE = isMobile ? 52 : 72;
    const SVG_SIZE = (ORBIT_R + NODE_SIZE) * 2 + 40;

    return (
        <section className="orbit-section">
            <div className="orbit-header">
                <div className="section-badge">✨ INTERACTIVE FEATURE MAP</div>
                <h2 className="orbit-title">ShopSense AI <span className="gradient-text">Ecosystem</span></h2>
                <p className="orbit-subtitle">Click any node to see the AI workflow in action, then explore the feature.</p>
            </div>

            <div className="orbit-wrapper" ref={orbitRef}>
                {/* SVG for orbit ring and connection lines */}
                <svg
                    className="orbit-svg"
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                    style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}
                >
                    {/* Orbit ring */}
                    <circle
                        cx={SVG_SIZE / 2}
                        cy={SVG_SIZE / 2}
                        r={ORBIT_R}
                        fill="none"
                        stroke="rgba(124,58,237,0.12)"
                        strokeWidth="1.5"
                        strokeDasharray="6 6"
                    />
                    {/* Connection lines to hovered/clicked node */}
                    {NODES.map((node) => {
                        const rad = (node.angle - 90) * (Math.PI / 180);
                        const nx = SVG_SIZE / 2 + ORBIT_R * Math.cos(rad);
                        const ny = SVG_SIZE / 2 + ORBIT_R * Math.sin(rad);
                        const isActive = hoveredNode?.id === node.id || clickedNode?.id === node.id;
                        return (
                            <line
                                key={node.id}
                                x1={SVG_SIZE / 2}
                                y1={SVG_SIZE / 2}
                                x2={nx}
                                y2={ny}
                                stroke={isActive ? node.color : "transparent"}
                                strokeWidth={isActive ? "2" : "0"}
                                strokeDasharray={isActive ? "none" : "0"}
                                style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                            />
                        );
                    })}
                </svg>

                {/* Central hub */}
                <div className="orbit-center" style={{ width: CENTER_SIZE, height: CENTER_SIZE }}>
                    <div className="orbit-center-ring" />
                    <div className="orbit-center-content">
                        <span className="orbit-center-icon">🛍️</span>
                        <span className="orbit-center-label">ShopSense AI</span>
                    </div>
                </div>

                {/* Orbiting nodes */}
                {NODES.map((node, i) => {
                    const rad = (node.angle - 90) * (Math.PI / 180);
                    const x = ORBIT_R * Math.cos(rad);
                    const y = ORBIT_R * Math.sin(rad);
                    const isHovered = hoveredNode?.id === node.id;
                    const isClicked = clickedNode?.id === node.id;
                    const isActive = isHovered || isClicked;
                    const isDimmed = (hoveredNode || clickedNode) && !isActive;

                    return (
                        /* Outer: positions node on orbit ring (no hover transform) */
                        <div
                            key={node.id}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: NODE_SIZE,
                                height: NODE_SIZE,
                                marginLeft: -NODE_SIZE / 2,
                                marginTop: -NODE_SIZE / 2,
                                transform: `translate(${x}px, ${y}px)`,
                                zIndex: isActive ? 20 : 5,
                                transition: "z-index 0s",
                            }}
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => handleNodeClick(node)}
                        >
                            {/* Inner: handles hover scale + glow */}
                            <div
                                className={`orbit-node ${isActive ? "orbit-node-active" : ""} ${isDimmed ? "orbit-node-dimmed" : ""}`}
                                style={{
                                    width: NODE_SIZE,
                                    height: NODE_SIZE,
                                    "--node-color": node.color,
                                    "--node-glow": node.glow,
                                    cursor: "pointer",
                                }}
                                title={node.label}
                            >
                                <span className="orbit-node-icon">{node.icon}</span>
                                <span className="orbit-node-label">{node.label}</span>
                            </div>

                            {/* Tooltip on hover */}
                            {isHovered && !isClicked && (
                                <div className="orbit-tooltip" style={{ borderColor: node.color }}>
                                    <strong style={{ color: node.color }}>{node.label}</strong>
                                    <p>{node.desc}</p>
                                    <span className="orbit-tooltip-hint">Click to see workflow →</span>
                                </div>
                            )}
                        </div>
                    );
                })}


                {/* Click overlay — animated flow panel */}
                {clickedNode && (
                    <div
                        className="orbit-flow-panel"
                        style={{ borderColor: clickedNode.color, boxShadow: `0 0 40px ${clickedNode.glow}` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="orbit-flow-header" style={{ color: clickedNode.color }}>
                            <span>{clickedNode.icon} {clickedNode.label}</span>
                            <button className="orbit-flow-close" onClick={() => { setClickedNode(null); setPaused(false); }}>✕</button>
                        </div>
                        <p className="orbit-flow-desc">{clickedNode.desc}</p>

                        <div className="orbit-flow-steps">
                            {clickedNode.flow.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`orbit-flow-step ${idx <= flowStep ? "orbit-flow-step-active" : ""}`}
                                    style={{ "--step-color": clickedNode.color }}
                                >
                                    <div className="orbit-flow-dot" />
                                    <span>{step}</span>
                                    {idx < clickedNode.flow.length - 1 && <div className="orbit-flow-connector" />}
                                </div>
                            ))}
                        </div>

                        {flowStep >= clickedNode.flow.length - 1 && (
                            <button
                                className="orbit-explore-btn"
                                style={{ background: clickedNode.color }}
                                onClick={() => handleOpenFeature(clickedNode.target)}
                            >
                                🚀 Explore {clickedNode.label}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile grid fallback */}
            <div className="orbit-mobile-grid">
                {NODES.map((node) => (
                    <div
                        key={node.id}
                        className="orbit-mobile-card"
                        style={{ borderColor: node.color + "40", "--node-color": node.color }}
                        onClick={() => handleOpenFeature(node.target)}
                    >
                        <span className="orbit-mobile-icon">{node.icon}</span>
                        <span className="orbit-mobile-label">{node.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
