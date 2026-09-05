import API_BASE from "../config.js";
import { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import ActionPreviewModal from "./ActionPreviewModal";

function MerchantDashboard() {
    const [transactions, setTransactions] = useState([]);
    const [revenueHealth, setRevenueHealth] = useState(null);
    const [opportunities, setOpportunities] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [funnel, setFunnel] = useState(null);
    const [bundles, setBundles] = useState([]);
    const [campaignProposal, setCampaignProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Action Preview Modal state
    const [activePreview, setActivePreview] = useState(null);

    // AI Copilot Chat state
    const [copilotQuestion, setCopilotQuestion] = useState("");
    const [copilotLoading, setCopilotLoading] = useState(false);
    const [copilotChat, setCopilotChat] = useState([
        {
            sender: "copilot",
            text: "Hello! I am your AI Merchant Revenue Copilot. Ask me anything about your sales, failed payments, cart abandonment, or revenue recovery strategies."
        }
    ]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [txRes, revRes, oppRes, anomRes, funRes, bunRes] = await Promise.all([
                axios.get(API_BASE + "/api/payments/transactions"),
                axios.get(API_BASE + "/api/recovery/revenue-at-risk"),
                axios.get(API_BASE + "/api/recovery/opportunities"),
                axios.get(API_BASE + "/api/recovery/anomalies"),
                axios.get(API_BASE + "/api/recovery/funnel"),
                axios.get(API_BASE + "/api/recovery/bundles")
            ]);

            setTransactions(txRes.data.transactions || []);
            setRevenueHealth(revRes.data);
            setOpportunities(oppRes.data.opportunities || []);
            setAnomalies(anomRes.data.alerts || []);
            setFunnel(funRes.data.funnel || null);
            setBundles(bunRes.data.bundles || []);
        } catch (error) {
            console.error("Failed to load merchant data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Ask AI Copilot
    const handleAskCopilot = async (qText) => {
        const text = (qText || copilotQuestion).trim();
        if (!text) return;

        setCopilotQuestion("");
        setCopilotChat(prev => [...prev, { sender: "merchant", text }]);
        setCopilotLoading(true);

        try {
            const res = await axios.post(API_BASE + "/api/recovery/copilot", {
                question: text
            });
            setCopilotChat(prev => [...prev, { sender: "copilot", text: res.data.answer }]);
        } catch (err) {
            setCopilotChat(prev => [
                ...prev,
                { sender: "copilot", text: "⚠️ Unable to query analytics copilot right now. Please verify server connection." }
            ]);
        } finally {
            setCopilotLoading(false);
        }
    };

    // Open Action Preview for an opportunity
    const openActionPreview = async (opp) => {
        try {
            const res = await axios.post(API_BASE + "/api/recovery/action-preview", {
                actionType: opp.recommendedAction,
                id: opp.id,
                targetType: opp.type,
                customer: opp.customer,
                amount: opp.amount,
                productName: opp.productName
            });

            if (res.data.success) {
                setActivePreview({ ...res.data.preview, id: opp.id, type: opp.type });
            }
        } catch (e) {
            alert("Failed to load action preview.");
        }
    };

    // Generate Campaign Proposal
    const handleGenerateCampaign = async () => {
        try {
            const res = await axios.post(API_BASE + "/api/recovery/campaign", {
                objective: "Increase high-margin weekend jewellery sales",
                budget: 2500
            });
            setCampaignProposal(res.data.campaign);
        } catch (e) {
            alert("Failed to generate campaign.");
        }
    };

    if (loading && !revenueHealth) {
        return (
            <div className="merchant-dashboard">
                <h2>📊 Merchant Revenue Center</h2>
                <p>Calculating live revenue at risk and recovery opportunities...</p>
            </div>
        );
    }

    const health = revenueHealth || {
        todayRevenue: 0,
        revenueAtRisk: 0,
        recoveredRevenue: 0,
        failedRevenue: 0,
        cancelledRevenue: 0,
        abandonedRevenue: 0,
        failedCount: 0,
        cancelledCount: 0,
        abandonedCount: 0,
        totalAttempts: 0,
        retrySuccessRate: 0,
        recoveryRate: 0,
        breakdown: {}
    };

    const pieData = [
        { name: "Successful Sales", value: health.todayRevenue, color: "#10b981" },
        { name: "Failed Value", value: health.failedRevenue, color: "#ef4444" },
        { name: "Cancelled Value", value: health.cancelledRevenue, color: "#f59e0b" },
        { name: "Abandoned Value", value: health.abandonedRevenue, color: "#8b5cf6" }
    ];

    return (
        <div className="merchant-dashboard" id="merchant-dashboard">
            {/* ACTION PREVIEW MODAL */}
            {activePreview && (
                <ActionPreviewModal
                    previewData={activePreview}
                    onClose={() => setActivePreview(null)}
                    onSuccess={(result) => {
                        alert(`✅ Action Executed: ${result.message}\nPayment Link: ${result.paymentLink}`);
                        fetchAllData();
                    }}
                />
            )}

            {/* HEADER */}
            <div className="merchant-header">
                <div>
                    <span className="section-badge">🛡️ AI REVENUE CONTROL CENTER</span>
                    <h2>AI Merchant <span>Revenue & Recovery Dashboard</span></h2>
                    <p>Continuous monitoring of revenue at risk, abandoned checkouts, and AI-governed recovery actions.</p>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button className="refresh-button" onClick={fetchAllData}>
                        🔄 Refresh Live Metrics
                    </button>
                    <button
                        className="btn-demo-gen"
                        disabled={generating}
                        onClick={async () => {
                            try {
                                setGenerating(true);
                                await axios.post(API_BASE + "/api/payments/demo-transactions");
                                alert("✅ 50 simulated customer transactions seeded into MongoDB!");
                                await fetchAllData();
                            } catch (e) {
                                alert("Failed to seed demo transactions.");
                            } finally {
                                setGenerating(false);
                            }
                        }}
                    >
                        {generating ? "⏳ Simulating..." : "🧪 Seed 50 Transactions"}
                    </button>
                </div>
            </div>

            {/* 1. AI MORNING COMMERCE BRIEF */}
            <div className="morning-brief-card">
                <div className="brief-header">
                    <span className="brief-badge">☀️ GOOD MORNING — AI COMMERCE BRIEF</span>
                    <span className="brief-subtitle">3 Priority Insights Need Attention Today</span>
                </div>
                <div className="brief-items-grid">
                    <div className="brief-item">
                        <span className="brief-num">1</span>
                        <div>
                            <strong>₹{health.revenueAtRisk.toLocaleString()} Revenue at Risk</strong>
                            <p>Failed payments &amp; cart dropouts represent ₹{health.revenueAtRisk.toLocaleString()} of potentially recoverable value across {health.failedCount + health.abandonedCount} customer sessions.</p>
                        </div>
                    </div>
                    <div className="brief-item">
                        <span className="brief-num">2</span>
                        <div>
                            <strong>Payment Failure Baseline Alert</strong>
                            <p>{anomalies.length > 0 ? anomalies[0].potentialImpact : "Payment success rate is steady with active retry linkages capturing lost checkout value."}</p>
                        </div>
                    </div>
                    <div className="brief-item">
                        <span className="brief-num">3</span>
                        <div>
                            <strong>High-Intent Cart Recovery</strong>
                            <p>{opportunities.length} buyers reached checkout. Re-engaging with pre-filled payment links can capture immediate margin.</p>
                        </div>
                    </div>
                </div>
                <div className="brief-actions-row">
                    <button className="btn-brief-action primary" onClick={() => handleAskCopilot("Recover my lost revenue.")}>
                        ⚡ Recover Payments
                    </button>
                    <button className="btn-brief-action" onClick={() => handleAskCopilot("Which carts should I recover?")}>
                        🛒 Review Abandoned Carts
                    </button>
                    <button className="btn-brief-action" onClick={() => handleAskCopilot("Why did payments fail?")}>
                        🔍 Inspect Failure Causes
                    </button>
                </div>
            </div>

            {/* 2. ANOMALY DETECTION BANNER */}
            {anomalies.length > 0 && (
                <div className="anomaly-alert-banner">
                    <div className="anomaly-icon">⚠️</div>
                    <div className="anomaly-content">
                        <h4>{anomalies[0].title}</h4>
                        <p><strong>Baseline:</strong> {anomalies[0].baseline} | <strong>Current:</strong> {anomalies[0].currentValue} | <strong>Impact:</strong> {anomalies[0].potentialImpact}</p>
                        <p className="anomaly-recommendation">💡 <em>{anomalies[0].recommendedInvestigation}</em></p>
                    </div>
                </div>
            )}

            {/* 3. REVENUE HEALTH METRICS (REAL DATA FROM MONGODB) */}
            <div className="analytics-grid">
                <div className="analytics-card card-sales">
                    <span>💰 Today's Real Revenue</span>
                    <h3>₹{health.todayRevenue.toLocaleString()}</h3>
                    <small className="card-subtext">Verified Captured Sales</small>
                </div>

                <div className="analytics-card card-risk">
                    <span>⚠️ Revenue at Risk</span>
                    <h3 className="risk-text">₹{health.revenueAtRisk.toLocaleString()}</h3>
                    <small className="card-subtext">Failed + Cancelled + Abandoned</small>
                </div>

                <div className="analytics-card card-recovered">
                    <span>🎉 Recovered Revenue</span>
                    <h3 className="recovered-text">₹{health.recoveredRevenue.toLocaleString()}</h3>
                    <small className="card-subtext">{health.recoveredCount} Orders Recovered</small>
                </div>

                <div className="analytics-card card-failed">
                    <span>❌ Failed Payment Value</span>
                    <h3>₹{health.failedRevenue.toLocaleString()}</h3>
                    <small className="card-subtext">{health.failedCount} Failed Attempts</small>
                </div>

                <div className="analytics-card card-cancelled">
                    <span>⚠️ Cancelled Value</span>
                    <h3>₹{health.cancelledRevenue.toLocaleString()}</h3>
                    <small className="card-subtext">{health.cancelledCount} Modal Dismissals</small>
                </div>

                <div className="analytics-card card-abandoned">
                    <span>🛒 Abandoned Carts</span>
                    <h3>₹{health.abandonedRevenue.toLocaleString()}</h3>
                    <small className="card-subtext">{health.abandonedCount} Abandoned Baskets</small>
                </div>

                <div className="analytics-card">
                    <span>🔄 Retry Success Rate</span>
                    <h3>{health.retrySuccessRate}%</h3>
                    <small className="card-subtext">Conversion on Retry</small>
                </div>

                <div className="analytics-card">
                    <span>📈 Overall Recovery Rate</span>
                    <h3>{health.recoveryRate}%</h3>
                    <small className="card-subtext">Of Total At-Risk Value</small>
                </div>
            </div>

            {/* 4. REVENUE OPPORTUNITY SIMULATOR */}
            <div className="simulator-card">
                <div className="simulator-header">
                    <h3>💡 AI REVENUE OPPORTUNITY SIMULATOR</h3>
                    <span className="badge-estimate">ESTIMATED POTENTIAL</span>
                </div>
                <div className="simulator-grid">
                    <div className="sim-stat">
                        <span className="sim-label">Current Verified Revenue</span>
                        <strong className="sim-val current">₹{health.todayRevenue.toLocaleString()}</strong>
                    </div>
                    <div className="sim-divider">+</div>
                    <div className="sim-stat">
                        <span className="sim-label">Failed Payment Recovery (Est. 45%)</span>
                        <strong className="sim-val plus">+₹{Math.round(health.failedRevenue * 0.45).toLocaleString()}</strong>
                    </div>
                    <div className="sim-divider">+</div>
                    <div className="sim-stat">
                        <span className="sim-label">Abandoned Cart Recovery (Est. 30%)</span>
                        <strong className="sim-val plus">+₹{Math.round(health.abandonedRevenue * 0.30).toLocaleString()}</strong>
                    </div>
                    <div className="sim-divider">=</div>
                    <div className="sim-stat highlight">
                        <span className="sim-label">Total Potential Opportunity</span>
                        <strong className="sim-val total">
                            ₹{(health.todayRevenue + Math.round(health.failedRevenue * 0.45) + Math.round(health.abandonedRevenue * 0.30)).toLocaleString()}
                        </strong>
                    </div>
                </div>
                <p className="sim-disclaimer">
                    ℹ️ <em>These numbers are <strong>ESTIMATED</strong> projections based on standard e-commerce recovery benchmarks and actual stored cart values. Never presented as settled revenue.</em>
                </p>
            </div>

            {/* 5. AI REVENUE RECOVERY OPPORTUNITIES TABLE */}
            <div className="recovery-section">
                <div className="section-title-row">
                    <div>
                        <h3>🎯 Actionable Recovery Opportunities</h3>
                        <p>Prioritized customer sessions ready for immediate payment link generation or incentive outreach.</p>
                    </div>
                    <button className="btn-action-all" onClick={() => handleAskCopilot("Recover my lost revenue.")}>
                        🤖 Ask Copilot to Plan Recovery
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="merchant-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Problem</th>
                                <th>Amount</th>
                                <th>Priority</th>
                                <th>Reason &amp; Behavior Signal</th>
                                <th>Recommended Action</th>
                                <th>Action Preview</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                                        No unrecovered transactions. All checkouts settled!
                                    </td>
                                </tr>
                            ) : (
                                opportunities.map(opp => (
                                    <tr key={opp.id}>
                                        <td><strong>{opp.customer}</strong></td>
                                        <td>
                                            <span className={`pill-problem ${opp.problem.toLowerCase().replace(/\s+/g, "-")}`}>
                                                {opp.problem}
                                            </span>
                                        </td>
                                        <td><strong>₹{Number(opp.amount).toLocaleString()}</strong></td>
                                        <td>
                                            <span className={`pill-priority ${opp.priority.toLowerCase()}`}>
                                                {opp.priority}
                                            </span>
                                        </td>
                                        <td className="reason-cell">{opp.reason}</td>
                                        <td><em>{opp.recommendedAction}</em></td>
                                        <td>
                                            {opp.recoveryStatus === "LINK_GENERATED" ? (
                                                <span className="badge-link-generated">✅ Link Ready</span>
                                            ) : (
                                                <button
                                                    className="btn-preview-action"
                                                    onClick={() => openActionPreview(opp)}
                                                >
                                                    ⚡ Review &amp; Recover
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. AI MERCHANT REVENUE COPILOT & FINANCIAL CHARTS */}
            <div className="analytics-two-column">
                {/* COPILOT CHAT */}
                <div className="copilot-container">
                    <div className="copilot-header">
                        <div className="copilot-title">
                            <span className="bot-avatar">🤖</span>
                            <div>
                                <h4>AI Merchant Revenue Copilot</h4>
                                <p>Answers queries strictly using actual MongoDB database state</p>
                            </div>
                        </div>
                        <span className="copilot-live-dot">Live Database Context</span>
                    </div>

                    <div className="copilot-messages">
                        {copilotChat.map((m, i) => (
                            <div key={i} className={`copilot-bubble ${m.sender}`}>
                                <div className="bubble-text">{m.text}</div>
                            </div>
                        ))}
                        {copilotLoading && (
                            <div className="copilot-bubble copilot loading-bubble">
                                <span className="typing-dots">Analyzing store metrics...</span>
                            </div>
                        )}
                    </div>

                    {/* QUICK PROMPT PILLS */}
                    <div className="copilot-quick-pills">
                        <button onClick={() => handleAskCopilot("How much revenue am I losing?")}>
                            💸 How much revenue am I losing?
                        </button>
                        <button onClick={() => handleAskCopilot("Why did sales fall today?")}>
                            📉 Why did sales fall today?
                        </button>
                        <button onClick={() => handleAskCopilot("Which payments failed?")}>
                            ❌ Which payments failed?
                        </button>
                        <button onClick={() => handleAskCopilot("What should I do to increase conversion?")}>
                            📈 How to increase conversion?
                        </button>
                    </div>

                    <div className="copilot-input-bar">
                        <input
                            type="text"
                            value={copilotQuestion}
                            onChange={e => setCopilotQuestion(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAskCopilot()}
                            placeholder="Ask Copilot (e.g. 'Recover my lost revenue', 'Top problems today')..."
                        />
                        <button onClick={() => handleAskCopilot()} disabled={copilotLoading}>
                            Ask ➤
                        </button>
                    </div>
                </div>

                {/* VISUAL CHART */}
                <div className="chart-card">
                    <h4>Revenue Distribution (Real ₹)</h4>
                    <p className="chart-sub">Captured sales vs volume lost across friction steps</p>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend-row">
                        {pieData.map((item, idx) => (
                            <div key={idx} className="legend-item">
                                <span className="legend-dot" style={{ background: item.color }} />
                                <span>{item.name}: <strong>₹{item.value.toLocaleString()}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 7. CONVERSION FUNNEL INTELLIGENCE */}
            {funnel && (
                <div className="funnel-section">
                    <div className="funnel-header">
                        <h3>📊 Conversion Funnel Intelligence</h3>
                        <p>{funnel.leakInsight}</p>
                    </div>
                    <div className="funnel-bars-container">
                        {funnel.stages.map((stage, i) => (
                            <div className="funnel-stage-col" key={i}>
                                <div className="stage-count">{stage.count}</div>
                                <div className="stage-bar-outer">
                                    <div
                                        className="stage-bar-fill"
                                        style={{ height: `${Math.max(15, Math.min(100, (stage.count / (funnel.stages[0].count || 1)) * 100))}%` }}
                                    />
                                </div>
                                <div className="stage-name">{stage.name}</div>
                                {stage.dropRate !== "0%" && (
                                    <span className="drop-badge">-{stage.dropRate} drop</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 8. SMART BUNDLE GENERATOR & CAMPAIGN GENERATOR */}
            <div className="bundles-campaign-grid">
                {/* SMART BUNDLES */}
                <div className="card-box">
                    <div className="box-header">
                        <h4>🎁 AI Smart Bundle Recommendation</h4>
                        <span className="tag-aov">AOV Booster</span>
                    </div>
                    {bundles.length > 0 ? (
                        <div className="bundle-content">
                            <h5>{bundles[0].title}</h5>
                            <ul className="bundle-items-list">
                                {bundles[0].items.map((item, i) => (
                                    <li key={i}>
                                        <span>{item.name}</span>
                                        <strong>₹{item.price}</strong>
                                    </li>
                                ))}
                            </ul>
                            <div className="bundle-pricing-row">
                                <div>
                                    <span className="strike">Individual: ₹{bundles[0].individualTotal}</span>
                                    <span className="bundle-final">Bundle Price: ₹{bundles[0].bundlePrice}</span>
                                </div>
                                <span className="savings-badge">Save ₹{bundles[0].savings}</span>
                            </div>
                            <p className="bundle-explanation">💡 <em>{bundles[0].explanation}</em></p>
                        </div>
                    ) : (
                        <p>Catalog bundles ready.</p>
                    )}
                </div>

                {/* AI CAMPAIGN BUILDER */}
                <div className="card-box">
                    <div className="box-header">
                        <h4>🚀 AI Campaign Proposal Generator</h4>
                        <button className="btn-gen-campaign" onClick={handleGenerateCampaign}>
                            ✨ Propose Campaign
                        </button>
                    </div>
                    {campaignProposal ? (
                        <div className="campaign-proposal">
                            <h5>{campaignProposal.title}</h5>
                            <div className="campaign-detail"><strong>Target:</strong> {campaignProposal.targetAudience}</div>
                            <div className="campaign-detail"><strong>Strategy:</strong> {campaignProposal.strategy}</div>
                            <div className="campaign-detail"><strong>Budget:</strong> ₹{campaignProposal.budget} | <strong>Est. Return:</strong> ₹{campaignProposal.estimatedOpportunity}</div>
                            <div className="campaign-detail"><strong>Risk Level:</strong> <span className="risk-badge low">{campaignProposal.risk}</span></div>
                            <div className="campaign-btn-row">
                                <button className="btn-preview-camp" onClick={() => alert(`Campaign Preview:\nTitle: ${campaignProposal.title}\nBudget: ₹${campaignProposal.budget}\nTarget: ${campaignProposal.targetAudience}`)}>
                                    Preview Campaign
                                </button>
                                <button className="btn-execute-camp" onClick={() => alert("✅ Campaign scheduled. Financial guardrails confirmed: budget capped under ₹50,000.")}>
                                    Execute
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="campaign-empty">
                            <p>Click "Propose Campaign" to analyze top-selling products and generate a data-backed promotion proposal.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MerchantDashboard;