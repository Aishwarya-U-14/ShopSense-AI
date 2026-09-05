import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useVoiceInput hook for Speech-to-Text and Text-to-Speech
 * Uses the Web Speech API (SpeechRecognition & SpeechSynthesis)
 */
export function useVoiceInput({ onTranscript } = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN"; // English (India) with fallback to en-US

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let current = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                current += event.results[i][0].transcript;
            }
            setTranscript(current);
            if (onTranscript && current.trim()) {
                onTranscript(current);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }
        };
    }, [onTranscript]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            setTranscript("");
            setError(null);
            recognitionRef.current.start();
        } catch (e) {
            console.warn("Speech start failed:", e);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.stop();
        } catch (e) {}
    }, []);

    // Text-to-Speech (Agent speaks back)
    const speak = useCallback((text) => {
        if (!window.speechSynthesis || !text) return;
        try {
            window.speechSynthesis.cancel(); // cancel any active speech
            const cleanText = text.replace(/[*_#`]/g, "").slice(0, 250); // speak first sentence/summary
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    }, []);

    return {
        isListening,
        transcript,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript: () => setTranscript(""),
        speak
    };
}
