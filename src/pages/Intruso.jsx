import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";
import { getPlayer } from "../lib/player";
import { apiFetch } from "../lib/api.js";

/* ============================================================
   ITENS (emoji + nome), reutilizados entre categorias
   ============================================================ */
const ITEMS = {
  cachorro: { emoji: "🐶", nome: "Cachorro" },
  gato: { emoji: "🐱", nome: "Gato" },
  leao: { emoji: "🦁", nome: "Leão" },
  carro: { emoji: "🚗", nome: "Carro" },
  banana: { emoji: "🍌", nome: "Banana" },
  maca: { emoji: "🍎", nome: "Maçã" },
  uva: { emoji: "🍇", nome: "Uva" },
  cadeira: { emoji: "🪑", nome: "Cadeira" },
  colher: { emoji: "🥄", nome: "Colher" },
  panela: { emoji: "🍳", nome: "Panela" },
  prato: { emoji: "🍽️", nome: "Prato" },
  cama: { emoji: "🛏️", nome: "Cama" },
  caderno: { emoji: "📓", nome: "Caderno" },
  lapis: { emoji: "✏️", nome: "Lápis" },
  mochila: { emoji: "🎒", nome: "Mochila" },
  escova: { emoji: "🪥", nome: "Escova" },
  sabonete: { emoji: "🧼", nome: "Sabonete" },
  pente: { emoji: "🪮", nome: "Pente" },
  pao: { emoji: "🍞", nome: "Pão" },
  onibus: { emoji: "🚌", nome: "Ônibus" },
  bicicleta: { emoji: "🚲", nome: "Bicicleta" },
  aviao: { emoji: "✈️", nome: "Avião" },
  arvore: { emoji: "🌳", nome: "Árvore" },
  urso: { emoji: "🧸", nome: "Urso de pelúcia" },
  pipa: { emoji: "🪁", nome: "Pipa" },
  dado: { emoji: "🎲", nome: "Dado" },
  oculos: { emoji: "👓", nome: "Óculos" },
  violao: { emoji: "🎸", nome: "Violão" },
  piano: { emoji: "🎹", nome: "Piano" },
  bateria: { emoji: "🥁", nome: "Bateria" },
  camisa: { emoji: "👕", nome: "Camisa" },
  calca: { emoji: "👖", nome: "Calça" },
  sapato: { emoji: "👟", nome: "Sapato" },
  bola: { emoji: "⚽", nome: "Bola" },
  feliz: { emoji: "😀", nome: "Feliz" },
  triste: { emoji: "😢", nome: "Triste" },
  bravo: { emoji: "😡", nome: "Bravo" },
  sol: { emoji: "☀️", nome: "Sol" },
  circulo: { emoji: "🔴", nome: "Círculo" },
  quadrado: { emoji: "🟦", nome: "Quadrado" },
  triangulo: { emoji: "🔺", nome: "Triângulo" },
  sofa: { emoji: "🛋️", nome: "Sofá" },
  telefone: { emoji: "📱", nome: "Telefone" },
  televisao: { emoji: "📺", nome: "Televisão" },
  computador: { emoji: "💻", nome: "Computador" },
  basquete: { emoji: "🏀", nome: "Basquete" },
  corrida: { emoji: "🏃", nome: "Corredor" },
  chuva: { emoji: "🌧️", nome: "Chuva" },
  nuvem: { emoji: "☁️", nome: "Nuvem" },
  bolo: { emoji: "🎂", nome: "Bolo" },
  sorvete: { emoji: "🍦", nome: "Sorvete" },
  biscoito: { emoji: "🍪", nome: "Biscoito" },
  martelo: { emoji: "🔨", nome: "Martelo" },
  suco: { emoji: "🧃", nome: "Suco" },
  leite: { emoji: "🥛", nome: "Leite" },
  cafe: { emoji: "☕", nome: "Café" },
};

/* ============================================================
   CATEGORIAS (níveis)
   Cada categoria tem 3 itens do grupo + 1 intruso.
   ============================================================ */
const CATEGORIAS = [
  { pergunta: "Qual não é um animal?", audio: "Três são animais. Qual não é um animal?", itens: ["cachorro", "gato", "leao"], intruso: "carro" },
  { pergunta: "Qual não é uma fruta?", audio: "Três são frutas. Qual não é uma fruta?", itens: ["banana", "maca", "uva"], intruso: "cadeira" },
  { pergunta: "Qual não é da cozinha?", audio: "Qual objeto não é da cozinha?", itens: ["colher", "panela", "prato"], intruso: "cama" },
  { pergunta: "Qual não é da escola?", audio: "Três coisas são da escola. Qual não é?", itens: ["caderno", "lapis", "mochila"], intruso: "cachorro" },
  { pergunta: "Qual não é de higiene?", audio: "O que não usamos para nos limpar?", itens: ["escova", "sabonete", "pente"], intruso: "pao" },
  { pergunta: "Qual não é transporte?", audio: "Qual destes não serve para viajar?", itens: ["onibus", "bicicleta", "aviao"], intruso: "arvore" },
  { pergunta: "Qual não é um brinquedo?", audio: "Qual destes não é para brincar?", itens: ["urso", "pipa", "dado"], intruso: "oculos" },
  { pergunta: "Qual não é instrumento?", audio: "Qual não faz música?", itens: ["violao", "piano", "bateria"], intruso: "lapis" },
  { pergunta: "Qual não é roupa?", audio: "Três são roupas. Qual não é roupa?", itens: ["camisa", "calca", "sapato"], intruso: "bola" },
  { pergunta: "Qual não é uma emoção?", audio: "Três mostram emoções. Qual não mostra uma emoção?", itens: ["feliz", "triste", "bravo"], intruso: "sol" },
  { pergunta: "Qual não é uma forma?", audio: "Três são formas geométricas. Qual não é uma forma?", itens: ["circulo", "quadrado", "triangulo"], intruso: "gato" },
  { pergunta: "Qual não é móvel da casa?", audio: "Três são móveis da casa. Qual não é?", itens: ["cama", "sofa", "cadeira"], intruso: "telefone" },
  { pergunta: "Qual não é eletrônico?", audio: "Três são aparelhos eletrônicos. Qual não é?", itens: ["telefone", "televisao", "computador"], intruso: "banana" },
  { pergunta: "Qual não é esporte?", audio: "Três são esportes. Qual não é esporte?", itens: ["bola", "basquete", "corrida"], intruso: "escova" },
  { pergunta: "Qual não é do clima?", audio: "Três estão relacionados ao clima. Qual não é?", itens: ["sol", "chuva", "nuvem"], intruso: "violao" },
  { pergunta: "Qual não é doce?", audio: "Três são doces. Qual não é doce?", itens: ["bolo", "sorvete", "biscoito"], intruso: "martelo" },
  { pergunta: "Qual não é bebida?", audio: "Três são bebidas. Qual não é bebida?", itens: ["suco", "leite", "cafe"], intruso: "sapato" },
];

const QUESTOES_POR_RODADA = 8;

// Tempo de bloqueio proporcional ao tamanho da fala anunciada,
// para nenhuma ação nova ser feita enquanto o TTS/leitor de tela
// ainda está falando.
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

// Monta a rodada: sorteia categorias e, para cada uma, embaralha a
// posição das 4 opções (3 do grupo + 1 intruso) — assim o intruso
// não fica sempre na mesma posição visual entre partidas.
function montarRodada() {
  const categoriasEscolhidas = shuffle(CATEGORIAS).slice(0, QUESTOES_POR_RODADA);
  return categoriasEscolhidas.map((cat) => {
    const idsEmbaralhados = shuffle([...cat.itens, cat.intruso]);
    const correta = idsEmbaralhados.indexOf(cat.intruso);
    return {
      pergunta: cat.pergunta,
      audio: cat.audio,
      correta,
      opcoes: idsEmbaralhados.map((id) => ({ id, ...ITEMS[id] })),
    };
  });
}

export default function Intruso() {
  const navigate = useNavigate();
  const player = getPlayer();

  const [questoesSorteadas, setQuestoesSorteadas] = useState([]);
  const [fase, setFase] = useState(0);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState(null);
  const [lock, setLock] = useState(false);

  const liveRef = useRef(null);
  const perguntaRef = useRef(null);
  const resultRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  // Anuncia e bloqueia novas ações pelo tempo estimado de fala,
  // para não permitir toque/clique enquanto o áudio ainda está tocando.
  function announceAndLock(msg, extraDelay = 0) {
    announce(msg);
    setLock(true);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setLock(false);
      lockTimeoutRef.current = null;
    }, estimateSpeechDuration(msg) + extraDelay);
  }

  useEffect(() => {
    setQuestoesSorteadas(montarRodada());
  }, []);

  const desafioAtual = questoesSorteadas[fase];

  // Anuncia a pergunta ao trocar de fase e leva o foco para o card
  // da pergunta, para quem usa leitor de tela acompanhar a mudança.
  useEffect(() => {
    if (desafioAtual && !finalizado) {
      const delayBeforeSpeak = 600;
      const t1 = setTimeout(() => {
        announceAndLock(desafioAtual.audio);
      }, delayBeforeSpeak);
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
    const total = questoesSorteadas.length || 1;
    const percentual = (finalScore / total) * 100;

    try {
      await apiFetch("/api/dashboard/session", {
        method: "POST",
        body: JSON.stringify({
          userId: player?.id || null,
          game: "Encontre o Intruso",
          score: percentual,
          total,
          duration_seconds: duration,
        }),
      });
    } catch (error) {
      console.error("Erro ao registrar analytics:", error);
    }
  }, [startTime, player, questoesSorteadas]);

  const handleResposta = (index) => {
    if (feedbackIndex !== null || lock || !desafioAtual) return;

    setFeedbackIndex(index);

    const acertou = index === desafioAtual.correta;
    // Calcula a nova pontuação explicitamente em vez de depender do
    // state assíncrono — evita o bug de o placar enviado ao servidor
    // ficar desatualizado quando a última pergunta é acertada.
    const newScore = acertou ? score + 1 : score;
    setScore(newScore);

    const msg = acertou
      ? "Muito bem! Você acertou."
      : `O intruso era o ${desafioAtual.opcoes[desafioAtual.correta].nome}.`;

    announceAndLock(msg);

    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setFeedbackIndex(null);
      setLock(false);
      lockTimeoutRef.current = null;

      if (fase < questoesSorteadas.length - 1) {
        setFase((current) => current + 1);
      } else {
        finalizarJogo(newScore);
      }
    }, estimateSpeechDuration(msg));
  };

  // Foca o resumo final ao concluir, para quem usa leitor de tela
  // chegar direto no resultado.
  useEffect(() => {
    if (finalizado) {
      const t = setTimeout(() => resultRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [finalizado]);

  if (finalizado) {
    const total = questoesSorteadas.length || 1;
    const percentual = ((score / total) * 100).toFixed(0);

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className="bg-sky-50 p-10 rounded-[40px] border border-sky-100 mb-8 focus:outline-none"
        >
          <h1 className="text-5xl font-black text-sky-900 mb-4">
            Fim de Jogo!
          </h1>

          <p className="text-6xl font-black text-sky-600">
            {percentual}%
            <span className="sr-only"> de acerto, {score} de {total} perguntas corretas</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-10 py-5 bg-sky-500 text-white rounded-full font-bold text-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
        >
          Voltar
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl bg-sky-500 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Sair do jogo Encontre o Intruso"
        >
          ← Sair
        </button>

        <h2 className="text-xl font-black">Encontre o Intruso</h2>

        <div className="bg-sky-100 px-4 py-1 rounded-full font-bold text-sky-700">
          {fase + 1} / {questoesSorteadas.length}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col justify-center">
        <div
          ref={perguntaRef}
          tabIndex={-1}
          className="bg-white rounded-[40px] p-8 border border-slate-200 mb-10 text-center shadow-sm focus:outline-none"
        >
          <h1 className="text-3xl font-black text-slate-800">
            {desafioAtual.pergunta}
          </h1>
        </div>

        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          role="group"
          aria-label="Opções de resposta"
        >
          {desafioAtual.opcoes.map((opcao, index) => {
            const respondido = feedbackIndex !== null;
            const ehCorreta = index === desafioAtual.correta;
            const ehEscolhida = index === feedbackIndex;
            const blocked = respondido || lock;

            let label = `Opção ${index + 1}: ${opcao.nome}`;
            if (respondido) {
              if (ehCorreta) label += ", esta era a resposta correta";
              else if (ehEscolhida) label += ", sua resposta, incorreta";
            }

            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => handleResposta(index)}
                aria-disabled={blocked ? true : undefined}
                aria-label={label}
                className={`p-4 bg-white border-[10px] rounded-[50px] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                  feedbackIndex === null
                    ? "border-slate-100 hover:scale-105"
                    : ehCorreta
                      ? "border-emerald-500 bg-emerald-50"
                      : ehEscolhida
                        ? "border-rose-500 bg-rose-50"
                        : "border-slate-100 opacity-40"
                } ${lock && feedbackIndex === null ? "cursor-not-allowed" : ""}`}
              >
                <div
                  className="aspect-square w-full rounded-[35px] overflow-hidden border bg-slate-50 flex items-center justify-center text-7xl sm:text-8xl"
                  aria-hidden="true"
                >
                  {opcao.emoji}
                </div>

                <span className="mt-4 block text-2xl font-black text-slate-700">
                  {opcao.nome}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}