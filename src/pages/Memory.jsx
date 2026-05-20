// src/pages/Memory.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";

const EMOJIS = ["🍎", "🍌", "🍇", "🍉", "🍓", "🥝", "🍑", "🍍"]; // 8 pares -> 16 cartas

// >>> Delays ajustáveis <<<
const DELAY_MATCH = 4500; // ms: tempo de cartas abertas após ACERTO (antes era 300)
const DELAY_MISS = 4500; // ms: tempo de cartas abertas após ERRO   (antes era 700)

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeDeck() {
  const base = EMOJIS.flatMap((e, idx) => [
    { id: `${idx}-a`, value: e, matched: false },
    { id: `${idx}-b`, value: e, matched: false },
  ]);
  return shuffle(base);
}

function Card({ card, flipped, disabled, onClick }) {
  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKey}
      disabled={disabled}
      aria-pressed={flipped}
      aria-label={
        flipped || card.matched ? `Carta ${card.value}` : "Carta virada"
      }
      className={[
        "relative h-24 sm:h-28 rounded-2xl shadow-md",
        "flex items-center justify-center text-3xl sm:text-4xl font-bold",
        "transition-transform focus:outline-none focus:ring-2 focus:ring-violet-400",
        flipped || card.matched
          ? "bg-white text-black"
          : "bg-sky-500 text-white",
        disabled ? "opacity-80 cursor-not-allowed" : "hover:scale-[1.02]",
      ].join(" ")}
    >
      {flipped || card.matched ? card.value : "?"}
      {card.matched && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
          ok
        </span>
      )}
    </button>
  );
}

export default function Memory() {
  const navigate = useNavigate();
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  const [deck, setDeck] = useState(() => makeDeck());
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);

  // A11y
  const [ttsOn, setTtsOn] = useState(true);
  const liveRef = useRef(null);

  function announce(msg) {
    if (ttsOn) speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => (liveRef.current.textContent = msg), 20);
    }
  }

  function readScreen() {
    const matchedPairs = deck.filter((card) => card.matched).length / 2;
    const totalPairs = EMOJIS.length;

    announce(
      `Jogo da Memória. 
      O objetivo é encontrar todos os pares de cartas iguais. 
      O jogo tem ${totalPairs} pares no total. 
      Você já encontrou ${matchedPairs} pares. 
      Você fez ${moves} jogadas até agora. 
      Para jogar, escolha duas cartas. 
      Se elas forem iguais, formarão um par. 
      Se forem diferentes, tente novamente.`
    );
  }

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  // parar quando finalizar + salvar recordes
  useEffect(() => {
    if (allMatched) {
      setRunning(false);
      try {
        const best = JSON.parse(localStorage.getItem("memory_best") || "{}");
        const newBest = {
          time: best.time ? Math.min(best.time, time) : time,
          moves: best.moves ? Math.min(best.moves, moves) : moves,
        };
        localStorage.setItem("memory_best", JSON.stringify(newBest));
      } catch {}
      announce(`Parabéns! Você concluiu o jogo com ${moves} jogadas.`);
    }
  }, [allMatched, time, moves]); // eslint-disable-line

  const best = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("memory_best") || "{}");
    } catch {
      return {};
    }
  }, [allMatched]);

  const flip = (card) => {
    if (lock) return;
    if (first?.id === card.id || card.matched) return;

    if (!first) {
      setFirst(card);
      announce(`Primeira carta virada: ${card.value}.`);
      return;
    }

    setSecond(card);
    setLock(true);
    setMoves((m) => {
      const next = m + 1;
      announce(`Segunda carta virada: ${card.value}. Jogada número ${next}.`);
      return next;
    });

    if (first.value === card.value) {
      // acerto
      setDeck((d) =>
        d.map((c) => (c.value === card.value ? { ...c, matched: true } : c))
      );
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        setLock(false);
        announce(`Par formado: ${card.value}.`);
      }, DELAY_MATCH);
    } else {
      // erro
      setTimeout(() => {
        setFirst(null);
        setSecond(null);
        setLock(false);
        announce("Não combinam. Tente novamente.");
      }, DELAY_MISS);
    }
  };

  const restart = () => {
    setDeck(makeDeck());
    setFirst(null);
    setSecond(null);
    setLock(false);
    setMoves(0);
    setTime(0);
    setRunning(true);
    announce("Novo jogo iniciado. Boa sorte!");
  };

  const gridCols = "grid grid-cols-4 gap-3 sm:gap-4"; // 4x4

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Região "live" para leitores de tela */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={liveRef}
      />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Esquerda: Voltar */}
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          {/* Centro: título */}
          <h1 className="font-bold text-black">Jogo da Memória</h1>

          {/* Direita: Leitor + Reiniciar */}
          <div className="flex items-center gap-2">
            <button
              onClick={readScreen}
              className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white"
              aria-label="Ler instruções do jogo da memória"
              title="Ler tela"
            >
              🔊
            </button>
            <button
              onClick={restart}
              className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white"
            >
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" className="max-w-5xl mx-auto px-4 py-6">
        {/* Painel de status */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Jogadas" value={moves} />
        </div>

        {/* Grid de cartas */}
        <section
          className={`${gridCols} select-none`}
          role="grid"
          aria-label="Tabuleiro do jogo da memória"
        >
          {deck.map((card) => {
            const flipped =
              first?.id === card.id || second?.id === card.id || card.matched;
            return (
              <Card
                key={card.id}
                card={card}
                flipped={flipped}
                disabled={lock || flipped}
                onClick={() => flip(card)}
              />
            );
          })}
        </section>

        {/* Mensagem de vitória */}
        {allMatched && (
          <div
            role="status"
            className="mt-6 p-4 rounded-xl bg-emerald-100 text-emerald-900 font-semibold text-center"
          >
            Parabéns! Você concluiu o jogo com {moves} jogadas.
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  );
}

function formatTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}