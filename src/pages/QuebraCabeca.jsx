import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";
import { getPlayer } from "../lib/player";
import { apiFetch } from "../lib/api.js";

/* ============================================================
   DESAFIOS
   Cada desafio tem um tema (emoji + nome) e 3 peças candidatas,
   sendo só uma delas igual ao tema (a peça "certa").
   ============================================================ */
const DESAFIOS = [
  {
    tema: "Rosquinha",
    emoji: "🍩",
    pergunta: "Arraste (ou selecione) a peça para completar a rosquinha!",
    audio: "Falta um pedaço na rosquinha. Escolha a peça certa para completar.",
    pecas: [
      { id: 1, emoji: "🍕", nome: "Pedaço de pizza", correta: false },
      { id: 2, emoji: "🍩", nome: "Pedaço de rosquinha", correta: true },
      { id: 3, emoji: "🧁", nome: "Pedaço de cupcake", correta: false },
    ],
  },
  {
    tema: "Urso",
    emoji: "🧸",
    pergunta: "Arraste (ou selecione) a peça para completar o urso!",
    audio: "Falta uma peça no urso de pelúcia. Escolha a peça que combina.",
    pecas: [
      { id: 4, emoji: "🧸", nome: "Pedaço de urso", correta: true },
      { id: 5, emoji: "🐶", nome: "Pedaço de cachorro", correta: false },
      { id: 6, emoji: "🎈", nome: "Pedaço de balão", correta: false },
    ],
  },
  {
    tema: "Bola",
    emoji: "⚽",
    pergunta: "Arraste (ou selecione) a peça para completar a bola!",
    audio: "Falta uma peça na bola de futebol. Escolha a peça certa.",
    pecas: [
      { id: 7, emoji: "🍎", nome: "Pedaço de maçã", correta: false },
      { id: 8, emoji: "📘", nome: "Pedaço de livro", correta: false },
      { id: 9, emoji: "⚽", nome: "Pedaço de bola", correta: true },
    ],
  },
  {
    tema: "Guarda-chuva",
    emoji: "☂️",
    pergunta: "Arraste (ou selecione) a peça para completar o guarda-chuva!",
    audio: "Falta uma peça no guarda-chuva. Escolha a peça que combina.",
    pecas: [
      { id: 10, emoji: "☂️", nome: "Pedaço de guarda-chuva", correta: true },
      { id: 11, emoji: "🌵", nome: "Pedaço de cacto", correta: false },
      { id: 12, emoji: "🚗", nome: "Pedaço de carro", correta: false },
    ],
  },
  {
    tema: "Coração",
    emoji: "❤️",
    pergunta: "Arraste (ou selecione) a peça para completar o coração!",
    audio: "Falta uma peça no coração. Escolha a peça certa para completar.",
    pecas: [
      { id: 13, emoji: "🔷", nome: "Pedaço de losango", correta: false },
      { id: 14, emoji: "🍋", nome: "Pedaço de limão", correta: false },
      { id: 15, emoji: "❤️", nome: "Pedaço de coração", correta: true },
    ],
  },
  {
    tema: "Sol",
    emoji: "☀️",
    pergunta: "Arraste (ou selecione) a peça para completar o sol!",
    audio: "Falta uma peça no sol. Escolha a peça que combina.",
    pecas: [
      { id: 16, emoji: "☀️", nome: "Pedaço de sol", correta: true },
      { id: 17, emoji: "🐟", nome: "Pedaço de peixe", correta: false },
      { id: 18, emoji: "🎩", nome: "Pedaço de chapéu", correta: false },
    ],
  },
];

const MS_PER_CHAR = 55;
const MIN_LOCK_MS = 1200;
const EXTRA_BUFFER_MS = 400;

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

export default function QuebraCabeca() {
  const navigate = useNavigate();
  const player = getPlayer();

  const [fase, setFase] = useState(0);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [pecaAtivaId, setPecaAtivaId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(false);
  const [pecasEmbaralhadas, setPecasEmbaralhadas] = useState([]);
  const [resolvido, setResolvido] = useState(false);
  const [lock, setLock] = useState(false);

  const liveRef = useRef(null);
  const perguntaRef = useRef(null);
  const resultRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  const desafioAtual = DESAFIOS[fase];

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  function announceAndLock(msg, onDone) {
    announce(msg);
    setLock(true);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setLock(false);
      lockTimeoutRef.current = null;
      if (onDone) onDone();
    }, estimateSpeechDuration(msg));
  }

  useEffect(() => {
    if (desafioAtual) {
      setPecasEmbaralhadas(shuffle(desafioAtual.pecas));
      setPecaAtivaId(null);
      setResolvido(false);
    }
  }, [fase, desafioAtual]);

  useEffect(() => {
    if (desafioAtual && !finalizado) {
      const t1 = setTimeout(() => {
        announceAndLock(desafioAtual.audio);
      }, 600);
      const t2 = setTimeout(() => {
        perguntaRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    // eslint-disable-next-line
  }, [fase, desafioAtual, finalizado]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  const finalizarJogo = useCallback(async (finalScore) => {
    setFinalizado(true);

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const percentual = (finalScore / DESAFIOS.length) * 100;

    try {
      await apiFetch("/api/dashboard/session", {
        method: "POST",
        body: JSON.stringify({
          userId: player?.id || null,
          game: "Quebra-Cabeça",
          score: percentual,
          total: DESAFIOS.length,
          duration_seconds: duration,
        }),
      });
    } catch (error) {
      console.error("Erro no analytics:", error);
    }
  }, [startTime, player]);

  useEffect(() => {
    if (finalizado) {
      const t = setTimeout(() => resultRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [finalizado]);

  function tentarEncaixar(pecaId) {
    if (lock || resolvido) return;
    const peca = desafioAtual.pecas.find((item) => item.id === pecaId);
    if (!peca) return;

    if (peca.correta) {
      const newScore = score + 1;
      setScore(newScore);
      setResolvido(true);
      setPecaAtivaId(null);

      announceAndLock("Muito bem! Encaixou perfeito.", () => {
        if (fase < DESAFIOS.length - 1) {
          setFase((current) => current + 1);
        } else {
          finalizarJogo(newScore);
        }
      });
    } else {
      announceAndLock("Ops! Essa peça não encaixa aí. Tente outra.");
      setPecaAtivaId(null);
    }
  }

  function selecionarPeca(pecaId) {
    if (lock || resolvido) return;
    if (pecaAtivaId === pecaId) {
      setPecaAtivaId(null);
      announce("Peça desmarcada.");
      return;
    }
    const peca = desafioAtual.pecas.find((item) => item.id === pecaId);
    setPecaAtivaId(pecaId);
    announce(`${peca.nome} selecionada. Ative a área de encaixe para tentar.`);
  }

  function ativarAreaDeEncaixe() {
    if (lock || resolvido) return;
    if (pecaAtivaId === null) {
      announceAndLock("Selecione uma peça primeiro.");
      return;
    }
    tentarEncaixar(pecaAtivaId);
  }

  function handleDragStart(e, pecaId) {
    if (lock || resolvido) {
      e.preventDefault();
      return;
    }
    setPecaAtivaId(pecaId);
    e.dataTransfer.setData("pecaId", String(pecaId));
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!lock && !resolvido) setDragOverTarget(true);
  }

  function handleDragLeave() {
    setDragOverTarget(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOverTarget(false);
    if (lock || resolvido) return;
    const pecaDropadaId = Number(e.dataTransfer.getData("pecaId"));
    tentarEncaixar(pecaDropadaId);
  }

  if (finalizado) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 shadow-sm mb-8 focus:outline-none"
        >
          <h1 className="text-5xl font-extrabold text-emerald-800 mb-4">
            Quebra-Cabeça Completo!
          </h1>

          <p className="text-2xl text-slate-600 mb-2 font-bold">
            {player?.name || "Você"} encaixou {score} peças corretas de {DESAFIOS.length}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-10 py-5 bg-sky-500 text-white rounded-full font-bold text-2xl shadow-xl hover:bg-sky-600 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  if (!desafioAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-semibold" role="status">Carregando jogo...</p>
      </div>
    );
  }

  const pecaSelecionada = desafioAtual.pecas.find((p) => p.id === pecaAtivaId);
  const targetLabel = resolvido
    ? "Área de encaixe. Peça encaixada com sucesso."
    : pecaSelecionada
      ? `Área de encaixe. Peça selecionada: ${pecaSelecionada.nome}. Pressione Enter para tentar encaixar aqui.`
      : "Área de encaixe. Nenhuma peça selecionada ainda. Selecione uma peça na lista ao lado.";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Sair do Quebra-Cabeça"
        >
          ← Sair
        </button>

        <h2 className="text-xl font-black text-slate-800">Quebra-Cabeça</h2>

        <div className="bg-sky-100 px-4 py-1 rounded-full font-bold text-sky-700">
          {fase + 1} / {DESAFIOS.length}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2 flex flex-col items-center">
          <div
            ref={perguntaRef}
            tabIndex={-1}
            className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-200 mb-6 text-center w-full focus:outline-none"
          >
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {desafioAtual.pergunta}
            </h1>
          </div>

          <div className="relative aspect-square w-full max-w-[500px] bg-white rounded-[40px] shadow-inner border-8 border-slate-100 overflow-hidden flex items-center justify-center">
            <span className="text-[140px] opacity-25 select-none" aria-hidden="true">
              {desafioAtual.emoji}
            </span>

            <button
              type="button"
              onClick={ativarAreaDeEncaixe}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-disabled={lock || resolvido ? true : undefined}
              aria-label={targetLabel}
              className={`absolute rounded-xl border-8 border-dashed transition-all flex items-center justify-center text-6xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 ${
                resolvido
                  ? "border-emerald-500 bg-emerald-50"
                  : dragOverTarget || pecaAtivaId !== null
                    ? "border-sky-500 bg-sky-100"
                    : "border-sky-300 bg-sky-50"
              }`}
              style={{ top: "30%", left: "30%", width: "40%", height: "40%" }}
            >
              {resolvido ? (
                <span aria-hidden="true">{desafioAtual.emoji}</span>
              ) : (
                <span aria-hidden="true" className="text-slate-400">?</span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-200 flex flex-col items-center gap-6">
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider">
            Peças
          </h3>

          <p className="text-sm text-slate-400 text-center">
            Arraste a peça correta até a área azul, ou selecione a peça e depois ative a área de encaixe.
          </p>

          <div
            className="grid grid-cols-1 gap-5 w-full"
            role="group"
            aria-label="Peças disponíveis"
          >
            {pecasEmbaralhadas.map((peca) => {
              const selecionada = pecaAtivaId === peca.id;
              const bloqueada = lock || resolvido;
              return (
                <button
                  key={peca.id}
                  type="button"
                  draggable={!bloqueada}
                  onDragStart={(e) => handleDragStart(e, peca.id)}
                  onClick={() => selecionarPeca(peca.id)}
                  aria-pressed={selecionada}
                  aria-disabled={bloqueada ? true : undefined}
                  aria-label={`Peça: ${peca.nome}${selecionada ? ", selecionada" : ""}`}
                  className={`p-3 bg-white border-8 ${
                    selecionada ? "border-sky-400 scale-105" : "border-slate-100"
                  } rounded-[30px] shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-sky-200 hover:scale-105 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 ${
                    bloqueada ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="aspect-square w-full max-w-[120px] rounded-[20px] overflow-hidden border bg-slate-50 flex items-center justify-center text-6xl">
                    <span aria-hidden="true">{peca.emoji}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

    </div>
  );
}