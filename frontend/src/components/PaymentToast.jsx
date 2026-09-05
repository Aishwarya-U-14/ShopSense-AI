import { useEffect, useState } from "react";

// Listen for custom events: "payment-success" and "payment-failure"
export default function PaymentToast() {
    const [toast, setToast] = useState(null); // { type: "success"|"failure", message: string }

    useEffect(() => {
        const handleSuccess = () => {
            setToast({ type: "success", message: "🎉 Yayyy! You got it! 🎊" });
            setTimeout(() => setToast(null), 4000);
        };
        const handleFailure = () => {
            setToast({ type: "failure", message: "😢 Oops! I am so sorry about that!" });
            setTimeout(() => setToast(null), 4000);
        };

        window.addEventListener("payment-success", handleSuccess);
        window.addEventListener("payment-failure", handleFailure);
        return () => {
            window.removeEventListener("payment-success", handleSuccess);
            window.removeEventListener("payment-failure", handleFailure);
        };
    }, []);

    if (!toast) return null;

    return (
        <div className={`payment-toast ${toast.type}`} key={Date.now()}>
            <div style={{ fontSize: "26px", marginBottom: "4px" }}>
                {toast.type === "success" ? "🎉" : "😢"}
            </div>
            {toast.message}
            {toast.type === "success" && (
                <div style={{ fontSize: "13px", marginTop: "6px", opacity: 0.85 }}>
                    Your order is on its way! ✨
                </div>
            )}
            {toast.type === "failure" && (
                <div style={{ fontSize: "13px", marginTop: "6px", opacity: 0.85 }}>
                    Please try again — we believe in you! 💪
                </div>
            )}
        </div>
    );
}

// Helper functions to trigger the toasts globally
export function showSuccessToast() {
    window.dispatchEvent(new CustomEvent("payment-success"));
}
export function showFailureToast() {
    window.dispatchEvent(new CustomEvent("payment-failure"));
}
