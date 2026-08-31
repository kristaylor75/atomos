import { useState, useRef, useCallback } from 'react';

// Thin wrapper around the browser's SpeechRecognition API for one-shot dictation.
export function useSpeechRecognition({ onResult, lang = 'en-US' } = {}) {
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult?.(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [supported, listening, lang, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}