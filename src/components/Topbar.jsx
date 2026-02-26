import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, UserRound, LogOut } from "lucide-react";
import { speak, stopSpeak } from "../lib/speech";
import { getPlayer, clearPlayer } from "../lib/player";

export default function Topbar() {
  const [reading, setReading] = useState(false);
  const [player, setPlayerState] = useState(() => getPlayer());

  const location = useLocation();
  const navigate = useNavigate();

  // Esconde no Admin
  if (location.pathname.startsWith("/admin")) return null;

  // Atualiza caso mude o localStorage (troca usuário/login em outra aba ou componente)
  useEffect(() => {
    const onStorage = () => setPlayerState(getPlayer());
    window.addEventListener("storage", onStorage);

    // também atualiza ao montar (garante consistência)
    setPlayerState(getPlayer());

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const playerName = useMemo(() => player?.name?.trim() || "", [player]);

  const toggleReader = () => {
    const active = !reading;
    setReading(active);
    if (active) speak("Leitor de voz ativado. Selecione um texto para ouvir.");
    else stopSpeak();
  };

  const handleSwitchUser = () => {
    stopSpeak();
    setReading(false);
    clearPlayer();
    localStorage.removeItem("nextGameRoute");
    setPlayerState(null);
    navigate("/userLogin");
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Esquerda */}
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-slate-800">Plataforma SFTIC</h1>

          {playerName ? (
            <span className="hidden sm:flex items-center gap-2 text-sm text-slate-700">
              <UserRound size={16} />
              <strong className="font-semibold">{playerName}</strong>
            </span>
          ) : (
            <span className="hidden sm:block text-sm text-slate-500">
              Nenhum usuário selecionado
            </span>
          )}
        </div>

        {/* Direita */}
        <div className="flex items-center gap-2">
          {playerName && (
            <button
              onClick={handleSwitchUser}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition bg-rose-50 text-rose-700 hover:bg-rose-100"
              aria-label="Trocar usuário"
              title="Trocar usuário"
            >
              <LogOut size={16} />
              Trocar
            </button>
          )}

          <button
            onClick={toggleReader}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              reading
                ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-pressed={reading}
          >
            {reading ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {reading ? "Leitor ON" : "Leitor OFF"}
          </button>
        </div>
      </div>
    </header>
  );
}