const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/Product");
const Transaction = require("./models/Transaction");
const AbandonedCheckout = require("./models/AbandonedCheckout");
const AuditLog = require("./models/AuditLog");

// Curated high-res Unsplash images by subcategory for 100% visual variety
const subcategoryImages = {
    jhumkas: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1611591475143-4f8a7738f61a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"
    ],
    earrings: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
    ],
    necklaces: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1611591475143-4f8a7738f61a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80"
    ],
    chokers: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1611591475143-4f8a7738f61a?auto=format&fit=crop&w=600&q=80"
    ],
    bracelets: [
        "https://images.unsplash.com/photo-1611591475143-4f8a7738f61a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
    ],
    bangles: [
        "https://images.unsplash.com/photo-1611591475143-4f8a7738f61a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
    ],
    rings: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80"
    ],
    handbags: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80"
    ],
    "tote bags": [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80"
    ],
    "crossbody bags": [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
    ],
    clutches: [
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
    ],
    wallets: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80"
    ],
    scarves: [
        "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80"
    ],
    watches: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"
    ],
    lipsticks: [
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80"
    ],
    foundations: [
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80"
    ],
    blushes: [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80"
    ],
    eyeliners: [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80"
    ],
    serums: [
        "https://images.unsplash.com/photo-1608248597359-009139f4d7f5?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
    ],
    earphones: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80"
    ],
    headphones: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80"
    ],
    "fast chargers": [
        "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80"
    ],
    "power banks": [
        "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=600&q=80"
    ],
    gifts: [
        "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=600&q=80"
    ]
};

const defaultImage = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";

function getSubcategoryImage(subcat, idx) {
    const list = subcategoryImages[subcat] || subcategoryImages["gifts"];
    return list[idx % list.length] || defaultImage;
}

const jewellerySubcategories = ["jhumkas", "earrings", "necklaces", "bracelets", "rings", "bangles", "chokers"];
const jewelleryMaterials = ["22K Gold Plated", "Kundan & Brass", "Oxidized Sterling Silver", "Meenakari Enamel", "Cubic Zirconia Diamond", "Cultured Freshwater Pearl"];
const jewelleryStyles = ["traditional", "kundan", "temple", "oxidized", "modern", "elegant", "minimal", "bridal", "royal"];
const jewelleryOccasions = ["wedding", "festive", "party", "casual", "office", "anniversary"];
const jewelleryColors = ["gold", "silver", "rose gold", "red", "green", "emerald green", "ruby red"];
const jewelleryBrands = ["Tanishq Select", "Zaveri Pearls", "Shining Diva", "Craftsvilla", "Kalyan Jewellers", "Senco Gold"];

const fashionSubcategories = ["handbags", "tote bags", "crossbody bags", "clutches", "wallets", "scarves", "watches"];
const fashionMaterials = ["Premium Vegan Leather", "Full Grain Italian Leather", "Jacquard Silk", "Canvas & Suede", "Stainless Steel Mesh"];
const fashionStyles = ["elegant", "classic", "modern", "boho", "casual", "luxury", "executive"];
const fashionOccasions = ["office", "everyday", "party", "travel", "wedding", "date night"];
const fashionColors = ["black", "tan brown", "beige", "maroon", "navy blue", "gold", "blush pink"];
const fashionBrands = ["Baggit", "Caprese", "Lavie", "Fossil", "Titan", "Hidesign"];

const beautySubcategories = ["lipsticks", "foundations", "blushes", "eyeliners", "serums"];
const beautyMaterials = ["Hyaluronic Acid Infusion", "Shea Butter & Vitamin E", "Mineral Micro-Pigments", "Organic Argan Extract"];
const beautyStyles = ["matte", "glossy", "natural", "classic", "glam", "radiant"];
const beautyOccasions = ["party", "everyday", "wedding", "festival", "office"];
const beautyColors = ["red", "rose pink", "nude brown", "coral", "plum"];
const beautyBrands = ["Lakmé", "Maybelline New York", "SUGAR Cosmetics", "Nykaa Beauty", "Colorbar"];

const electronicsSubcategories = ["earphones", "headphones", "fast chargers", "power banks"];
const electronicsMaterials = ["Aircraft Aluminum", "Braided Kevlar Cable", "Soft Touch Matte Polycarbonate", "Silicone Cushioning"];
const electronicsStyles = ["modern", "minimalist", "sleek", "compact", "high-tech"];
const electronicsOccasions = ["everyday", "office", "travel", "workout"];
const electronicsColors = ["black", "white", "midnight blue", "space gray", "silver"];
const electronicsBrands = ["boAt", "Noise", "Realme", "OnePlus", "pTron", "Anker"];

const giftSubcategories = ["personalized gifts", "lifestyle gifts", "beauty gifts", "jewellery gifts"];
const giftMaterials = ["Handcrafted Keepsake Wood", "Satin & Velvet Box", "Brass Inlay", "Eco-friendly Handmade Paper"];
const giftStyles = ["personalized", "luxury", "artisanal", "elegant", "executive"];
const giftOccasions = ["birthday", "wedding", "anniversary", "festival", "sister gift", "mother gift"];
const giftColors = ["gold", "burgundy", "royal blue", "rose gold"];
const giftBrands = ["Ferns N Petals", "The Gift Studio", "ShopSense Bespoke"];

function getBudgetTier(price) {
    if (price < 1000) return "budget";
    if (price < 2500) return "mid-range";
    if (price < 4000) return "premium";
    return "luxury";
}

function generateProducts() {
    const products = [];
    const pick = (arr, index) => arr[index % arr.length];
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);

    // 1. JEWELLERY (85 items)
    const jewelleryAdjectives = [
        "Traditional Gold", "Kundan Peacock", "Royal Temple", "Oxidized Silver", "Dazzling Diamond",
        "Antique Pearl", "Floral Handcrafted", "Meenakari Emerald", "Bridal Ruby", "Charming Rose Gold"
    ];

    for (let i = 0; i < 85; i++) {
        const subcategory = pick(jewellerySubcategories, i);
        const adj = pick(jewelleryAdjectives, i);
        const style = pick(jewelleryStyles, i);
        const occasion = pick(jewelleryOccasions, i);
        const color = pick(jewelleryColors, i);
        const brand = pick(jewelleryBrands, i);
        const material = pick(jewelleryMaterials, i);
        const image = getSubcategoryImage(subcategory, i);

        let price = randomInt(4, 35) * 100 - 1;
        if (price < 399) price = 399;

        const name = `${adj} ${subcategory.slice(0, -1).replace(/^./, str => str.toUpperCase())} #${i + 1}`;

        products.push({
            name,
            category: "jewellery",
            subcategory,
            price,
            description: `Exquisite ${style} ${subcategory} crafted in ${material} with rich ${color} finish. Perfect for ${occasion} wear and special celebrations.`,
            image,
            colors: [color, "gold"],
            color,
            material,
            budgetTier: getBudgetTier(price),
            style,
            occasion,
            brand,
            rating: Number(randomFloat(4.3, 4.9)),
            popularity: randomInt(80, 99),
            stock: randomInt(15, 60),
            useCases: [`${occasion} guest`, "wedding wear", "cultural celebration", "festive gifting"],
            tags: ["jewellery", subcategory, style, occasion, color, material.toLowerCase(), brand.toLowerCase(), "festive", "traditional"]
        });
    }

    // 2. FASHION (80 items)
    const fashionAdjectives = [
        "Elegant Vegan Leather", "Classic Structured", "Chic Soho", "Luxury Embossed", "Minimalist Urban",
        "Suede Touch", "Vintage Canvas", "Executive Signature", "Quilted Gold-Chain", "Modern Daily"
    ];

    for (let i = 0; i < 80; i++) {
        const subcategory = pick(fashionSubcategories, i);
        const adj = pick(fashionAdjectives, i);
        const style = pick(fashionStyles, i);
        const occasion = pick(fashionOccasions, i);
        const color = pick(fashionColors, i);
        const brand = pick(fashionBrands, i);
        const material = pick(fashionMaterials, i);
        const image = getSubcategoryImage(subcategory, i);

        let price = randomInt(6, 40) * 100 - 1;
        const name = `${adj} ${subcategory.slice(0, -1).replace(/^./, str => str.toUpperCase())} #${i + 1}`;

        products.push({
            name,
            category: "fashion",
            subcategory,
            price,
            description: `Stylishly designed ${style} ${subcategory} in ${material} (${color}). Built for ${occasion} utility with smart compartments.`,
            image,
            colors: [color],
            color,
            material,
            budgetTier: getBudgetTier(price),
            style,
            occasion,
            brand,
            rating: Number(randomFloat(4.2, 4.8)),
            popularity: randomInt(78, 97),
            stock: randomInt(10, 50),
            useCases: [`${occasion} accessory`, "daily commute", "evening outing"],
            tags: ["fashion", "bags", subcategory, style, occasion, color, material.toLowerCase(), brand.toLowerCase(), "accessories"]
        });
    }

    // 3. BEAUTY (70 items)
    const beautyAdjectives = ["Velvet Matte", "Hydrating Dewy", "Luminous Satin", "Long-Lasting Transferproof", "Pure Mineral"];

    for (let i = 0; i < 70; i++) {
        const subcategory = pick(beautySubcategories, i);
        const adj = pick(beautyAdjectives, i);
        const style = pick(beautyStyles, i);
        const occasion = pick(beautyOccasions, i);
        const color = pick(beautyColors, i);
        const brand = pick(beautyBrands, i);
        const material = pick(beautyMaterials, i);
        const image = getSubcategoryImage(subcategory, i);

        let price = randomInt(3, 20) * 100 - 1;
        const name = `${brand} ${adj} ${subcategory.slice(0, -1).replace(/^./, str => str.toUpperCase())} #${i + 1}`;

        products.push({
            name,
            category: "beauty",
            subcategory,
            price,
            description: `Premium ${style} formula ${subcategory} in shade ${color}. Enriched with ${material} for a stunning ${occasion} glow.`,
            image,
            colors: [color],
            color,
            material,
            budgetTier: getBudgetTier(price),
            style,
            occasion,
            brand,
            rating: Number(randomFloat(4.3, 4.9)),
            popularity: randomInt(82, 98),
            stock: randomInt(20, 80),
            useCases: ["daily makeup", "glam evening", "bridal makeover"],
            tags: ["beauty", "makeup", subcategory, style, occasion, color, brand.toLowerCase()]
        });
    }

    // 4. ELECTRONICS (70 items)
    const electronicsAdjectives = ["Active Noise Cancelling", "Bass Boosted TWS", "65W Super Fast", "Ultra Slim Power", "HD Surround Sound"];

    for (let i = 0; i < 70; i++) {
        const subcategory = pick(electronicsSubcategories, i);
        const adj = pick(electronicsAdjectives, i);
        const style = pick(electronicsStyles, i);
        const occasion = pick(electronicsOccasions, i);
        const color = pick(electronicsColors, i);
        const brand = pick(electronicsBrands, i);
        const material = pick(electronicsMaterials, i);
        const image = getSubcategoryImage(subcategory, i);

        let price = randomInt(5, 50) * 100 - 1;
        const name = `${brand} ${adj} ${subcategory.slice(0, -1).replace(/^./, str => str.toUpperCase())} #${i + 1}`;

        products.push({
            name,
            category: "electronics",
            subcategory,
            price,
            description: `High-performance ${style} ${subcategory} by ${brand} built with ${material}. Fast connectivity in sleek ${color}, ideal for ${occasion}.`,
            image,
            colors: [color],
            color,
            material,
            budgetTier: getBudgetTier(price),
            style,
            occasion,
            brand,
            rating: Number(randomFloat(4.1, 4.8)),
            popularity: randomInt(85, 99),
            stock: randomInt(15, 70),
            useCases: ["mobile gaming", "remote work", "daily commute", "travel charging"],
            tags: ["electronics", subcategory, style, occasion, color, brand.toLowerCase()]
        });
    }

    // 5. GIFTS (65 items)
    const giftAdjectives = ["Royal Celebration", "Personalized Custom", "Artisanal Scented", "Luxury Spa Pampering", "Executive Leather"];

    for (let i = 0; i < 65; i++) {
        const subcategory = pick(giftSubcategories, i);
        const adj = pick(giftAdjectives, i);
        const style = pick(giftStyles, i);
        const occasion = pick(giftOccasions, i);
        const color = pick(giftColors, i);
        const brand = pick(giftBrands, i);
        const material = pick(giftMaterials, i);
        const image = getSubcategoryImage("gifts", i);

        let price = randomInt(7, 45) * 100 - 1;
        const name = `${adj} ${subcategory.slice(0, -1).replace(/^./, str => str.toUpperCase())} #${i + 1}`;

        products.push({
            name,
            category: "gifts",
            subcategory,
            price,
            description: `Thoughtfully curated ${style} ${subcategory} packaged in ${material}. An unforgettable choice for ${occasion} surprises in elegant ${color}.`,
            image,
            colors: [color],
            color,
            material,
            budgetTier: getBudgetTier(price),
            style,
            occasion,
            brand,
            rating: Number(randomFloat(4.4, 4.95)),
            popularity: randomInt(84, 99),
            stock: randomInt(10, 40),
            useCases: ["birthday surprise", "anniversary gift", "sister gift", "wedding hamper"],
            tags: ["gifts", subcategory, style, occasion, color, brand.toLowerCase()]
        });
    }

    return products;
}

// Generate realistic transactions and abandoned checkouts so Revenue Recovery runs on real data
async function seedRealisticTransactions(products) {
    console.log("Seeding realistic transactions and abandoned checkout records for Revenue Recovery...");
    await Transaction.deleteMany();
    await AbandonedCheckout.deleteMany();

    const sampleTransactions = [];
    const customerList = [
        { ref: "Customer #102", email: "priya.s@example.com" },
        { ref: "Customer #105", email: "rahul.m@example.com" },
        { ref: "Customer #112", email: "ananya.k@example.com" },
        { ref: "Customer #118", email: "vikram.d@example.com" },
        { ref: "Customer #124", email: "sneha.r@example.com" },
        { ref: "Customer #129", email: "arjun.n@example.com" },
        { ref: "Customer #135", email: "pooja.v@example.com" },
        { ref: "Customer #143", email: "karan.b@example.com" },
        { ref: "Customer #150", email: "divya.t@example.com" },
        { ref: "Customer #158", email: "rohit.g@example.com" }
    ];

    // Seed 25 successful transactions
    for (let i = 0; i < 25; i++) {
        const prod = products[i % products.length];
        const cust = customerList[i % customerList.length];
        sampleTransactions.push({
            paymentId: `pay_test_${Math.random().toString(36).substring(2, 10)}`,
            orderId: `order_${Math.random().toString(36).substring(2, 12)}`,
            amount: prod.price,
            status: "SUCCESS",
            productName: prod.name,
            customerRef: cust.ref,
            customerEmail: cust.email,
            isRetry: i % 4 === 0,
            recoveryStatus: i % 4 === 0 ? "RECOVERED" : "UNATTEMPTED"
        });
    }

    // Seed 7 failed transactions with authentic payment provider messages
    const failureReasons = [
        "Payment declined: Insufficient funds in customer account",
        "Payment timeout: Bank authorization server did not respond",
        "Declined by bank: Daily transaction limit exceeded",
        "Authentication failure: Incorrect 3D Secure OTP entered",
        "Network connection interrupted during bank redirect"
    ];

    for (let i = 0; i < 7; i++) {
        const prod = products[(i * 3 + 5) % products.length];
        const cust = customerList[i % customerList.length];
        sampleTransactions.push({
            paymentId: `pay_fail_${Math.random().toString(36).substring(2, 10)}`,
            orderId: `order_${Math.random().toString(36).substring(2, 12)}`,
            amount: prod.price,
            status: "FAILED",
            failureReason: failureReasons[i % failureReasons.length],
            productName: prod.name,
            customerRef: cust.ref,
            customerEmail: cust.email,
            diagnostics: {
                priority: prod.price > 2500 ? "HIGH" : "MEDIUM",
                action: "Retry payment with payment link",
                reason: `Customer reached checkout for ${prod.name} (₹${prod.price}). High intent demonstrated; bank authorization failed.`
            }
        });
    }

    // Seed 5 cancelled transactions
    for (let i = 0; i < 5; i++) {
        const prod = products[(i * 2 + 10) % products.length];
        const cust = customerList[(i + 4) % customerList.length];
        sampleTransactions.push({
            paymentId: null,
            orderId: `order_${Math.random().toString(36).substring(2, 12)}`,
            amount: prod.price,
            status: "CANCELLED",
            failureReason: "Payment cancelled by user: Checkout modal dismissed",
            productName: prod.name,
            customerRef: cust.ref,
            customerEmail: cust.email,
            diagnostics: {
                priority: "MEDIUM",
                action: "Consider incentive or gentle reminder",
                reason: `Customer exited checkout modal on step 2 for ${prod.name}. May need small incentive or assistance.`
            }
        });
    }

    await Transaction.insertMany(sampleTransactions);
    console.log(`✅ Seeded ${sampleTransactions.length} realistic transactions (25 success, 7 failed, 5 cancelled).`);

    // Seed 6 Abandoned Checkout journeys
    const abandonedRecords = [
        {
            sessionId: "sess_ab_101",
            customerRef: "Customer #118",
            customerEmail: "vikram.d@example.com",
            totalAmount: 3899,
            step: "RAZORPAY_DISMISSED",
            intentScore: 92,
            suggestedAction: "Generate payment recovery link",
            cartItems: [
                { name: products[0].name, price: products[0].price, quantity: 1, image: products[0].image, category: products[0].category }
            ]
        },
        {
            sessionId: "sess_ab_102",
            customerRef: "Customer #129",
            customerEmail: "arjun.n@example.com",
            totalAmount: 4998,
            step: "CHECKOUT_STARTED",
            intentScore: 88,
            suggestedAction: "Consider incentive discount (5%)",
            cartItems: [
                { name: products[10].name, price: products[10].price, quantity: 1, image: products[10].image, category: products[10].category },
                { name: products[12].name, price: products[12].price, quantity: 1, image: products[12].image, category: products[12].category }
            ]
        },
        {
            sessionId: "sess_ab_103",
            customerRef: "Customer #143",
            customerEmail: "karan.b@example.com",
            totalAmount: 2499,
            step: "RAZORPAY_OPENED",
            intentScore: 90,
            suggestedAction: "Generate payment recovery link",
            cartItems: [
                { name: products[25].name, price: products[25].price, quantity: 1, image: products[25].image, category: products[25].category }
            ]
        },
        {
            sessionId: "sess_ab_104",
            customerRef: "Customer #155",
            customerEmail: "deepak.s@example.com",
            totalAmount: 1799,
            step: "CART_VIEWED",
            intentScore: 65,
            suggestedAction: "Cross-sell bundle suggestion",
            cartItems: [
                { name: products[35].name, price: products[35].price, quantity: 1, image: products[35].image, category: products[35].category }
            ]
        }
    ];

    await AbandonedCheckout.insertMany(abandonedRecords);
    console.log(`✅ Seeded ${abandonedRecords.length} abandoned checkout behavior records.`);
}

async function seedProducts() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 20000
        });

        console.log("Clearing existing product collection...");
        await Product.deleteMany();

        const catalog = generateProducts();
        console.log(`Generated ${catalog.length} realistic products with unique subcategory images and rich metadata. Seeding...`);

        const inserted = await Product.insertMany(catalog);
        console.log(`✅ Successfully seeded ${inserted.length} products into ShopSense AI database!`);

        await seedRealisticTransactions(inserted);

        await mongoose.connection.close();
        console.log("🎉 Seeding complete. All data ready for AI Revenue Recovery!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
}

seedProducts();