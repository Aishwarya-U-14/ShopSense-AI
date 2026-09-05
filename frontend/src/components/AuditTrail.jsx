import API_BASE from "../config.js";
import { useEffect, useState } from "react";
import axios from "axios";
import ActionPreviewModal from "./ActionPreviewModal";

function AuditTrail() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // AI Audit Analysis state
    const [query, setQuery] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showTimeline, setShowTimeline] = useState(true);

    // Action Preview modal state (connect recommendations to guardrail preview)
    const [previewData, setPreviewData] = useState(null);

    const fetchAuditLogs = async () => {
        try {
            const res = await axios.get(API_BASE + "/api/audit");
            setAuditLogs(res.data.logs || []);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
        const interval = setInterval(fetchAuditLogs, 4000);
        return () => clearInterval(interval);
    }, []);

    // Initial audit analysis on load
    useEffect(() => {
        runAuditAnalysis("Analyze my recent payment failures and recovery opportunities");
    }, []);

    const runAuditAnalysis = async (userQuery) => {
        const q = (userQuery || query).trim();
        if (!q) return;

        setAnalyzing(true);
        try {
            const res = await axios.post(API_BASE + "/api/audit/analyze", {
                query: q
            });
            if (res.data.success) {
                setAnalysisResult(res.data.analysis);
            }
        } catch (err) {
            console.error("Audit analysis error:", err);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleOpenActionPreview = () => {
        if (!analysisResult?.actionCandidate) {
            alert("No specific target customer found in current analysis.");
            return;
        }

        const cand = analysisResult.actionCandidate;
        setPreviewData({
            action: cand.actionType || "Generate payment recovery link",
            customer: cand.customer || "Customer #102",
            amount: cand.amount || 2499,
            productName: cand.productName || "Cart Items",
            reason: analysisResult.whatHappened,
            whyAmIDoingThis: analysisResult.aiInterpretation,
            risk: analysisResult.priority === "CRITICAL" ? "MEDIUM" : "LOW",
            expectedResult: "Dispatches a dedicated, pre-filled Razorpay payment link to customer, enabling single-click payment retry.",
            id: cand.id,
            type: cand.type || "TRANSACTION"
        });
    };

    const getActionBadge = (action) => {
        switch (action) {
            case "USER_REQUEST":
                return { label: "💬 USER REQUEST", color: "#3b82f6", bg: "#eff6ff" };
            case "AI_INTENT_DETECTED":
                return { label: "🧠 AI INTENT DETECTED", color: "#6366f1", bg: "#eef2ff" };
            case "PRODUCT_RETRIEVED":
                return { label: "🔍 PRODUCT RETRIEVED", color: "#0ea5e9", bg: "#f0f9ff" };
            case "AI_RECOMMENDATION":
                return { label: "🤖 AI RECOMMENDATION", color: "#8b5cf6", bg: "#f5f3ff" };
            case "PRODUCT_SELECTED":
                return { label: "🎯 PRODUCT SELECTED", color: "#0284c7", bg: "#f0f9ff" };
            case "CART_CREATED":
                return { label: "🛒 CART CREATED", color: "#14b8a6", bg: "#f0fdfa" };
            case "PAYMENT_STARTED":
                return { label: "💳 PAYMENT STARTED", color: "#d97706", bg: "#fffbeb" };
            case "PAYMENT_FAILED":
                return { label: "❌ PAYMENT FAILED", color: "#dc2626", bg: "#fef2f2" };
            case "PAYMENT_CANCELLED":
                return { label: "⚠️ PAYMENT CANCELLED", color: "#f59e0b", bg: "#fffbeb" };
            case "CHECKOUT_ABANDONED":
                return { label: "🚪 CHECKOUT ABANDONED", color: "#d946ef", bg: "#fdf4ff" };
            case "AI_RECOVERY_ANALYSIS":
                return { label: "🔬 RECOVERY ANALYSIS", color: "#8b5cf6", bg: "#f5f3ff" };
            case "RECOVERY_RECOMMENDED":
                return { label: "💡 RECOVERY RECOMMENDED", color: "#f97316", bg: "#fff7ed" };
            case "ACTION_PREVIEW":
                return { label: "🛡️ ACTION PREVIEW", color: "#059669", bg: "#ecfdf5" };
            case "ACTION_APPROVED":
                return { label: "✍️ ACTION APPROVED", color: "#047857", bg: "#d1fae5" };
            case "ACTION_EXECUTED":
                return { label: "⚡ ACTION EXECUTED", color: "#10b981", bg: "#ecfdf5" };
            case "PAYMENT_RETRY_STARTED":
            case "RETRY_STARTED":
                return { label: "🔄 RETRY STARTED", color: "#ea580c", bg: "#fff7ed" };
            case "PAYMENT_SUCCESS":
                return { label: "✅ PAYMENT SUCCESS", color: "#16a34a", bg: "#f0fdf4" };
            case "REVENUE_RECOVERED":
                return { label: "🎉 REVENUE RECOVERED", color: "#15803d", bg: "#dcfce7" };
            default:
                return { label: action, color: "#6b7280", bg: "#f3f4f6" };
        }
    };

    return (
        <section className="audit-section" id="audit-trail">
            {/* ACTION PREVIEW MODAL */}
            {previewData && (
                <ActionPreviewModal
                    previewData={previewData}
                    onClose={() => setPreviewData(null)}
                    onSuccess={(res) => {
                        alert(`✅ Action Executed: ${res.message}\nLink: ${res.paymentLink}`);
                        fetchAuditLogs();
                        runAuditAnalysis(query || "Analyze my recent payment failures");
                    }}
                />
            )}

            {/* HEADER */}
            <div className="audit-header">
                <div>
                    <span className="section-badge">📜 AI AUDIT TRAIL &amp; INTELLIGENCE</span>
                    <h2>Live <span>Audit Trail &amp; AI Analysis</span></h2>
                    <p>End-to-end evidence log with AI interpretation of transactions, failures, and recovery steps.</p>
                </div>
                <button className="refresh-button" onClick={fetchAuditLogs}>
                    🔄 Refresh Audit Trail
                </button>
            </div>

            {/* AI AUDIT ANALYSIS PANEL */}
            <div className="audit-ai-card">
                <div className="audit-ai-header">
                    <div className="ai-title-row">
                        <span className="ai-avatar-badge">🧠</span>
                        <div>
                            <h3>AI Audit Analysis</h3>
                            <p>Ask the AI to interpret evidence, detect drop-off causes, and calculate revenue impacts.</p>
                        </div>
                    </div>
                    <span className="grounding-badge">🔒 100% Grounded in MongoDB</span>
                </div>

                {/* PROMPT PILLS */}
                <div className="audit-pills-row">
                    <button onClick={() => { setQuery("Analyze payment failures"); runAuditAnalysis("Analyze payment failures"); }}>
                        🔍 Analyze payment failures
                    </button>
                    <button onClick={() => { setQuery("Find revenue at risk"); runAuditAnalysis("Find revenue at risk"); }}>
                        💸 Find revenue at risk
                    </button>
                    <button onClick={() => { setQuery("Explain today's activity"); runAuditAnalysis("Explain today's activity"); }}>
                        📜 Explain today's activity
                    </button>
                    <button onClick={() => { setQuery("Find recovery opportunities"); runAuditAnalysis("Find recovery opportunities"); }}>
                        🎯 Find recovery opportunities
                    </button>
                    <button onClick={() => { setQuery("What problems do you see?"); runAuditAnalysis("What problems do you see?"); }}>
                        🚨 What problems do you see?
                    </button>
                </div>

                {/* SEARCH INPUT BAR */}
                <div className="audit-input-bar">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && runAuditAnalysis()}
                        placeholder="Ask the AI about your audit history (e.g. 'Analyze my recent payment failures', 'Why am I losing revenue?')..."
                    />
                    <button
                        className="btn-audit-analyze"
                        onClick={() => runAuditAnalysis()}
                        disabled={analyzing}
                    >
                        {analyzing ? "Analyzing Evidence..." : "Analyze ➤"}
                    </button>
                </div>

                {/* ANALYSIS RESULTS DISPLAY */}
                {analysisResult && (
                    <div className="audit-analysis-content">
                        {/* 1. WHAT HAPPENED & INTERPRETATION */}
                        <div className="analysis-grid-row">
                            <div className="analysis-box finding-box">
                                <span className="box-tag">💡 AI Finding — What Happened</span>
                                <h4>{analysisResult.whatHappened}</h4>
                                <p className="interpretation-text">
                                    <strong>AI Interpretation:</strong> {analysisResult.aiInterpretation}
                                </p>
                            </div>

                            <div className="analysis-box risk-box">
                                <span className="box-tag">🛡️ Priority &amp; Risk Assessment</span>
                                <div className="priority-row">
                                    <span className={`priority-pill ${analysisResult.priority?.toLowerCase()}`}>
                                        {analysisResult.priority || "MEDIUM"} PRIORITY
                                    </span>
                                </div>
                                <p className="priority-desc">{analysisResult.priorityExplanation}</p>

                                <div className="action-recommendation-block">
                                    <span className="rec-label">Recommended Action:</span>
                                    <p className="rec-text">{analysisResult.recommendedAction}</p>
                                    {analysisResult.actionCandidate && (
                                        <button
                                            className="btn-guardrail-preview"
                                            onClick={handleOpenActionPreview}
                                        >
                                            ⚡ Review in Action Guardrail Preview
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. REVENUE IMPACT (ACTUAL / ESTIMATED / POTENTIAL) */}
                        {analysisResult.revenueImpact && (
                            <div className="revenue-impact-panel">
                                <div className="impact-header">
                                    <span className="impact-tag">💰 REVENUE IMPACT BREAKDOWN</span>
                                    <span className="impact-note">Strictly grounded in database transactions</span>
                                </div>
                                <div className="impact-cards-grid">
                                    <div className="impact-card actual">
                                        <span className="badge-tag actual-tag">ACTUAL REVENUE LOST</span>
                                        <strong>₹{Number(analysisResult.revenueImpact.actual || 0).toLocaleString()}</strong>
                                        <small>Verified Failed &amp; Cancelled Orders</small>
                                    </div>
                                    <div className="impact-card estimated">
                                        <span className="badge-tag est-tag">ESTIMATED RECOVERABLE</span>
                                        <strong>₹{Number(analysisResult.revenueImpact.estimated || 0).toLocaleString()}</strong>
                                        <small>Projected Capture via Links</small>
                                    </div>
                                    <div className="impact-card potential">
                                        <span className="badge-tag pot-tag">POTENTIAL TOTAL OPPORTUNITY</span>
                                        <strong>₹{Number(analysisResult.revenueImpact.potential || 0).toLocaleString()}</strong>
                                        <small>Full Basket &amp; Cart Salvage</small>
                                    </div>
                                </div>
                                <p className="impact-explanation">
                                    ℹ️ {analysisResult.revenueImpact.explanation}
                                </p>
                            </div>
                        )}

                        {/* 3. EVIDENCE REFERENCES */}
                        {analysisResult.evidence && analysisResult.evidence.length > 0 && (
                            <div className="evidence-section">
                                <div className="evidence-header">
                                    <h4>📑 Retrieved Database Evidence ({analysisResult.evidence.length} Records)</h4>
                                </div>
                                <div className="evidence-table-wrapper">
                                    <table className="evidence-table">
                                        <thead>
                                            <tr>
                                                <th>Event / Status</th>
                                                <th>Transaction / Ref ID</th>
                                                <th>Product</th>
                                                <th>Amount</th>
                                                <th>Logged Time</th>
                                                <th>Provider Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysisResult.evidence.map((ev, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <span className={`status-pill status-${(ev.status || "failed").toLowerCase()}`}>
                                                            {ev.status || ev.event}
                                                        </span>
                                                    </td>
                                                    <td><code>{ev.id ? String(ev.id).slice(-8) : "N/A"}</code></td>
                                                    <td><strong>{ev.product || "Cart Item"}</strong></td>
                                                    <td><strong>₹{Number(ev.amount || 0).toLocaleString()}</strong></td>
                                                    <td>{ev.time || "Recent"}</td>
                                                    <td className="reason-text-cell">{ev.reason || "The payment provider did not provide a detailed failure reason."}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 4. EXPANDABLE AUDIT TIMELINE */}
                        {analysisResult.auditTimeline && (
                            <div className="audit-sequence-section">
                                <div className="sequence-header" onClick={() => setShowTimeline(!showTimeline)}>
                                    <h4>
                                        ⏱️ Audit Timeline ({analysisResult.auditTimeline.length} Chronological Steps)
                                    </h4>
                                    <button className="btn-toggle-timeline">
                                        {showTimeline ? "▲ Collapse Timeline" : "▼ Expand Timeline"}
                                    </button>
                                </div>

                                {showTimeline && (
                                    <div className="sequence-steps-container">
                                        {analysisResult.auditTimeline.map((step, idx) => {
                                            const badge = getActionBadge(step.action);
                                            return (
                                                <div className="sequence-step-item" key={idx}>
                                                    <div className="sequence-step-num">{step.step || idx + 1}</div>
                                                    <div className="sequence-step-card">
                                                        <div className="step-card-top">
                                                            <span className="action-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                                                                {badge.label}
                                                            </span>
                                                            <span className="step-time">{step.timestamp}</span>
                                                        </div>
                                                        <p className="step-desc">{step.description}</p>
                                                        {(step.productName || step.amount) && (
                                                            <div className="step-meta">
                                                                {step.productName && <span>🛍️ {step.productName}</span>}
                                                                {step.amount && <span>💰 ₹{step.amount}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RAW CHRONOLOGICAL AUDIT TRAIL LOGS */}
            <div className="raw-audit-header">
                <h3>📜 Chronological System Events</h3>
                <p>Complete unedited audit log emitted across all client and backend operations.</p>
            </div>

            {loading ? (
                <div className="loading-state">Loading AI Audit Log...</div>
            ) : auditLogs.length === 0 ? (
                <div className="audit-empty">
                    <p>📭 No audit events recorded yet. Try asking ShopSense AI for products or starting a payment!</p>
                </div>
            ) : (
                <div className="timeline-container">
                    <div className="timeline-line" />
                    {auditLogs.map((log) => {
                        const badge = getActionBadge(log.action);
                        return (
                            <div className="timeline-item" key={log._id}>
                                <div className="timeline-dot" style={{ backgroundColor: badge.color }} />
                                <div className="timeline-card">
                                    <div className="timeline-card-header">
                                        <span className="action-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                                            {badge.label}
                                        </span>
                                        <span className="timeline-time">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="timeline-desc">{log.description}</p>

                                    {(log.productName || log.amount) && (
                                        <div className="timeline-meta">
                                            {log.productName && <span>🛍️ <strong>{log.productName}</strong></span>}
                                            {log.amount && <span>💰 <strong>₹{log.amount}</strong></span>}
                                            {log.status && (
                                                <span className={`status-pill status-${log.status.toLowerCase()}`}>
                                                    {log.status}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default AuditTrail;
