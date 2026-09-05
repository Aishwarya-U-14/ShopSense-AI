import API_BASE from "../config.js";
import { useEffect, useState } from "react";
import axios from "axios";

function TransactionDashboard() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(API_BASE + "/api/payments/transactions");
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter((t) => t.status === "SUCCESS");
    const failedTransactions = transactions.filter((t) => t.status === "FAILED");
    const cancelledTransactions = transactions.filter((t) => t.status === "CANCELLED");

    const successCount = successfulTransactions.length;
    const failedCount = failedTransactions.length;
    const cancelledCount = cancelledTransactions.length;

    const successRate = totalTransactions > 0
        ? ((successCount / totalTransactions) * 100).toFixed(1)
        : 0;

    const successfulValue = successfulTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const failedValue = failedTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const cancelledValue = cancelledTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    if (loading) {
        return (
            <div className="transaction-dashboard">
                <h1>Transaction Center</h1>
                <p>Loading transaction database records...</p>
            </div>
        );
    }

    return (
        <div className="transaction-dashboard" id="transactions">
            {/* HEADER */}
            <div className="transaction-header">
                <div>
                    <span className="section-badge">📊 TRANSACTION CENTER</span>
                    <h1>Customer Transaction <span>History & Status</span></h1>
                    <p>Audit history of all Razorpay payments, failure diagnostics, and user cancellations.</p>
                </div>
                <button className="refresh-button" onClick={fetchTransactions}>
                    🔄 Refresh Records
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="transaction-stats">
                <div className="transaction-card">
                    <span className="transaction-icon">📊</span>
                    <div>
                        <p>Total Attempts</p>
                        <h2>{totalTransactions}</h2>
                    </div>
                </div>

                <div className="transaction-card">
                    <span className="transaction-icon">✅</span>
                    <div>
                        <p>Successful</p>
                        <h2>{successCount}</h2>
                    </div>
                </div>

                <div className="transaction-card">
                    <span className="transaction-icon">❌</span>
                    <div>
                        <p>Failed</p>
                        <h2>{failedCount}</h2>
                    </div>
                </div>

                <div className="transaction-card">
                    <span className="transaction-icon">⚠️</span>
                    <div>
                        <p>Cancelled</p>
                        <h2>{cancelledCount}</h2>
                    </div>
                </div>

                <div className="transaction-card">
                    <span className="transaction-icon">📈</span>
                    <div>
                        <p>Success Rate</p>
                        <h2>{successRate}%</h2>
                    </div>
                </div>
            </div>

            {/* MONEY SUMMARY */}
            <div className="money-summary">
                <div>
                    <p>💰 Successful Paid Value</p>
                    <h2>₹{successfulValue}</h2>
                </div>
                <div>
                    <p>❌ Failed Payment Value</p>
                    <h2>₹{failedValue}</h2>
                </div>
                <div>
                    <p>⚠️ Cancelled Payment Value</p>
                    <h2>₹{cancelledValue}</h2>
                </div>
            </div>

            {/* TRANSACTION TABLE */}
            <div className="transaction-table-section">
                <div className="section-title">
                    <h2>Transaction Log Records</h2>
                    <span>{totalTransactions} total entries</span>
                </div>

                {transactions.length === 0 ? (
                    <div className="empty-transactions">
                        <div>📭</div>
                        <h3>No transaction records found</h3>
                        <p>Initiate payments via ShopSense AI or generate demo transactions in the Merchant dashboard.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Item</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Payment ID / Order ID</th>
                                    <th>Failure / Cancellation Reason</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => {
                                    let statusClass = "status-pending";
                                    let statusText = "⏳ PENDING";
                                    if (transaction.status === "SUCCESS") {
                                        statusClass = "status-success";
                                        statusText = "✅ SUCCESS";
                                    } else if (transaction.status === "FAILED") {
                                        statusClass = "status-failed";
                                        statusText = "❌ FAILED";
                                    } else if (transaction.status === "CANCELLED") {
                                        statusClass = "status-cancelled";
                                        statusText = "⚠️ CANCELLED";
                                    }

                                    return (
                                        <tr key={transaction._id}>
                                            <td>
                                                <strong>{transaction.productName}</strong>
                                            </td>
                                            <td>₹{transaction.amount}</td>
                                            <td>
                                                <span className={`status-badge ${statusClass}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td>
                                                {transaction.isRetry ? (
                                                    <span className="badge-retry" title={`Retry of ${transaction.originalTransactionId || 'previous transaction'}`}>
                                                        🔄 RETRY
                                                    </span>
                                                ) : (
                                                    <span className="badge-normal">Initial</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="id-stack">
                                                    {transaction.paymentId && <span className="pay-id">Pay: {transaction.paymentId}</span>}
                                                    {transaction.orderId && <span className="ord-id">Ord: {transaction.orderId}</span>}
                                                    {!transaction.paymentId && !transaction.orderId && <span className="no-id">—</span>}
                                                </div>
                                            </td>
                                            <td>{transaction.failureReason || "N/A (Success)"}</td>
                                            <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TransactionDashboard;