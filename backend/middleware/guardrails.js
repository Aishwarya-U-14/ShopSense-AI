/**
 * AI Action Guardrails Middleware
 * Enforces financial action policies and restrictions on the backend.
 */

const MAX_DISCOUNT_PERCENT = 20; // Maximum allowed discount incentive
const MAX_CAMPAIGN_BUDGET = 50000; // Maximum allowed campaign budget in INR
const BLOCKED_ACTIONS = [
    "DIRECT_CUSTOMER_DEBIT",
    "AUTOMATIC_REFUND",
    "UNILATERAL_PRICE_CHANGE",
    "UNLIMITED_DISCOUNT",
    "AUTO_CHARGE_CARD"
];

function enforceGuardrails(req, res, next) {
    const action = req.body.action || req.params.action;

    // 1. Check blocked financial actions
    if (action && BLOCKED_ACTIONS.includes(action.toUpperCase())) {
        return res.status(403).json({
            success: false,
            blocked: true,
            reason: `Action '${action}' is BLOCKED by AI Action Policy. Direct debits, auto-refunds, and price alterations without human sign-off are strictly prohibited.`,
            policy: "STRICT_FINANCIAL_GUARDRAIL"
        });
    }

    // 2. Validate discount incentive limits
    if (req.body.discountPercent && req.body.discountPercent > MAX_DISCOUNT_PERCENT) {
        return res.status(400).json({
            success: false,
            blocked: true,
            reason: `Discount of ${req.body.discountPercent}% exceeds maximum allowed merchant threshold of ${MAX_DISCOUNT_PERCENT}%.`,
            policy: "MAX_DISCOUNT_CAP"
        });
    }

    // 3. Validate campaign budget limits
    if (req.body.budget && req.body.budget > MAX_CAMPAIGN_BUDGET) {
        return res.status(400).json({
            success: false,
            blocked: true,
            reason: `Campaign budget ₹${req.body.budget} exceeds maximum single campaign limit of ₹${MAX_CAMPAIGN_BUDGET}.`,
            policy: "BUDGET_CAP"
        });
    }

    // 4. Require explicit merchant confirmation for money/recovery executions
    if (req.path.includes("/execute") && !req.body.confirmedByMerchant) {
        return res.status(400).json({
            success: false,
            blocked: true,
            reason: "Action requires explicit merchant confirmation prior to execution. Please review action preview.",
            policy: "CONFIRMATION_REQUIRED"
        });
    }

    next();
}

module.exports = {
    enforceGuardrails,
    MAX_DISCOUNT_PERCENT,
    MAX_CAMPAIGN_BUDGET,
    BLOCKED_ACTIONS
};
