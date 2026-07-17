// src/pages/Memory.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";

/* ============================================================
   JOGOS DISPONÍVEIS
   Cada jogo tem seus próprios pares (valor exibido + rótulo
   falado/anunciado) e o número de colunas do tabuleiro.
   ============================================================ */
const MEMORY_GAMES = [
  {
    id: "memory-formas",
    title: "Formas e Cores",
    description: "4 pares — nível fácil.",
    cols: 4,
    items: [
      { value: "🔴", label: "Círculo vermelho" },
      { value: "🔵", label: "Círculo azul" },
      { value: "🟩", label: "Quadrado verde" },
      { value: "🟨", label: "Quadrado amarelo" },
    ],
  },
  {
    id: "memory-animais",
    title: "Animais",
    description: "6 pares — nível médio.",
    cols: 4,
    items: [
      { value: "🐶", label: "Cachorro" },
      { value: "🐱", label: "Gato" },
      { value: "🐰", label: "Coelho" },
      { value: "🐵", label: "Macaco" },
      { value: "🐸", label: "Sapo" },
      { value: "🐷", label: "Porco" },
    ],
  },
  {
    id: "memory-frutas",
    title: "Frutas",
    description: "8 pares — nível difícil.",
    cols: 4,
    items: [
      { value: "🍎", label: "Maçã" },
      { value: "🍌", label: "Banana" },
      { value: "🍇", label: "Uva" },
      { value: "🍉", label: "Melancia" },
      { value: "🍓", label: "Morango" },
      { value: "🥝", label: "Kiwi" },
      { value: "🍑", label: "Pêssego" },
      { value: "🍍", label: "Abacaxi" },
    ],
  },
];

// >>> Parâmetros ajustáveis do bloqueio de ações
const MS_PER_CHAR = 55;
const MIN_LOCK_MS = 1500;
const EXTRA_BUFFER_MS = 500;

function estimateSpeechDuration(text) {
  return Math.max(MIN_LOCK_MS, text.length * MS_PER_CHAR) + EXTRA_BUFFER_MS;
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeDeck(items) {
  const base = items.flatMap((item, idx) => [
    { id: `${idx}-a`, value: item.value, label: item.label, matched: false },
    { id: `${idx}-b`, value: item.value, label: item.label, matched: false },
  ]);
  return shuffle(base);
}

const Card = React.forwardRef(function Card(
  { card, flipped, locked, tabIndex, onFlip, onKeyDown, onFocus },
  ref
) {
  const matched = card.matched;
  const interactive = !matched && !locked;

  function handleActivate() {
    if (!interactive) return;
    onFlip(card);
  }

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={tabIndex}
      onClick={handleActivate}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      // Nunca usamos "disabled" nativo aqui: ele tiraria a carta do
      // tabIndex e quebraria a navegação por setas do tabuleiro.
      // aria-disabled comunica o estado sem remover o foco do fluxo.
      aria-disabled={!interactive ? true : undefined}
      aria-pressed={flipped}
      aria-label={
        flipped || matched ? `Carta ${card.label}` : "Carta virada para baixo"
      }
      className={[
        "relative h-24 sm:h-28 rounded-2xl shadow-md",
        "flex items-center justify-center text-3xl sm:text-4xl font-bold",
        "transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        flipped || matched
          ? "bg-white text-black"
          : "bg-sky-500 text-white",
        !interactive ? "opacity-80 cursor-not-allowed" : "hover:scale-[1.02]",
      ].join(" ")}
    >
      {flipped || matched ? card.value : "?"}
      {matched && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full"
        >
          ok
        </span>
      )}
    </button>
  );
});

function GameSelector({ onSelect, onAnnounce, headingRef }) {
  return (
    <section aria-labelledby="games-heading" aria-describedby="selector-instrucoes">
      <h2
        id="games-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold text-gray-800 mb-4 focus:outline-none"
      >
        Escolha um jogo da memória
      </h2>
      <p id="selector-instrucoes" className="sr-only">
        Use Tab para navegar entre os jogos disponíveis, e Enter para escolher um.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEMORY_GAMES.map((game) => (
          <div
            key={game.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {game.title}
              </h3>
              <p className="text-gray-500 text-sm mt-1">{game.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(game)}
              onFocus={() => onAnnounce(`Jogo: ${game.title}. ${game.description} Pressione Enter para começar.`)}
              className="mt-3 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
              aria-label={`Jogar ${game.title}`}
            >
              Jogar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Memory() {
  const navigate = useNavigate();
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  const [currentGame, setCurrentGame] = useState(null); // null = tela de seleção

  const [deck, setDeck] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const liveRef = useRef(null);
  const pendingTimeoutRef = useRef(null);
  const cardRefs = useRef([]);
  const selectorHeadingRef = useRef(null);
  const resultRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => (liveRef.current.textContent = msg), 20);
    }
  }

  const COMANDOS_TABULEIRO =
    "Use as setas do teclado para navegar entre as cartas, e Enter ou Espaço para virar a carta selecionada.";

  // Anúncio de boas-vindas ao carregar a tela de seleção, uma única
  // vez, explicando o comando de teclado desta tela.
  useEffect(() => {
    const t = setTimeout(() => {
      announce("Escolha um jogo da memória. Use Tab para navegar entre os jogos disponíveis, e Enter para escolher um.");
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  function startGame(game) {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setCurrentGame(game);
    setDeck(makeDeck(game.items));
    setFirst(null);
    setSecond(null);
    setLock(false);
    setMoves(0);
    setTime(0);
    setRunning(true);
    setActiveIndex(0);
    cardRefs.current = [];
    announce(`Jogo ${game.title} iniciado. Boa sorte! ${COMANDOS_TABULEIRO}`);

    // Leva o foco para a primeira carta do tabuleiro — sem isso, o
    // foco ficava perdido no <body> ao trocar de tela.
    setTimeout(() => cardRefs.current[0]?.focus(), 50);
  }

  function backToSelection() {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setRunning(false);
    setCurrentGame(null);
    announce("Voltando para a lista de jogos. Use Tab para navegar entre os jogos disponíveis, e Enter para escolher um.");

    // Leva o foco de volta para o título da lista de jogos.
    setTimeout(() => selectorHeadingRef.current?.focus(), 50);
  }

  function readScreen() {
    if (lock || !currentGame) return;
    const matchedPairs = deck.filter((card) => card.matched).length / 2;
    const totalPairs = currentGame.items.length;

    const msg = [
      `Jogo da Memória: ${currentGame.title}.`,
      "O objetivo é encontrar todos os pares de cartas iguais.",
      `O jogo tem ${totalPairs} pares no total.`,
      `Você já encontrou ${matchedPairs} pares.`,
      `Você fez ${moves} jogadas até agora.`,
      COMANDOS_TABULEIRO,
      "Se as duas cartas forem iguais, formam um par. Se forem diferentes, tente novamente.",
    ].join(" ");

    announce(msg);
  }

  const allMatched = useMemo(
    () => deck.length > 0 && deck.every((c) => c.matched),
    [deck]
  );

  // cronômetro
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // salvar recorde por jogo ao concluir + levar o foco pro resultado
  useEffect(() => {
    if (allMatched && currentGame) {
      setRunning(false);
      try {
        const key = `memory_best_${currentGame.id}`;
        const best = JSON.parse(localStorage.getItem(key) || "{}");
        const newBest = {
          time: best.time ? Math.min(best.time, time) : time,
          moves: best.moves ? Math.min(best.moves, moves) : moves,
        };
        localStorage.setItem(key, JSON.stringify(newBest));
      } catch {}
      announce(`Parabéns! Você concluiu o jogo com ${moves} jogadas.`);
      const t = setTimeout(() => resultRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  const best = useMemo(() => {
    if (!currentGame) return {};
    try {
      return JSON.parse(
        localStorage.getItem(`memory_best_${currentGame.id}`) || "{}"
      );
    } catch {
      return {};
    }
  }, [allMatched, currentGame]);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    };
  }, []);

  const flip = (card) => {
    if (lock) return;
    if (first?.id === card.id || card.matched) return;

    if (!first) {
      setFirst(card);
      announce(`Primeira carta virada: ${card.label}.`);
      return;
    }

    setSecond(card);
    setLock(true);

    let secondMessage = "";
    setMoves((m) => {
      const next = m + 1;
      secondMessage = `Segunda carta virada: ${card.label}. Jogada número ${next}.`;
      return next;
    });
    announce(secondMessage);

    const isMatch = first.value === card.value;
    const resultMessage = isMatch
      ? `Par formado: ${card.label}.`
      : "Não combinam. Tente novamente.";

    const lockDuration =
      estimateSpeechDuration(secondMessage) +
      estimateSpeechDuration(resultMessage);

    if (isMatch) {
      setDeck((d) =>
        d.map((c) => (c.value === card.value ? { ...c, matched: true } : c))
      );
    }

    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(() => {
      setFirst(null);
      setSecond(null);
      setLock(false);
      announce(resultMessage);
      pendingTimeoutRef.current = null;
    }, lockDuration);
  };

  // Agora protegido contra ser chamado enquanto uma fala/bloqueio
  // ainda está em andamento — antes não tinha nenhuma checagem.
  const restart = () => {
    if (lock || !currentGame) return;
    startGame(currentGame);
  };

  // ---- Navegação por teclado no tabuleiro (roving tabindex) ----
  function handleGridKeyDown(e, index) {
    if (!currentGame) return;
    const cols = currentGame.cols;
    const total = deck.length;
    let next = index;

    switch (e.key) {
      case "ArrowRight":
        next = Math.min(index + 1, total - 1);
        break;
      case "ArrowLeft":
        next = Math.max(index - 1, 0);
        break;
      case "ArrowDown":
        next = Math.min(index + cols, total - 1);
        break;
      case "ArrowUp":
        next = Math.max(index - cols, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = total - 1;
        break;
      default:
        return; // deixa Enter/Espaço/Tab seguirem o comportamento nativo
    }

    e.preventDefault();
    setActiveIndex(next);
    cardRefs.current[next]?.focus();
  }

  // Anuncia o estado da carta ao receber foco (clique, Tab ou setas).
  function handleCardFocus(card, index, interactive) {
    setActiveIndex(index);
    if (card.matched) {
      announce(`Carta ${card.label}, já encontrada.`);
    } else if (!interactive) {
      announce("Carta virada para baixo. Aguarde a fala terminar.");
    } else {
      announce("Carta virada para baixo. Pressione Enter para virar.");
    }
  }

  const gridColsClass =
    currentGame?.cols === 4 ? "grid grid-cols-4 gap-3 sm:gap-4" : "grid grid-cols-4 gap-3 sm:gap-4";

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={liveRef}
      />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={currentGame ? backToSelection : goBack}
            onFocus={() => announce(currentGame
              ? "Botão: Trocar jogo. Isso não sai da página, só volta para a lista de jogos da memória. Pressione Enter para confirmar."
              : "Botão: Voltar. Isso vai sair do Jogo da Memória e voltar para a tela inicial da plataforma. Pressione Enter para confirmar.")}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={currentGame ? "Voltar para a lista de jogos" : "Voltar"}
          >
            ← {currentGame ? "Trocar jogo" : "Voltar"}
          </button>

          <h1 className="font-bold text-black">
            {currentGame ? `Memória: ${currentGame.title}` : "Jogo da Memória"}
          </h1>

          <div className="flex items-center gap-2">
            {currentGame && (
              <>
                <button
                  type="button"
                  onClick={readScreen}
                  onFocus={() => announce("Botão: Ler tela. Pressione Enter para ouvir a situação atual do jogo.")}
                  aria-disabled={lock ? true : undefined}
                  className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
                  aria-label="Ler instruções do jogo da memória"
                  title="Ler tela"
                >
                  🔊
                </button>
                <button
                  type="button"
                  onClick={restart}
                  onFocus={() => announce("Botão: Reiniciar. Pressione Enter para começar este jogo de novo.")}
                  aria-disabled={lock ? true : undefined}
                  className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
                >
                  Reiniciar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="conteudo" className="max-w-5xl mx-auto px-4 py-6">
        {!currentGame ? (
          <GameSelector onSelect={startGame} onAnnounce={announce} headingRef={selectorHeadingRef} />
        ) : (
          <>
            <div
              className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2"
              aria-label="Estatísticas da partida"
            >
              <Stat label="Jogadas" value={moves} />
              <Stat label="Tempo" value={formatTime(time)} />
              <Stat
                label="Melhor tempo"
                value={best.time !== undefined ? formatTime(best.time) : "—"}
              />
              <Stat
                label="Melhor jogadas"
                value={best.moves !== undefined ? best.moves : "—"}
              />
            </div>

            <p className="sr-only" id="tabuleiro-instrucoes">
              {COMANDOS_TABULEIRO}
            </p>

            <section
              className={`${gridColsClass} select-none`}
              role="group"
              aria-label={`Tabuleiro do jogo da memória: ${currentGame.title}`}
              aria-describedby="tabuleiro-instrucoes"
            >
              {deck.map((card, index) => {
                const flipped =
                  first?.id === card.id ||
                  second?.id === card.id ||
                  card.matched;
                const interactive = !card.matched && !lock;
                return (
                  <Card
                    key={card.id}
                    ref={(el) => (cardRefs.current[index] = el)}
                    card={card}
                    flipped={flipped}
                    locked={lock}
                    tabIndex={activeIndex === index ? 0 : -1}
                    onFlip={flip}
                    onFocus={() => handleCardFocus(card, index, interactive)}
                    onKeyDown={(e) => handleGridKeyDown(e, index)}
                  />
                );
              })}
            </section>

            {allMatched && (
              <div
                ref={resultRef}
                tabIndex={-1}
                role="status"
                className="mt-6 p-4 rounded-xl bg-emerald-100 text-emerald-900 font-semibold text-center focus:outline-none"
              >
                Parabéns! Você concluiu o jogo com {moves} jogadas.
              </div>
            )}
          </>
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