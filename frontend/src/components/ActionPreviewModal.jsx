import API_BASE from "../config.js";
import { useState } from "react";
import axios from "axios";

/**
 * ActionPreviewModal
 * Displays strict preview before executing any money-related recovery action.
 */
function ActionPreviewModal({ previewData, onClose, onSuccess }) {
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState(null);

    if (!previewData) return null;

    const { action, customer, amount, productName, reason, risk, expectedResult, whyAmIDoingThis, id, type } = previewData;

    const handleExecute = async () => {
        setExecuting(true);
        setError(null);
        try {
            const res = await axios.post(API_BASE + "/api/recovery/execute-action", {
                id,
                targetType: type,
                customer,
                amount,
                productName,
                confirmedByMerchant: true
            });

            if (res.data.success) {
                if (onSuccess) onSuccess(res.data);
                onClose();
            } else {
                setError(res.data.reason || "Action execution failed.");
            }
        } catch (err) {
            console.error("Execute action error:", err);
            setError(err.response?.data?.reason || "Execution failed due to guardrail policy.");
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="modal-backdrop action-preview-backdrop" onClick={onClose}>
            <div className="action-preview-modal" onClick={e => e.stopPropagation()}>
                <div className="action-preview-header">
                    <div className="header-badge">🛡️ AI MONEY ACTION PREVIEW</div>
                    <button className="btn-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="action-preview-body">
                    <div className="preview-row highlight-row">
                        <span className="label">Action:</span>
                        <strong className="value action-name">{action || "Generate Payment Recovery Link"}</strong>
                    </div>

                    <div className="preview-grid">
                        <div className="preview-item">
                            <span className="label">Target Customer:</span>
                            <span className="val">{customer}</span>
                        </div>
                        <div className="preview-item">
                            <span className="label">Recoverable Amount:</span>
                            <span className="val amount">₹{Number(amount).toLocaleString()}</span>
                        </div>
                        <div className="preview-item">
                            <span className="label">Item:</span>
                            <span className="val">{productName || "Cart Items"}</span>
                        </div>
                        <div className="preview-item">
                            <span className="label">Financial Risk Level:</span>
                            <span className={`risk-badge ${risk?.toLowerCase() || "low"}`}>{risk || "LOW"}</span>
                        </div>
                    </div>

                    <div className="preview-section">
                        <h4>💡 Why am I doing this?</h4>
                        <p className="explanation-text">{whyAmIDoingThis || reason}</p>
                    </div>

                    <div className="preview-section">
                        <h4>🎯 Expected Result</h4>
                        <p className="result-text">{expectedResult || "Enables the customer to finalize purchase with an authenticated Razorpay retry link."}</p>
                    </div>

                    {error && (
                        <div className="guardrail-alert">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                <div className="action-preview-footer">
                    <button
                        className="btn-action-cancel"
                        onClick={onClose}
                        disabled={executing}
                    >
                        CANCEL
                    </button>
                    <button
                        className="btn-action-execute"
                        onClick={handleExecute}
                        disabled={executing}
                    >
                        {executing ? "⚡ Executing Guardrail Action..." : "EXECUTE ACTION"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ActionPreviewModal;
