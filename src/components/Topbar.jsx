import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, UserRound, LogOut } from "lucide-react";
import { stopSpeech } from "../lib/speech";
import { getPlayer, clearPlayer } from "../lib/player";
import { useSpeech } from "../contexts/SpeechContext";

export default function Topbar() {
  const { readerOn, toggleReader } = useSpeech();
  const [player, setPlayerState] = useState(() => getPlayer());

  const location = useLocation();
  const navigate = useNavigate();

 if (location.pathname.toLowerCase().startsWith("/admin")) return null;

  useEffect(() => {
    const onStorage = () => setPlayerState(getPlayer());
    window.addEventListener("storage", onStorage);
    setPlayerState(getPlayer());
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const playerName = useMemo(() => player?.name?.trim() || "", [player]);

  const handleSwitchUser = () => {
    stopSpeech();
    clearPlayer();
    localStorage.removeItem("nextGameRoute");
    setPlayerState(null);
    navigate("/userLogin");
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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

        </div>
      </div>
    </header>
  );
}