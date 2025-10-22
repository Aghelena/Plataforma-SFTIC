// src/pages/Candy.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ===================== ESTILOS DAS ANIMAÇÕES ===================== */
const AnimStyles = () => (
  <style>{`
  @keyframes candy-explode {
    0%   { transform: scale(1);   opacity: 1; }
    100% { transform: scale(1.25); opacity: 0; }
  }
  .animate-explode { animation: candy-explode 0.35s ease-out forwards; }

  @keyframes candy-float {
    0%   { transform: translateY(0);   opacity: 1; }
    100% { transform: translateY(-14px); opacity: 0; }
  }
  .animate-float { animation: candy-float 0.45s ease-out forwards; }

  @keyframes candy-fall {
    0%   { transform: translateY(-10px); opacity: .7; }
    100% { transform: translateY(0);     opacity: 1; }
  }
  .animate-fall { animation: candy-fall 0.22s ease-out; }

  @keyframes candy-spawn {
    0%   { transform: scale(.9); opacity: .6; }
    100% { transform: scale(1);  opacity: 1; }
  }
  .animate-spawn { animation: candy-spawn 0.18s ease-out; }
  `}</style>
);

/* ========================== CONFIGURAÇÃO ========================== */
const ROWS = 9;
const COLS = 9;
const MOVES_LIMIT = 30;
const SCORE_PER_CANDY = 10;
const COMBO_BONUS = 5;

const CANDIES = [
  { id: "cherry",   emoji: "🍒", bg: "bg-rose-400" },
  { id: "lemon",    emoji: "🍋", bg: "bg-yellow-300" },
  { id: "grape",    emoji: "🍇", bg: "bg-violet-400" },
  { id: "candy",    emoji: "🍬", bg: "bg-pink-400" },
  { id: "lollipop", emoji: "🍭", bg: "bg-fuchsia-400" },
  { id: "cupcake",  emoji: "🧁", bg: "bg-sky-400" },
];
const gridClass = "grid grid-cols-9 gap-2 sm:gap-3";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const randCandy = () => CANDIES[Math.floor(Math.random() * CANDIES.length)].id;
const cloneBoard = (b) => b.map((row) => row.slice());
const createBoard = () =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => randCandy())
  );

/* ======================== MECÂNICA MATCH-3 ======================== */
function findMatches(board) {
  const matches = new Set();
  // horizontais
  for (let r = 0; r < ROWS; r++) {
    let count = 1;
    for (let c = 1; c <= COLS; c++) {
      const prev = c - 1;
      if (c < COLS && board[r][c] && board[r][prev] && board[r][c] === board[r][prev]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) matches.add(`${r},${c - 1 - k}`);
        }
        count = 1;
      }
    }
  }
  // verticais
  for (let c = 0; c < COLS; c++) {
    let count = 1;
    for (let r = 1; r <= ROWS; r++) {
      const prev = r - 1;
      if (r < ROWS && board[r][c] && board[prev][c] && board[r][c] === board[prev][c]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) matches.add(`${r - 1 - k},${c}`);
        }
        count = 1;
      }
    }
  }
  return matches;
}
function removeMatches(board, matches) {
  let removed = 0;
  matches.forEach((key) => {
    const [rs, cs] = key.split(",").map(Number);
    if (board[rs][cs]) {
      board[rs][cs] = null;
      removed++;
    }
  });
  return removed;
}
function applyGravityAndFill(board) {
  // retorna posições que "caíram" e recém-geradas (para animar)
  const fell = [];
  const spawned = [];
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        if (write !== r) fell.push(`${write},${c}`);
        board[write][c] = board[r][c];
        if (write !== r) board[r][c] = null;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      board[r][c] = randCandy();
      spawned.push(`${r},${c}`);
    }
  }
  return { fell, spawned };
}
function areAdjacent(a, b) {
  if (!a || !b) return false;
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/* ====================== COMPONENTES DE UI ========================= */
function CandyCell({
  candyId,
  selected,
  onClick,
  disabled,
  exploding,
  showPopup,
  popupText,
  falling,
  spawning,
}) {
  const candy = CANDIES.find((c) => c.id === candyId);
  const bg = candy?.bg ?? "bg-gray-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !candyId}
      aria-pressed={selected}
      className={[
        "relative h-12 sm:h-14 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center",
        "text-xl sm:text-2xl transition-transform focus:outline-none focus:ring-2 focus:ring-violet-400",
        selected ? "ring-2 ring-violet-400 scale-[1.02]" : "hover:scale-[1.01]",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        candyId ? bg : "bg-transparent border-transparent",
        exploding ? "animate-explode" : "",
        falling ? "animate-fall" : "",
        spawning ? "animate-spawn" : "",
      ].join(" ")}
    >
      <span className="drop-shadow-sm">{candy?.emoji ?? ""}</span>

      {showPopup && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-white/90 animate-float">
          {popupText}
        </span>
      )}
    </button>
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

/* ============================ PÁGINA ============================== */
export default function Candy() {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  // tabuleiro
  const [board, setBoard] = useState(() => createBoard());

  // seleção e estado
  const [selected, setSelected] = useState(null); // {r,c} | null
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES_LIMIT);
  const [busy, setBusy] = useState(false);
  const [chainsLastMove, setChainsLastMove] = useState(0);

  // animações
  const [explodingCells, setExplodingCells] = useState(new Set());
  const [popupCells, setPopupCells] = useState(new Map()); // key -> texto
  const [fallingCells, setFallingCells] = useState(new Set());
  const [spawnedCells, setSpawnedCells] = useState(new Set());

  const gameOver = moves <= 0;

  // recorde
  useEffect(() => {
    if (gameOver) {
      try {
        const best = JSON.parse(localStorage.getItem("candy_best") || "{}");
        const newBest = {
          score: best.score ? Math.max(best.score, score) : score,
        };
        localStorage.setItem("candy_best", JSON.stringify(newBest));
      } catch {}
    }
  }, [gameOver, score]);

  const best = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("candy_best") || "{}");
    } catch {
      return {};
    }
  }, [gameOver]);

  // referência do board atual
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // resolve cascatas com animações
  const resolveWithAnimations = useCallback(async (current) => {
    let combo = 0;

    let b = cloneBoard(current);
    while (true) {
      const matches = findMatches(b);
      if (matches.size === 0) break;
      combo++;

      // 1) explode + popup
      const removedCount = matches.size;
      const gainPerCandy = SCORE_PER_CANDY + (combo - 1) * COMBO_BONUS;
      const gainThis = removedCount * gainPerCandy;

      setExplodingCells(new Set(matches));
      const pop = new Map();
      matches.forEach((k) => pop.set(k, `+${gainPerCandy}`));
      setPopupCells(pop);

      setChainsLastMove(combo);
      setBusy(true);
      await delay(360);

      // 2) remove
      removeMatches(b, matches);
      setBoard(cloneBoard(b));
      setExplodingCells(new Set());
      setPopupCells(new Map());
      await delay(60);

      // 3) gravidade + spawn
      const { fell, spawned } = applyGravityAndFill(b);
      setFallingCells(new Set(fell));
      setSpawnedCells(new Set(spawned));
      setBoard(cloneBoard(b));
      await delay(240);
      setFallingCells(new Set());
      setSpawnedCells(new Set());

      // 4) pontos
      setScore((s) => s + gainThis);
    }
    setBusy(false);
    return { combo };
  }, []);

  // tentativa de troca
  const attemptSwap = useCallback(
    async (a, b) => {
      if (!areAdjacent(a, b) || gameOver) return;

      setBusy(true);
      setChainsLastMove(0);

      const prev = cloneBoard(boardRef.current);
      const next = cloneBoard(boardRef.current);
      // faz a troca
      const tmp = next[a.r][a.c];
      next[a.r][a.c] = next[b.r][b.c];
      next[b.r][b.c] = tmp;

      // aplica visualmente
      setBoard(next);
      await delay(0);

      // valida se gerou match
      const hadMatch = findMatches(next).size > 0;

      if (!hadMatch) {
        // desfaz
        setBoard(prev);
        setBusy(false);
        setSelected(null);
        return;
      }

      // houve match -> consome jogada e resolve animações/cascatas
      setMoves((mv) => Math.max(0, mv - 1));
      await resolveWithAnimations(next);

      setSelected(null);
      setBusy(false);
    },
    [resolveWithAnimations, gameOver]
  );

  // teclado: navegação + Enter troca com a última direção
  const lastDirRef = useRef(null); // "up" | "down" | "left" | "right"
  useEffect(() => {
    const onKey = (e) => {
      if (gameOver || busy) return;
      if (!selected) return;
      const { r, c } = selected;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        lastDirRef.current = "up";
        setSelected({ r: Math.max(0, r - 1), c });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        lastDirRef.current = "down";
        setSelected({ r: Math.min(ROWS - 1, r + 1), c });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        lastDirRef.current = "left";
        setSelected({ r, c: Math.max(0, c - 1) });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        lastDirRef.current = "right";
        setSelected({ r, c: Math.min(COLS - 1, c + 1) });
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!lastDirRef.current) return;
        const dir = lastDirRef.current;
        const target =
          dir === "up"    ? { r: Math.max(0, r - 1), c } :
          dir === "down"  ? { r: Math.min(ROWS - 1, r + 1), c } :
          dir === "left"  ? { r, c: Math.max(0, c - 1) } :
                            { r, c: Math.min(COLS - 1, c + 1) };
        attemptSwap(selected, target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, attemptSwap, busy, gameOver]);

  const clickCell = (r, c) => {
    if (busy || gameOver) return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    const target = { r, c };
    if (areAdjacent(selected, target)) {
      attemptSwap(selected, target);
    } else {
      setSelected({ r, c });
    }
  };

  const restart = async () => {
    setBusy(true);
    const b0 = createBoard();
    setBoard(b0);
    setSelected(null);
    setScore(0);
    setMoves(MOVES_LIMIT);
    setChainsLastMove(0);
    // opcional: resolver matches iniciais com animação
    await resolveWithAnimations(b0);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimStyles />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          <h1 className="font-bold text-black">Candy Crush</h1>

          <button
            onClick={restart}
            className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white"
          >
            Reiniciar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Painel */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Pontuação" value={score} />
          <Stat label="Jogadas" value={moves} />
          <Stat label="Combo" value={chainsLastMove > 0 ? `x${chainsLastMove}` : "—"} />
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-500">Recorde</div>
            <div className="text-lg font-bold text-gray-800">{best?.score ?? 0}</div>
          </div>
        </div>

        {/* Tabuleiro */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className={`${gridClass} select-none`}>
            {board.map((row, r) =>
              row.map((candyId, c) => {
                const key = `${r},${c}`;
                return (
                  <CandyCell
                    key={key}
                    candyId={candyId}
                    selected={selected?.r === r && selected?.c === c}
                    disabled={busy || gameOver}
                    exploding={explodingCells.has(key)}
                    showPopup={popupCells.has(key)}
                    popupText={popupCells.get(key) ?? ""}
                    falling={fallingCells.has(key)}
                    spawning={spawnedCells.has(key)}
                    onClick={() => clickCell(r, c)}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* Fim de jogo */}
        {gameOver && (
          <div
            role="status"
            className="mt-6 p-4 rounded-xl bg-amber-100 text-amber-900 font-semibold text-center"
          >
            Fim de jogo! Sua pontuação foi {score}.
          </div>
        )}
      </main>
    </div>
  );
}
