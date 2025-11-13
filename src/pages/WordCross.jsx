// src/pages/WordCross.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Layout: Voltar/Título/Reiniciar → Stats → Grid → Letras (igual ao seu).
 * A11y: teclado, aria-live, labels; leitor por voz (Web Speech API) com toggle.
 */

// ======== NÍVEL (PORTUGUÊS) ========
const LEVEL_LETTERS = ["A", "M", "O", "R"];

const LEVEL_PLACEMENTS = [
  { word: "ROMA", cells: [[0,0],[0,1],[0,2],[0,3]] },
  { word: "RAMO", cells: [[1,0],[1,1],[1,2],[1,3]] },
  { word: "AMOR", cells: [[2,1],[2,2],[2,3],[2,4]] },
  { word: "MAR",  cells: [[2,2],[3,2],[4,2]] },
  { word: "ORA",  cells: [[1,4],[2,4],[3,4]] },
  { word: "AMO",  cells: [[0,5],[1,5],[2,5]] },
  { word: "MORA", cells: [[5,1],[5,2],[5,3],[5,4]] },
];

const GRID_ROWS = Math.max(...LEVEL_PLACEMENTS.flatMap(p => p.cells.map(([r]) => r))) + 1;
const GRID_COLS = Math.max(...LEVEL_PLACEMENTS.flatMap(p => p.cells.map(([, c]) => c))) + 1;

function buildEmptyGrid(rows, cols) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ block: true, letter: "", filled: false }))
  );
  for (const p of LEVEL_PLACEMENTS) {
    for (const [r, c] of p.cells) grid[r][c].block = false;
  }
  return grid;
}
function deepCloneGrid(g) { return g.map(row => row.map(c => ({ ...c }))); }
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----- Acessibilidade: narração (Web Speech API) -----
function speak(text) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  );
}

export default function WordCross() {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  const [grid, setGrid] = useState(() => buildEmptyGrid(GRID_ROWS, GRID_COLS));
  const [letters, setLetters] = useState(() => shuffle(LEVEL_LETTERS));
  const [selection, setSelection] = useState([]); // índices na barra de letras
  const [found, setFound] = useState(() => new Set());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem("wordcross_best") || "0"); } catch { return 0; }
  });
  const [ttsOn, setTtsOn] = useState(true);
  const liveRef = useRef(null);

  const allFound = LEVEL_PLACEMENTS.every(p => found.has(p.word));

  useEffect(() => {
    if (!allFound) return;
    try {
      const current = Number(localStorage.getItem("wordcross_best") || "0");
      if (score > current) {
        localStorage.setItem("wordcross_best", String(score));
        setBest(score);
      }
    } catch {}
    announce("Parabéns! Você completou o nível.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFound]);

  function restart() {
    setGrid(buildEmptyGrid(GRID_ROWS, GRID_COLS));
    setLetters(shuffle(LEVEL_LETTERS));
    setSelection([]);
    setFound(new Set());
    setScore(0);
    announce("Novo jogo iniciado.");
  }

  // ---- A11y helpers ----
  function announce(msg) {
    if (ttsOn) speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => (liveRef.current.textContent = msg), 20);
    }
  }

  const currentWord = selection.map(i => letters[i]).join("");

  function onPickLetter(i) {
    setSelection(sel => [...sel, i]);
    const nextWord = currentWord + letters[i];
    announce(`Letra ${letters[i]} selecionada. Palavra: ${nextWord}`);
  }

  function onBackspace() {
    setSelection(sel => sel.slice(0, -1));
    announce("Última letra removida.");
  }

  function onClear() {
    setSelection([]);
    announce("Seleção limpa.");
  }

  function onShuffle() {
    setLetters(prev => shuffle(prev));
    setSelection([]);
    announce("Letras embaralhadas.");
  }

  function findPlacementForWord(word) {
    return LEVEL_PLACEMENTS.find(p => p.word === word && !found.has(p.word));
  }

  function conflictsWithGrid(g, placement, word) {
    for (let k = 0; k < placement.cells.length; k++) {
      const [r, c] = placement.cells[k];
      const cell = g[r][c];
      if (cell.filled && cell.letter !== word[k]) return true;
    }
    return false;
  }

  function onSubmit() {
    const word = currentWord;
    if (!word) return;

    const placement = findPlacementForWord(word);
    if (!placement) {
      announce("Palavra inválida ou já descoberta.");
      return;
    }
    const g = deepCloneGrid(grid);
    if (conflictsWithGrid(g, placement, word)) {
      announce("Conflito com letras já preenchidas. Tente outra palavra.");
      return;
    }
    placement.cells.forEach(([r, c], idx) => {
      g[r][c].letter = word[idx];
      g[r][c].filled = true;
    });
    setGrid(g);
    setFound(prev => new Set(prev).add(word));
    setScore(s => s + word.length);
    setSelection([]);
    announce(`Correto: ${word}. Pontos +${word.length}.`);
  }

  // ---- Render ----
  // ⚠️ Em vez de Tailwind dinâmica (grid-cols-${GRID_COLS}), definimos via style,
  // para evitar purge do JIT e qualquer “erro” de classe não gerada.
  const gridClass = "grid gap-1 sm:gap-1.5";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Região "live" para leitores de tela */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          <h1 className="font-bold text-black">Palavras Cruzadas</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTtsOn(v => !v);
                announce(`Leitor ${!ttsOn ? "ativado" : "desativado"}.`);
              }}
              className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white"
              aria-pressed={ttsOn}
              aria-label={ttsOn ? "Desativar leitor de tela por voz" : "Ativar leitor de tela por voz"}
              title="Leitor (voz)"
            >
              {ttsOn ? "🔊" : "🔈"}
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

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Pontuação" value={score} />
          <Stat label="Recorde" value={best} />
          <Stat label="Selecionadas" value={currentWord || "—"} />
          <Stat label="Restantes" value={LEVEL_PLACEMENTS.length - [...found].length} />
        </div>

        {/* Grid (cruzadinho) */}
        <section
          className={`${gridClass} select-none rounded-2xl p-2 bg-white shadow-sm border border-gray-100`}
          role="grid"
          aria-label="Tabuleiro de palavras"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, r) =>
            Array.from({ length: GRID_COLS }).map((__, c) => {
              const cell = grid[r][c];
              const blocked = cell.block;
              return (
                <div
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-disabled={blocked}
                  aria-label={
                    blocked
                      ? `Célula ${r + 1}, ${c + 1}, bloqueada`
                      : `Célula ${r + 1}, ${c + 1}, ${cell.filled ? `letra ${cell.letter}` : "vazia"}`
                  }
                  className={[
                    "h-9 sm:h-11 rounded-md border text-center flex items-center justify-center font-bold",
                    blocked
                      ? "bg-gray-200 border-gray-300 text-gray-300"
                      : "bg-sky-50 border-sky-200 text-sky-900",
                  ].join(" ")}
                >
                  {!blocked && (cell.filled ? cell.letter : "")}
                </div>
              );
            })
          )}
        </section>

        {/* Letras / Controles */}
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Letras</h2>
            <div className="flex gap-2">
              <button
                onClick={onShuffle}
                className="px-3 py-1.5 rounded-md text-black bg-white border border-gray-200 shadow-sm text-sm font-semibold hover:bg-gray-50"
                aria-label="Embaralhar letras"
              >
                Embaralhar
              </button>
              <button
                onClick={onClear}
                className="px-3 py-1.5 rounded-md text-black bg-white border border-gray-200 shadow-sm text-sm font-semibold hover:bg-gray-50"
                aria-label="Limpar seleção"
              >
                Limpar
              </button>
              <button
                onClick={onBackspace}
                className="px-3 py-1.5 rounded-md text-black bg-white border border-gray-200 shadow-sm text-sm font-semibold hover:bg-gray-50"
                aria-label="Remover última letra"
              >
                Apagar ⌫
              </button>
              <button
                onClick={onSubmit}
                className="px-3 py-1.5 rounded-md bg-sky-600 text-black shadow-sm text-sm font-semibold hover:bg-sky-700"
                aria-label="Enviar palavra"
              >
                Enviar ✓
              </button>
            </div>
          </div>

          {/* Barra de letras */}
          <div className="grid grid-cols-4 text-black sm:grid-cols-8 gap-3">
            {letters.map((ch, i) => {
              const timesPicked = selection.filter(ix => ix === i).length;
              return (
                <button
                  key={i}
                  onClick={() => onPickLetter(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPickLetter(i);
                    }
                  }}
                  className={[
                    "h-12 sm:h-14 rounded-xl border bg-white shadow-sm font-bold text-lg",
                    "transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-violet-400",
                    timesPicked ? "border-sky-400" : "border-gray-200",
                  ].join(" ")}
                  aria-pressed={timesPicked > 0}
                  aria-label={`Letra ${ch}${timesPicked ? `, selecionada ${timesPicked} vez(es)` : ""}`}
                  title={`Letra ${ch}`}
                >
                  {ch}
                  {timesPicked > 0 && (
                    <span className="ml-2 text-xs font-semibold text-sky-600">{timesPicked}×</span>
                  )}
                </button>
              );
            })}
          </div>

          {allFound && (
            <div
              role="status"
              className="mt-2 p-4 rounded-xl bg-emerald-100 text-emerald-900 font-semibold text-center"
            >
              Parabéns! Você concluiu: {LEVEL_PLACEMENTS.map(p => p.word).join(", ")}.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
