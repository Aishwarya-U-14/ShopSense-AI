async function runE2ETests() {
    console.log("==================================================");
    console.log("STARTING END-TO-END VERIFICATION FOR SHOPSENSE AI");
    console.log("==================================================");

    let testResults = [];
    const logResult = (name, passed, detail) => {
        const symbol = passed ? "✅" : "❌";
        console.log(`${symbol} TEST: ${name} - ${passed ? "PASSED" : "FAILED"} ${detail ? '(' + detail + ')' : ''}`);
        testResults.push({ name, passed, detail });
    };

    try {
        // Test 1: Root & Health Check
        const root = await fetch('http://localhost:5000/').then(r => r.json());
        logResult("Backend Health & MongoDB", root.mongoStatus === "Connected", `MongoStatus: ${root.mongoStatus}`);

        // Test 2: Product Catalog Retrieval (370 products)
        const products = await fetch('http://localhost:5000/api/products').then(r => r.json());
        logResult("Product Catalog Expansion", products.length >= 300, `Retrieved ${products.length} products`);

        // Test 3: Product Search with Budget & Intent
        const search = await fetch('http://localhost:5000/api/products/search?keyword=jhumka&maxPrice=1500').then(r => r.json());
        logResult("Budget-Aware Product Search", search.length > 0 && search.every(p => p.price <= 1500), `Found ${search.length} matching items under ₹1500`);

        // Test 4: AI Contextual Shopping Agent Initial Query
        const agentReq1 = await fetch('http://localhost:5000/api/gemini/agent-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "I need a traditional jhumka for a wedding under ₹1500." })
        }).then(r => r.json());
        logResult("AI Shopping Agent Intent Extraction", agentReq1.success && agentReq1.products.length > 0, `Top Pick: ${agentReq1.approvedProduct?.name} (₹${agentReq1.approvedProduct?.price})`);

        // Test 5: AI Context Memory Follow-up
        const agentReq2 = await fetch('http://localhost:5000/api/gemini/agent-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Show me something more traditional",
                history: [
                    { sender: 'user', text: "I need a traditional jhumka for a wedding under ₹1500." },
                    { sender: 'ai', text: agentReq1.replyText, products: agentReq1.products, context: agentReq1.context }
                ]
            })
        }).then(r => r.json());
        logResult("AI Agent Context Memory Resolution", agentReq2.success && agentReq2.context.category === "jewellery" && agentReq2.context.subcategory === "jhumkas", `Retained category context: ${agentReq2.context.subcategory}`);

        // Test 6: Razorpay Test Order Creation
        const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 999, productName: "Minimalist Sleek Jhumka" })
        }).then(r => r.json());
        logResult("Razorpay Test Order Creation", orderRes.success && orderRes.order.id.startsWith("order_"), `Order ID: ${orderRes.order.id}`);

        // Test 7: Record Payment Failure
        const failRes = await fetch('http://localhost:5000/api/payments/payment-failed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productName: "Minimalist Sleek Jhumka",
                amount: 999,
                razorpayOrderId: orderRes.order.id,
                failureReason: "Payment declined by bank"
            })
        }).then(r => r.json());
        logResult("Record Payment Failure", failRes.success && failRes.transaction.status === "FAILED", `Recorded failure Tx ID: ${failRes.transaction._id}`);

        // Test 8: Record Payment Cancellation (Popup Dismissed)
        const cancelRes = await fetch('http://localhost:5000/api/payments/payment-cancelled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productName: "Minimalist Sleek Jhumka",
                amount: 999,
                razorpayOrderId: orderRes.order.id
            })
        }).then(r => r.json());
        logResult("Record Payment Cancellation (CANCELLED status)", cancelRes.success && cancelRes.transaction.status === "CANCELLED", `Recorded cancellation Tx ID: ${cancelRes.transaction._id}`);

        // Test 9: Retry Payment Recovery Linkage
        const retryOrder = await fetch('http://localhost:5000/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 999,
                productName: "Minimalist Sleek Jhumka",
                isRetry: true,
                originalTransactionId: failRes.transaction._id
            })
        }).then(r => r.json());
        logResult("Retry Payment Linkage", retryOrder.isRetry === true && retryOrder.originalTransactionId === failRes.transaction._id, `Retry linked to original: ${retryOrder.originalTransactionId}`);

        // Test 10: Audit Log Creation & Fetch
        await fetch('http://localhost:5000/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "PAYMENT_SUCCESS", description: "Test payment completed", productName: "Minimalist Sleek Jhumka", amount: 999, status: "SUCCESS" })
        });
        const audit = await fetch('http://localhost:5000/api/audit').then(r => r.json());
        logResult("AI Audit Log Trail", audit.success && audit.logs.length > 0, `Total audit records: ${audit.logs.length}`);

        console.log("==================================================");
        const passedCount = testResults.filter(t => t.passed).length;
        console.log(`E2E VERIFICATION COMPLETE: ${passedCount}/${testResults.length} CHECKS PASSED.`);
        console.log("==================================================");
    } catch (err) {
        console.error("E2E Test Error:", err);
    }
}

runE2ETests();
