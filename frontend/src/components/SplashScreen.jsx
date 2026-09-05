import { useEffect, useState, useRef } from "react";
import { playPageOpenSound } from "../utils/soundFx";

const BURST_EMOJIS = ["???","?","??","??","??","?","??","??","??","??","??","??","??","??","??"];

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState("enter"); // enter ? burst ? exit
    const [burstItems, setBurstItems] = useState([]);
    const [letters, setLetters] = useState([]);
    const doneRef = useRef(false);

    useEffect(() => {
        const word = "ShopSense AI";
        setLetters(word.split("").map((ch, i) => ({ ch, i, visible: false })));

        word.split("").forEach((_, i) => {
            setTimeout(() => {
                setLetters(prev => prev.map((l, idx) => idx === i ? { ...l, visible: true } : l));
            }, 200 + i * 60);
        });

        const sndTimer = setTimeout(() => {
            try { playPageOpenSound(); } catch (e) {}
        }, 400);

        const burstTimer = setTimeout(() => {
            const items = Array.from({ length: 22 }, (_, i) => ({
                id: i,
                emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 20 + Math.random() * 28,
                rotate: Math.random() * 360,
                delay: Math.random() * 0.4,
            }));
            setBurstItems(items);
            setPhase("burst");
        }, 800);

        const exitTimer = setTimeout(() => {
            setPhase("exit");
        }, 1900);

        const doneTimer = setTimeout(() => {
            if (!doneRef.current) {
                doneRef.current = true;
                onDone?.();
            }
        }, 2500);

        return () => {
            clearTimeout(sndTimer);
            clearTimeout(burstTimer);
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    return (
        <div className={`splash-screen splash-${phase}`}>
            {burstItems.map(item => (
                <div
                    key={item.id}
                    className="splash-burst-emoji"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        fontSize: `${item.size}px`,
                        animationDelay: `${item.delay}s`,
                        transform: `rotate(${item.rotate}deg)`,
                    }}
                >
                    {item.emoji}
                </div>
            ))}

            <div className="splash-center">
                <div className="splash-logo-ring" />
                <div className="splash-logo-ring splash-ring2" />
                <div className="splash-logo-emoji">???</div>

                <div className="splash-title">
                    {letters.map(({ ch, i, visible }) => (
                        <span
                            key={i}
                            className={`splash-letter ${visible ? "splash-letter-visible" : ""}`}
                            style={{ transitionDelay: `${i * 0.04}s` }}
                        >
                            {ch === " " ? "\u00A0" : ch}
                        </span>
                    ))}
                </div>

                <div className="splash-tagline">
                    See it. Describe it. Ask for it. <span>Buy it.</span>
                </div>

                <div className="splash-loader">
                    <div className="splash-loader-bar" />
                </div>
            </div>
        </div>
    );
}
