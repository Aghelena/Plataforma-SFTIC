// src/pages/Forca.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";

const WORDS = [
  "GATO", "RATO", "PATO", "SAPA", "SAPO", "PEIXE", "VACA", "BURRO",
  "BOLO", "SOPA", "BALA", "BISCOITO", "PIPOCA", "SUCO", "PIZZA",
  "PULA", "BOLA", "BUBU", "BIBI", "DODO", "MIMO", "BICO",
  "MESA", "CAMA", "SOFA", "FITA", "COLA", "FONE", "LIVRO",
  "MEIA", "SAPATO", "BOTA", "SAIA",
  "PARQUE", "PRAIA", "ESCOLA",
  "GALINHA", "COELHO", "PORCO",
  "BOBO", "MIMI", "TITI", "FOFO", "FOFA", "XUXU",
  "GELÉIA", "CAFÉ", "FÉRIAS", "PÃO",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISTAKES = 6;

function strip(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function HangmanSVG({ mistakes }) {
  return (
    <svg
      role="img"
      aria-label={`Desenho da forca com ${mistakes} erro(s)`}
      viewBox="0 0 200 200"
      className="w-full h-48 sm:h-56 md:h-64"
    >
      <line x1="10" y1="190" x2="190" y2="190" stroke="currentColor" strokeWidth="6" />
      <line x1="40" y1="190" x2="40" y2="20" stroke="currentColor" strokeWidth="6" />
      <line x1="36" y1="20" x2="120" y2="20" stroke="currentColor" strokeWidth="6" />
      <line x1="120" y1="20" x2="120" y2="40" stroke="currentColor" strokeWidth="6" />
      {mistakes > 0 && <circle cx="120" cy="60" r="20" stroke="currentColor" strokeWidth="4" fill="none" />}
      {mistakes > 1 && <line x1="120" y1="80" x2="120" y2="120" stroke="currentColor" strokeWidth="4" />}
      {mistakes > 2 && <line x1="120" y1="90" x2="100" y2="110" stroke="currentColor" strokeWidth="4" />}
      {mistakes > 3 && <line x1="120" y1="90" x2="140" y2="110" stroke="currentColor" strokeWidth="4" />}
      {mistakes > 4 && <line x1="120" y1="120" x2="105" y2="145" stroke="currentColor" strokeWidth="4" />}
      {mistakes > 5 && <line x1="120" y1="120" x2="135" y2="145" stroke="currentColor" strokeWidth="4" />}
    </svg>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  );
}

function Key({ letter, disabled, pressed, onClick }) {
  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKey}
      disabled={disabled || pressed}
      aria-pressed={pressed}
      aria-label={`Letra ${letter}${pressed ? " já tentada" : ""}`}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold transition shadow-sm",
        pressed ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-sky-50 text-gray-800",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        "border border-gray-200",
      ].join(" ")}
    >
      {letter}
    </button>
  );
}

export default function Forca() {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  const [word, setWord] = useState(() => pickWord());
  const [guessed, setGuessed] = useState(() => new Set());
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);

  const liveRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  const normalizedWord = useMemo(() => strip(word), [word]);

  const lettersInWord = useMemo(() => {
    const set = new Set();
    for (const ch of normalizedWord) {
      if (/[A-Z]/.test(ch)) set.add(ch);
    }
    return set;
  }, [normalizedWord]);

  const correctGuesses = useMemo(() => {
    let count = 0;
    lettersInWord.forEach((ch) => { if (guessed.has(ch)) count++; });
    return count;
  }, [lettersInWord, guessed]);

  const won  = useMemo(() => correctGuesses === lettersInWord.size && lettersInWord.size > 0, [correctGuesses, lettersInWord]);
  const lost = useMemo(() => mistakes >= MAX_MISTAKES, [mistakes]);

  function readScreen() {
    const revealedLetters = [...guessed].filter(l => lettersInWord.has(l));
    announce(
      `Jogo da Forca. A palavra tem ${lettersInWord.size} letras. ` +
      `Você acertou ${revealedLetters.length} até agora. ` +
      `Erros: ${mistakes} de ${MAX_MISTAKES}. ` +
      `Pressione uma letra do teclado para tentar.`
    );
  }

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Resultado: anuncia e salva recorde
  useEffect(() => {
    if (won) {
      setRunning(false);
      announce(`Parabéns! Você acertou a palavra ${word} com ${mistakes} erro${mistakes !== 1 ? "s" : ""}.`);
      try {
        const best = JSON.parse(localStorage.getItem("hangman_best") || "{}");
        localStorage.setItem("hangman_best", JSON.stringify({
          time: best.time ? Math.min(best.time, time) : time,
          mistakes: best.mistakes !== undefined ? Math.min(best.mistakes, mistakes) : mistakes,
        }));
      } catch {}
    }
    if (lost) {
      setRunning(false);
      announce(`Fim de jogo! A palavra era ${word}. Tente novamente.`);
      try {
        const best = JSON.parse(localStorage.getItem("hangman_best") || "{}");
        localStorage.setItem("hangman_best", JSON.stringify({
          time: best.time ? Math.min(best.time, time) : time,
          mistakes: best.mistakes !== undefined ? Math.min(best.mistakes, mistakes) : mistakes,
        }));
      } catch {}
    }
  }, [won, lost]); // eslint-disable-line

  const best = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("hangman_best") || "{}"); }
    catch { return {}; }
  }, [won, lost]);

  const reveal = useMemo(() => {
    const norm = normalizedWord;
    let out = "";
    for (let i = 0; i < word.length; i++) {
      const orig = word[i];
      const n = norm[i] ?? orig;
      if (!/[A-Z]/.test(strip(orig))) { out += orig; }
      else { out += guessed.has(n) ? orig : "•"; }
    }
    return out;
  }, [word, normalizedWord, guessed]);

  const remaining    = Math.max(0, MAX_MISTAKES - mistakes);
  const totalLetters = lettersInWord.size;

  // Anuncia início
  useEffect(() => {
    announce(`Jogo da Forca iniciado. A palavra tem ${lettersInWord.size} letras. Pressione uma letra do teclado para tentar.`);
  }, []); // eslint-disable-line

  const guessLetter = useCallback(
    (letter) => {
      if (won || lost) return;
      const L = letter.toUpperCase();
      if (!/[A-Z]/.test(L)) return;
      if (guessed.has(L)) {
        announce(`A letra ${L} já foi tentada.`);
        return;
      }
      setGuessed((prev) => new Set(prev).add(L));
      if (lettersInWord.has(L)) {
        announce(`Acertou! A letra ${L} está na palavra.`);
      } else {
        setMistakes((m) => {
          const next = m + 1;
          announce(`Errou. A letra ${L} não está na palavra. ${MAX_MISTAKES - next} chances restantes.`);
          return next;
        });
      }
    },
    [guessed, won, lost, lettersInWord]
  );

  // Teclado físico
  useEffect(() => {
    const onKey = (e) => {
      if (won || lost) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) { e.preventDefault(); guessLetter(key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guessLetter, won, lost]);

  const restart = () => {
    setWord(pickWord());
    setGuessed(new Set());
    setMistakes(0);
    setTime(0);
    setRunning(true);
    setTimeout(() => announce("Novo jogo iniciado. Boa sorte!"), 100);
  };

  const formatTime = (total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={goBack} className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold" aria-label="Voltar">
            ← Voltar
          </button>
          <h1 className="font-bold text-black">Jogo da Forca</h1>
          <div className="flex items-center gap-2">
            <button onClick={readScreen} className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white" aria-label="Ler situação do jogo da forca" title="Ler tela">
              🔊
            </button>
            <button onClick={restart} className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white" aria-label="Reiniciar jogo da forca">
              Reiniciar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Erros" value={mistakes} />
          <Stat label="Restantes" value={remaining} />
          <Stat label="Tempo" value={formatTime(time)} />
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500">Recorde</div>
            <div className="text-xs text-gray-500">Tempo {best?.time != null ? formatTime(best.time) : "--:--"}</div>
            <div className="text-xs text-gray-500">Menos erros {best?.mistakes ?? "--"}</div>
          </div>
        </div>

        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-4 text-gray-800">
          <HangmanSVG mistakes={mistakes} />
        </section>

        <section role="status" aria-live="polite" className="mb-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-sm uppercase tracking-wide text-black mb-1">Palavra</div>
          <div className="font-mono text-2xl sm:text-3xl text-black break-words">{reveal}</div>
          <div className="mt-2 text-xs text-black">
            Letras únicas: {totalLetters} • Acertos: {correctGuesses}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 select-none">
            {ALPHABET.map((L) => (
              <Key key={L} letter={L} pressed={guessed.has(L)} disabled={won || lost} onClick={() => guessLetter(L)} />
            ))}
          </div>
        </section>

        {won && (
          <div role="status" className="mt-6 p-4 rounded-xl bg-emerald-100 text-emerald-900 font-semibold text-center">
            Parabéns! Você acertou "{word}" com {mistakes} erro{mistakes !== 1 ? "s" : ""} em {formatTime(time)}.
          </div>
        )}
        {lost && (
          <div role="status" className="mt-6 p-4 rounded-xl bg-rose-100 text-rose-900 font-semibold text-center">
            Fim de jogo! A palavra era "{word}". Tente novamente.
          </div>
        )}
      </main>
    </div>
  );
}