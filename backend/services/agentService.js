const { GoogleGenAI } = require("@google/genai");
const Product = require("../models/Product");

// Initialize Gemini client safely if key exists
let ai = null;
if (process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    } catch (e) {
        console.warn("Gemini client initialization warning:", e.message);
    }
}

/**
 * Extract structured shopping intent from user text and conversation history
 */
function extractShoppingIntent(currentText, conversationHistory = []) {
    const text = currentText.toLowerCase();

    // Look back through history for previous intent context
    let contextCategory = null;
    let contextSubcategory = null;
    let contextMaxPrice = null;
    let contextOccasion = null;
    let contextStyle = null;
    let lastRecommendedProducts = [];

    for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.context) {
            if (!contextCategory && msg.context.category) contextCategory = msg.context.category;
            if (!contextSubcategory && msg.context.subcategory) contextSubcategory = msg.context.subcategory;
            if (!contextMaxPrice && msg.context.maxPrice) contextMaxPrice = msg.context.maxPrice;
            if (!contextOccasion && msg.context.occasion) contextOccasion = msg.context.occasion;
            if (!contextStyle && msg.context.style) contextStyle = msg.context.style;
        }
        if (msg.products && msg.products.length > 0 && lastRecommendedProducts.length === 0) {
            lastRecommendedProducts = msg.products;
        }
    }

    // 1. Budget detection
    const budgetMatch = text.match(/(?:under|below|within|less than|upto|up to|budget|around|max)\s*₹?\s*(\d+)/i);
    let maxPrice = budgetMatch ? Number(budgetMatch[1]) : contextMaxPrice;

    // Handle relative price requests ("cheaper", "more affordable")
    if ((text.includes("cheaper") || text.includes("less expensive") || text.includes("more affordable")) && lastRecommendedProducts.length > 0) {
        const lowestPrice = Math.min(...lastRecommendedProducts.map(p => p.price));
        maxPrice = Math.max(100, Math.floor(lowestPrice * 0.85));
    }

    // 2. Category & Subcategory detection
    let category = null;
    let subcategory = null;

    if (text.includes("jhumka") || text.includes("jhumki")) {
        category = "jewellery";
        subcategory = "jhumkas";
    } else if (text.includes("earring") || text.includes("stud")) {
        category = "jewellery";
        subcategory = "earrings";
    } else if (text.includes("necklace") || text.includes("choker") || text.includes("pendant")) {
        category = "jewellery";
        subcategory = "necklaces";
    } else if (text.includes("bracelet") || text.includes("bangle") || text.includes("anklet")) {
        category = "jewellery";
        subcategory = "bracelets";
    } else if (text.includes("ring")) {
        category = "jewellery";
        subcategory = "rings";
    } else if (text.includes("jewel") || text.includes("ornament")) {
        category = "jewellery";
    } else if (text.includes("handbag") || text.includes("bag") || text.includes("tote") || text.includes("clutch") || text.includes("purse") || text.includes("wallet")) {
        category = "fashion";
        if (text.includes("tote")) subcategory = "tote bags";
        else if (text.includes("clutch")) subcategory = "clutches";
        else if (text.includes("wallet")) subcategory = "wallets";
        else subcategory = "handbags";
    } else if (text.includes("watch") || text.includes("scarf") || text.includes("sunglasses") || text.includes("backpack")) {
        category = "fashion";
    } else if (text.includes("lipstick") || text.includes("lip tint") || text.includes("lip balm") || text.includes("lip oil")) {
        category = "beauty";
        subcategory = "lipsticks";
    } else if (text.includes("foundation") || text.includes("blush") || text.includes("makeup") || text.includes("skincare") || text.includes("serum")) {
        category = "beauty";
    } else if (text.includes("earphone") || text.includes("headphone") || text.includes("earbud") || text.includes("tws")) {
        category = "electronics";
        subcategory = "earphones";
    } else if (text.includes("charger") || text.includes("power bank") || text.includes("adapter") || text.includes("cable")) {
        category = "electronics";
        subcategory = "fast chargers";
    } else if (text.includes("gift") || text.includes("present") || text.includes("hamper")) {
        category = "gifts";
    }

    // Inherit from context if not explicitly mentioned in current turn
    if (!category && contextCategory) category = contextCategory;
    if (!subcategory && contextSubcategory) subcategory = contextSubcategory;

    // 3. Style detection
    let style = null;
    if (text.includes("traditional") || text.includes("ethnic") || text.includes("desi") || text.includes("heritage")) {
        style = "traditional";
    } else if (text.includes("kundan")) {
        style = "kundan";
    } else if (text.includes("temple")) {
        style = "temple";
    } else if (text.includes("oxidized") || text.includes("silver")) {
        style = "oxidized";
    } else if (text.includes("elegant") || text.includes("classy") || text.includes("sophisticated")) {
        style = "elegant";
    } else if (text.includes("modern") || text.includes("trendy") || text.includes("chic")) {
        style = "modern";
    } else if (text.includes("minimal") || text.includes("simple")) {
        style = "minimal";
    }
    if (!style && contextStyle) style = contextStyle;

    // 4. Occasion detection
    let occasion = null;
    if (text.includes("wedding") || text.includes("marriage") || text.includes("shaadi") || text.includes("reception")) {
        occasion = "wedding";
    } else if (text.includes("party") || text.includes("night out") || text.includes("club")) {
        occasion = "party";
    } else if (text.includes("festive") || text.includes("diwali") || text.includes("eid") || text.includes("pooja") || text.includes("pujo")) {
        occasion = "festive";
    } else if (text.includes("office") || text.includes("work") || text.includes("formal")) {
        occasion = "office";
    } else if (text.includes("everyday") || text.includes("daily") || text.includes("casual")) {
        occasion = "everyday";
    }
    if (!occasion && contextOccasion) occasion = contextOccasion;

    // 5. Color detection
    let color = null;
    const colorsList = ["gold", "silver", "rose gold", "red", "black", "white", "pink", "blue", "green", "maroon", "tan", "beige"];
    for (const c of colorsList) {
        if (text.includes(c)) {
            color = c;
            break;
        }
    }

    // 6. Gift Intent
    let isGift = text.includes("gift") || text.includes("present") || text.includes("for my");
    let recipient = null;
    if (text.includes("sister")) recipient = "sister";
    else if (text.includes("mother") || text.includes("mom") || text.includes("mummy")) recipient = "mother";
    else if (text.includes("friend") || text.includes("bestie")) recipient = "friend";
    else if (text.includes("wife") || text.includes("girlfriend")) recipient = "partner";

    // 7. Special Intents
    const isComparison = text.includes("compare") || text.includes("which is better") || text.includes("which one is better") || text.includes("difference") || text.includes("which should i buy");
    const isPurchaseIntent = text.includes("buy") || text.includes("take this") || text.includes("i'll take") || text.includes("order") || text.includes("purchase");

    return {
        category,
        subcategory,
        maxPrice,
        style,
        occasion,
        color,
        isGift,
        recipient,
        isComparison,
        isPurchaseIntent,
        rawText: currentText,
        lastRecommendedProducts
    };
}

/**
 * Score & rank products based on extracted intent
 */
function rankProducts(products, intent) {
    return products.map(product => {
        let score = 0;
        const name = (product.name || "").toLowerCase();
        const desc = (product.description || "").toLowerCase();
        const cat = (product.category || "").toLowerCase();
        const subcat = (product.subcategory || "").toLowerCase();
        const style = (product.style || "").toLowerCase();
        const occasion = (product.occasion || "").toLowerCase();

        // Category & Subcategory match
        if (intent.category && cat.includes(intent.category.toLowerCase())) score += 30;
        if (intent.subcategory && (subcat.includes(intent.subcategory.toLowerCase()) || name.includes(intent.subcategory.toLowerCase()))) score += 25;

        // Budget match
        if (intent.maxPrice) {
            if (product.price <= intent.maxPrice) {
                score += 20;
                // Higher score for closer to ideal range without exceeding
                const ratio = product.price / intent.maxPrice;
                if (ratio >= 0.6 && ratio <= 1.0) score += 10;
            } else {
                // Penalize products exceeding max price
                score -= 50;
            }
        }

        // Style match
        if (intent.style && (style.includes(intent.style) || desc.includes(intent.style) || name.includes(intent.style))) {
            score += 20;
        }

        // Occasion match
        if (intent.occasion && (occasion.includes(intent.occasion) || desc.includes(intent.occasion))) {
            score += 15;
        }

        // Color match
        if (intent.color && ((product.color && product.color.toLowerCase().includes(intent.color)) || (product.colors && product.colors.some(c => c.toLowerCase().includes(intent.color))))) {
            score += 15;
        }

        // Material match
        if (intent.material && product.material && product.material.toLowerCase().includes(intent.material.toLowerCase())) {
            score += 15;
        }

        // Stock availability
        if (product.stock && product.stock > 0) {
            score += 10;
        } else {
            score -= 30; // Out of stock penalty
        }

        // Customer request keyword relevance
        if (intent.rawText) {
            const keywords = intent.rawText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            for (const kw of keywords) {
                if (name.includes(kw) || desc.includes(kw)) score += 5;
            }
        }

        // Popularity & Rating boost
        score += (product.popularity || 80) / 10;
        score += (product.rating || 4.5) * 2;

        return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

/**
 * Main AI Agent execution function
 */
async function processAgentShoppingRequest({ message, conversationHistory = [] }) {
    const intent = extractShoppingIntent(message, conversationHistory);
    console.log("Extracted Shopping Intent:", intent);

    // Build MongoDB Filter
    const filter = {};

    if (intent.maxPrice) {
        filter.price = { $lte: Number(intent.maxPrice) };
    }

    if (intent.category) {
        filter.category = { $regex: intent.category, $options: "i" };
    }

    // Build flexible search query
    const keywords = intent.rawText.toLowerCase()
        .replace(/under|below|within|less than|upto|up to|show|me|need|looking|want|find|for|a|an|the|rs|inr|₹|\d+/g, "")
        .trim()
        .split(/\s+/)
        .filter(k => k.length > 2);

    if (keywords.length > 0) {
        filter.$or = [
            { name: { $regex: keywords.join("|"), $options: "i" } },
            { category: { $regex: keywords.join("|"), $options: "i" } },
            { subcategory: { $regex: keywords.join("|"), $options: "i" } },
            { description: { $regex: keywords.join("|"), $options: "i" } },
            { style: { $regex: keywords.join("|"), $options: "i" } },
            { occasion: { $regex: keywords.join("|"), $options: "i" } },
            { tags: { $in: keywords } }
        ];
    }

    // Query database
    let rawProducts = await Product.find(filter).limit(30);

    // Fallback search if strict filter returned 0 items
    if (rawProducts.length === 0 && intent.category) {
        delete filter.$or;
        rawProducts = await Product.find({ category: intent.category }).limit(30);
    }
    if (rawProducts.length === 0 && intent.maxPrice) {
        rawProducts = await Product.find({ price: { $lte: intent.maxPrice } }).limit(20);
    }
    if (rawProducts.length === 0) {
        rawProducts = await Product.find().sort({ popularity: -1 }).limit(10);
    }

    // Rank products
    const rankedProducts = rankProducts(rawProducts, intent);
    const topProducts = rankedProducts.slice(0, 4);
    const bestMatch = topProducts[0] || null;

    // Handle comparison request
    let comparisonData = null;
    if (intent.isComparison) {
        const compareItems = topProducts.slice(0, 2);
        if (compareItems.length >= 2) {
            const p1 = compareItems[0];
            const p2 = compareItems[1];

            comparisonData = {
                item1: p1,
                item2: p2,
                verdict: p1.price <= p2.price
                    ? `**${p1.name}** offers better value at ₹${p1.price} (Rating: ${p1.rating}★), while **${p2.name}** is priced at ₹${p2.price}.`
                    : `**${p1.name}** features higher popularity (${p1.popularity}/100) and rating (${p1.rating}★), making it ideal for ${p1.occasion || "special occasions"}.`
            };
        }
    }

    // Generate Natural Language Response using Gemini or fallback generator
    let replyText = "";

    if (ai) {
        try {
            const geminiPrompt = `
You are ShopSense AI, a senior expert AI shopping assistant.

User Query: "${message}"
Extracted Intent:
- Category: ${intent.category || "Any"}
- Subcategory: ${intent.subcategory || "Any"}
- Max Budget: ${intent.maxPrice ? '₹' + intent.maxPrice : "Flexible"}
- Style: ${intent.style || "Any"}
- Occasion: ${intent.occasion || "Any"}

Top Product Recommendations Found in Database:
${topProducts.map((p, idx) => `${idx + 1}. ${p.name} - ₹${p.price} | Style: ${p.style} | Occasion: ${p.occasion} | Rating: ${p.rating}★`).join("\n")}

Instructions:
1. Explain clearly why the top recommended products match the user's specific request and budget.
2. If budget constraint is active, explicitly confirm that all recommendations are within their budget.
3. Keep response warm, commercial, helpful, and concise (3-5 short sentences or bullet points).
4. Do NOT mention database query technical terms.
`;

            const geminiRes = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: geminiPrompt
            });

            replyText = geminiRes.text;
        } catch (geminiErr) {
            console.warn("Gemini agent response failed, using smart fallback generator:", geminiErr.message);
        }
    }

    // Smart NLP Response Fallback Generator
    if (!replyText) {
        if (intent.isComparison && comparisonData) {
            replyText = `📊 **Product Comparison Analysis**\n\n` +
                `Comparing **${comparisonData.item1.name}** (₹${comparisonData.item1.price}) and **${comparisonData.item2.name}** (₹${comparisonData.item2.price}):\n\n` +
                `• **${comparisonData.item1.name}**: ₹${comparisonData.item1.price} | Style: ${comparisonData.item1.style} | Rating: ${comparisonData.item1.rating}★\n` +
                `• **${comparisonData.item2.name}**: ₹${comparisonData.item2.price} | Style: ${comparisonData.item2.style} | Rating: ${comparisonData.item2.rating}★\n\n` +
                `💡 **AI Verdict**: ${comparisonData.verdict}`;
        } else if (topProducts.length > 0) {
            const primary = topProducts[0];
            let budgetMsg = intent.maxPrice ? ` within your budget of ₹${intent.maxPrice}` : "";
            let styleMsg = intent.style ? ` matching your request for **${intent.style}** style` : "";
            let occasionMsg = intent.occasion ? ` perfect for **${intent.occasion}**` : "";

            replyText = `✨ I found ${topProducts.length} great options${budgetMsg}${styleMsg}${occasionMsg}!\n\n` +
                `🏆 **Top Pick**: **${primary.name}** for **₹${primary.price}**.\n` +
                `💡 *Why recommended*: Fits your ${primary.style || "classic"} preference, offers high rating (${primary.rating}★), and is in stock ready to ship.`;
        } else {
            replyText = `🤔 I couldn't find an exact product within those specifications. Try widening your budget or searching for categories like *jewellery*, *handbags*, *lipsticks*, or *earphones*.`;
        }
    }

    return {
        replyText,
        products: topProducts,
        approvedProduct: bestMatch,
        comparisonData,
        context: intent
    };
}

module.exports = {
    extractShoppingIntent,
    rankProducts,
    processAgentShoppingRequest
};
