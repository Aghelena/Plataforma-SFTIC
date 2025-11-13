// src/pages/WoodBlock.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Regras rápidas:
 * - Tabuleiro 10x10.
 * - Sempre há 3 peças disponíveis. Coloque todas para gerar novas 3.
 * - Clique numa peça para selecioná-la; depois clique no tabuleiro para posicionar.
 * - Use "Rotacionar" para girar a peça atual (0/90/180/270).
 * - Limpar linha/coluna dá bônus. Jogo termina quando nenhuma peça cabe.
 */

const BOARD_SIZE = 10;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

// Paleta de peças (coords no bounding box da peça: [r, c])
// Mantidas relativamente simples para jogabilidade fluida.
const SHAPES = [
  // 1 bloco
  [[0, 0]],
  // 2 blocos
  [[0, 0], [0, 1]],
  // 3 em linha
  [[0, 0], [0, 1], [0, 2]],
  // 3 em coluna
  [[0, 0], [1, 0], [2, 0]],
  // L 3
  [[0, 0], [1, 0], [1, 1]],
  // Quadrado 2x2
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  // 4 em linha
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  // 5 em linha
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  // L 4 (3 + 1 para o lado)
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  // T
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  // Z
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  // S
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  // L longo (4)
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  // Cruz 5
  [[1, 1], [0, 1], [1, 0], [1, 2], [2, 1]],
  // 3 bloco diagonal (apenas variedade; se torna “L” após normalizar)
  [[0, 0], [1, 1], [2, 2]],
];

// Normaliza uma peça para começar em (0,0)
function normalize(shape) {
  const minR = Math.min(...shape.map(([r]) => r));
  const minC = Math.min(...shape.map(([, c]) => c));
  return shape.map(([r, c]) => [r - minR, c - minC]);
}

function rotate90(shape) {
  // Rotaciona em torno de (0,0): (r, c) -> (c, -r), depois normaliza
  const rotated = shape.map(([r, c]) => [c, -r]);
  return normalize(rotated);
}

function allRotations(shape) {
  const r0 = normalize(shape);
  const r1 = rotate90(r0);
  const r2 = rotate90(r1);
  const r3 = rotate90(r2);
  // Remove duplicatas (algumas peças são simétricas)
  const uniq = [];
  [r0, r1, r2, r3].forEach((s) => {
    const key = s
      .slice()
      .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]))
      .map(([r, c]) => `${r},${c}`)
      .join(";");
    if (!uniq.some((u) => u.key === key)) uniq.push({ key, shape: s });
  });
  return uniq.map((u) => u.shape);
}

function makeEmptyBoard() {
  return Array(CELL_COUNT).fill(0);
}

function idx(r, c) {
  return r * BOARD_SIZE + c;
}

function inBounds(r, c) {
  return r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;
}

function randomPieces(n = 3) {
  const picks = [];
  for (let i = 0; i < n; i++) {
    const base = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    picks.push(normalize(base));
  }
  return picks;
}

function canPlace(board, shape, startR, startC) {
  for (const [dr, dc] of shape) {
    const r = startR + dr;
    const c = startC + dc;
    if (!inBounds(r, c)) return false;
    if (board[idx(r, c)] === 1) return false;
  }
  return true;
}

function applyPlacement(board, shape, startR, startC) {
  const next = board.slice();
  for (const [dr, dc] of shape) {
    const r = startR + dr;
    const c = startC + dc;
    next[idx(r, c)] = 1;
  }
  return next;
}

// Verifica linhas/colunas completas e limpa; retorna {board, linesCleared}
function clearLines(board) {
  const grid = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    grid.push(board.slice(r * BOARD_SIZE, r * BOARD_SIZE + BOARD_SIZE));
  }

  const fullRows = [];
  const fullCols = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (grid[r].every((v) => v === 1)) fullRows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (grid[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) fullCols.push(c);
  }

  if (fullRows.length === 0 && fullCols.length === 0) {
    return { board, linesCleared: 0 };
  }

  // Zera linhas/colunas completas
  const next = board.slice();
  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) next[idx(r, c)] = 0;
  }
  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) next[idx(r, c)] = 0;
  }

  return { board: next, linesCleared: fullRows.length + fullCols.length };
}

function anyPieceFits(board, pieces) {
  for (const shape of pieces) {
    const rotations = allRotations(shape);
    for (const rot of rotations) {
      // Tenta todas as posições do tabuleiro
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (canPlace(board, rot, r, c)) return true;
        }
      }
    }
  }
  return false;
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

function PiecePreview({ shape, selected, onSelect }) {
  // Renderiza num mini grid (até 5x5) para caber bem, mantendo padding
  const norm = normalize(shape);
  const maxR = Math.max(...norm.map(([r]) => r));
  const maxC = Math.max(...norm.map(([, c]) => c));
  const rows = Math.max(3, maxR + 1);
  const cols = Math.max(3, maxC + 1);

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fill = norm.some(([rr, cc]) => rr === r && cc === c);
      cells.push(
        <div
          key={`${r}-${c}`}
          className={[
            "w-5 h-5 sm:w-6 sm:h-6 rounded-md border",
            fill ? "bg-sky-500 border-sky-600" : "bg-white border-gray-200",
          ].join(" ")}
        />
      );
    }
  }

  return (
    <button
      onClick={onSelect}
      className={[
        "p-3 rounded-xl border shadow-sm transition-transform",
        selected
          ? "border-violet-500 ring-2 ring-violet-300"
          : "border-gray-200 hover:scale-[1.01]",
        "bg-white",
      ].join(" ")}
      aria-pressed={selected}
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(1rem, 1fr))`,
        }}
      >
        {cells}
      </div>
    </button>
  );
}

export default function WoodBlock() {
  const navigate = useNavigate();
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  const [board, setBoard] = useState(() => makeEmptyBoard());
  const [pieces, setPieces] = useState(() => randomPieces(3));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [rotation, setRotation] = useState(0); // 0..3 passos de 90°
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const best = useMemo(() => {
    try {
      return Number(localStorage.getItem("woodblock_best") || "0");
    } catch {
      return 0;
    }
  }, [gameOver]);

  const selectedPiece = useMemo(() => {
    if (selectedIndex === null) return null;
    let s = pieces[selectedIndex];
    for (let i = 0; i < rotation; i++) s = rotate90(s);
    return s;
  }, [pieces, selectedIndex, rotation]);

  // Verifica se acabou (nenhuma peça cabe)
  useEffect(() => {
    if (pieces.length === 0) return; // acaba de jogar; virão novas
    if (!anyPieceFits(board, pieces)) {
      setGameOver(true);
      try {
        const current = Number(localStorage.getItem("woodblock_best") || "0");
        if (score > current) {
          localStorage.setItem("woodblock_best", String(score));
        }
      } catch {}
    }
  }, [board, pieces, score]);

  // Quando todas as 3 peças forem usadas, gera novas 3
  useEffect(() => {
    if (pieces.length === 0 && !gameOver) {
      setPieces(randomPieces(3));
      setSelectedIndex(null);
      setRotation(0);
    }
  }, [pieces, gameOver]);

  function restart() {
    setBoard(makeEmptyBoard());
    setPieces(randomPieces(3));
    setSelectedIndex(null);
    setRotation(0);
    setScore(0);
    setGameOver(false);
  }

  function handleRotate() {
    if (selectedIndex === null) return;
    setRotation((r) => (r + 1) % 4);
  }

  function handleCellClick(r, c) {
    if (gameOver) return;
    if (selectedIndex === null) return;
    const shape = selectedPiece;
    if (!shape) return;

    if (!canPlace(board, shape, r, c)) return;

    // Coloca e pontua
    let placed = applyPlacement(board, shape, r, c);
    let basePoints = shape.length; // 1 ponto por bloco colocado
    const cleared = clearLines(placed);
    const bonus = cleared.linesCleared * 10; // bônus por linha/coluna
    placed = cleared.board;

    setBoard(placed);
    setScore((s) => s + basePoints + bonus);

    // Remove a peça utilizada
    setPieces((ps) => ps.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
    setRotation(0);
  }

  const gridCols = "grid grid-cols-10 gap-1 sm:gap-1.5";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          <h1 className="font-bold text-black">Wood Block</h1>

          <button
            onClick={restart}
            className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white"
          >
            Reiniciar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Painel de status */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Pontuação" value={score} />
          <Stat label="Recorde" value={best} />
        </div>

        {/* Tabuleiro */}
        <section
          className={`${gridCols} select-none rounded-2xl p-2 bg-white shadow-sm border border-gray-100`}
        >
          {Array.from({ length: BOARD_SIZE }).map((_, r) =>
            Array.from({ length: BOARD_SIZE }).map((__, c) => {
              const filled = board[idx(r, c)] === 1;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={[
                    "h-7 w-7 sm:h-9 sm:w-9 rounded-md border transition-transform",
                    filled
                      ? "bg-sky-500 border-sky-600"
                      : "bg-gray-50 border-gray-200 hover:scale-[1.02]",
                  ].join(" ")}
                  aria-label={`Célula ${r + 1}, ${c + 1} ${
                    filled ? "ocupada" : "vazia"
                  }`}
                />
              );
            })
          )}
        </section>

        {/* Peças disponíveis */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Peças disponíveis
            </h2>
            <button
              onClick={handleRotate}
              className="px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm text-sm font-semibold hover:bg-gray-50"
              aria-label="Rotacionar peça selecionada"
            >
              Rotacionar ↻
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {pieces.map((p, i) => {
              // Renderiza a peça na rotação atual somente se selecionada; senão, preview base
              const preview =
                selectedIndex === i
                  ? (() => {
                      let s = p;
                      for (let k = 0; k < rotation; k++) s = rotate90(s);
                      return s;
                    })()
                  : p;

              return (
                <PiecePreview
                  key={i}
                  shape={preview}
                  selected={selectedIndex === i}
                  onSelect={() =>
                    setSelectedIndex((cur) => (cur === i ? null : i))
                  }
                />
              );
            })}
          </div>
        </section>

        {/* Mensagem de fim de jogo */}
        {gameOver && (
          <div
            role="status"
            className="mt-6 p-4 rounded-xl bg-rose-100 text-rose-900 font-semibold text-center"
          >
            Fim de jogo! Nenhuma peça disponível cabe no tabuleiro.
          </div>
        )}
      </main>
    </div>
  );
}
