// src/contexts/SpeechContext.jsx

import { createContext, useContext, useState, useCallback } from "react";
import { speak, stopSpeech } from "../lib/speech";

const SpeechContext = createContext(null);

export function SpeechProvider({ children }) {
  const [readerOn, setReaderOn] = useState(false);

  const toggleReader = useCallback(() => {
    setReaderOn((prev) => {
      const next = !prev;
      if (next) speak("Leitor de voz ativado.");
      else stopSpeech();
      return next;
    });
  }, []);

  const announce = useCallback(
    (msg) => {
      if (readerOn) speak(msg);
    },
    [readerOn]
  );

  return (
    <SpeechContext.Provider value={{ readerOn, toggleReader, announce }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech deve ser usado dentro de SpeechProvider");
  return ctx;
}