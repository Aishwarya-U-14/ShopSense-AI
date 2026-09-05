import { useEffect, useState } from "react";

const QUOTES = [
    { text: "Your AI stylist is awake. Shop smarter! ??", emoji: "?" },
    { text: "?1 saved is ?1 earned ??", emoji: "??" },
    { text: "Discovered by AI, approved by you ?", emoji: "??" },
    { text: "Fashion meets intelligence. Welcome! ??", emoji: "??" },
    { text: "The perfect gift is just a question away ??", emoji: "??" },
    { text: "See it. Describe it. Ask for it. Buy it! ??", emoji: "???" },
    { text: "AI-powered shopping, zero guesswork ??", emoji: "??" },
    { text: "Your budget. Your style. Our AI. ??", emoji: "??" },
    { text: "Snap it. Upload it. Match it. Done! ??", emoji: "??" },
    { text: "Shopping smarter is the new shopping harder ??", emoji: "?" },
    { text: "Quality picks, budget-friendly prices ???", emoji: "???" },
    { text: "From search to checkout in seconds ?", emoji: "??" },
];

export default function QuotesTicker() {
    const [current, setCurrent] = useState(0);
    const [animClass, setAnimClass] = useState("ticker-visible");

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimClass("ticker-exit");
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % QUOTES.length);
                setAnimClass("ticker-enter");
                setTimeout(() => setAnimClass("ticker-visible"), 50);
            }, 400);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const q = QUOTES[current];

    return (
        <div className="quotes-ticker-wrapper">
            <div className={`quotes-ticker-inner ${animClass}`}>
                <span className="ticker-emoji">{q.emoji}</span>
                <span className="ticker-text">{q.text}</span>
                <span className="ticker-emoji">{q.emoji}</span>
            </div>

            {/* Dots */}
            <div className="ticker-dots">
                {QUOTES.map((_, i) => (
                    <span
                        key={i}
                        className={`ticker-dot ${i === current ? "ticker-dot-active" : ""}`}
                    />
                ))}
            </div>
        </div>
    );
}
