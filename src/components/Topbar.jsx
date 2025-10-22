import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, VolumeX } from "lucide-react";
import { speak, stopSpeak } from "../lib/speech";

export default function Topbar() {
  const [reading, setReading] = useState(false);
  const location = useLocation();

  // Esconde o leitor no Admin
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-slate-800">Plataforma SFTIC</h1>

        <button
          onClick={() => {
            const active = !reading;
            setReading(active);
            if (active) speak("Leitor de voz ativado. Selecione um texto para ouvir.");
            else stopSpeak();
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            reading
              ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {reading ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {reading ? "Leitor ON" : "Leitor OFF"}
        </button>
      </div>
    </header>
  );
}
