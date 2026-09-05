import React from 'react';

const floatingIcons = [
    { icon: "🛍️", left: "5%", duration: "18s", delay: "0s" },
    { icon: "🤖", left: "15%", duration: "22s", delay: "2s" },
    { icon: "💎", left: "25%", duration: "20s", delay: "4s" },
    { icon: "💄", left: "38%", duration: "19s", delay: "1s" },
    { icon: "👜", left: "52%", duration: "24s", delay: "3s" },
    { icon: "⚡", left: "65%", duration: "17s", delay: "0.5s" },
    { icon: "🎁", left: "78%", duration: "21s", delay: "5s" },
    { icon: "✨", left: "88%", duration: "19s", delay: "2.5s" },
    { icon: "🪔", left: "95%", duration: "23s", delay: "1.5s" }
];

function FloatingParticles() {
    return (
        <div className="floating-particles-container" aria-hidden="true">
            {floatingIcons.map((item, index) => (
                <div
                    key={index}
                    className="floating-icon-item"
                    style={{
                        left: item.left,
                        animationDuration: item.duration,
                        animationDelay: item.delay
                    }}
                >
                    {item.icon}
                </div>
            ))}
        </div>
    );
}

export default FloatingParticles;
