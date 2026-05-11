import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";
import { getPlayer } from "../lib/player";
import { apiFetch } from "../lib/api.js";

const BANCO_DE_QUESTOES = [
  {
    pergunta: "Qual não é um animal?",
    audio: "Três são animais. Qual não é um animal?",
    correta: 2,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=400&fit=crop",
        nome: "Cachorro",
      },
      {
        img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
        nome: "Gato",
      },
      {
        img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop",
        nome: "Carro",
      },
      {
        img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop",
        nome: "Leão",
      },
    ],
  },
  {
    pergunta: "Qual não é uma fruta?",
    audio: "Três são frutas. Qual não é uma fruta?",
    correta: 2,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1571771894821-ad990f19a7ba?w=400&h=400&fit=crop",
        nome: "Banana",
      },
      {
        img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
        nome: "Maçã",
      },
      {
        img: "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop",
        nome: "Cadeira",
      },
      {
        img: "https://images.unsplash.com/photo-1537640538966-79f369b41f8f?w=400&h=400&fit=crop",
        nome: "Uva",
      },
    ],
  },
  {
    pergunta: "Qual não é da cozinha?",
    audio: "Qual objeto não é da cozinha?",
    correta: 1,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop",
        nome: "Colher",
      },
      {
        img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=400&fit=crop",
        nome: "Cama",
      },
      {
        img: "https://images.unsplash.com/photo-1584990344610-52d480356649?w=400&h=400&fit=crop",
        nome: "Panela",
      },
      {
        img: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop",
        nome: "Prato",
      },
    ],
  },
  {
    pergunta: "Qual não é da escola?",
    audio: "Três coisas são da escola. Qual não é?",
    correta: 3,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop",
        nome: "Caderno",
      },
      {
        img: "https://images.unsplash.com/photo-1503551723145-6c040742065b?w=400&h=400&fit=crop",
        nome: "Lápis",
      },
      {
        img: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=400&h=400&fit=crop",
        nome: "Borracha",
      },
      {
        img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
        nome: "Cachorro",
      },
    ],
  },
  {
    pergunta: "Qual não é de higiene?",
    audio: "O que não usamos para nos limpar?",
    correta: 3,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1559594831-7b7050076a0d?w=400&h=400&fit=crop",
        nome: "Escova",
      },
      {
        img: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop",
        nome: "Sabonete",
      },
      {
        img: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop",
        nome: "Toalha",
      },
      {
        img: "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=400&h=400&fit=crop",
        nome: "Pão",
      },
    ],
  },
  {
    pergunta: "Qual não é transporte?",
    audio: "Qual destes não serve para viajar?",
    correta: 3,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=400&fit=crop",
        nome: "Ônibus",
      },
      {
        img: "https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=400&h=400&fit=crop",
        nome: "Bicicleta",
      },
      {
        img: "https://images.unsplash.com/photo-1489450278039-ed7b05bc00a8?w=400&h=400&fit=crop",
        nome: "Avião",
      },
      {
        img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&h=400&fit=crop",
        nome: "Árvore",
      },
    ],
  },
  {
    pergunta: "Qual não é um brinquedo?",
    audio: "Qual destes não é para brincar?",
    correta: 1,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1581552807187-0f9978182bc1?w=400&h=400&fit=crop",
        nome: "Urso",
      },
      {
        img: "https://images.unsplash.com/photo-1575435835785-373504f7498b?w=400&h=400&fit=crop",
        nome: "Óculos",
      },
      {
        img: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400&h=400&fit=crop",
        nome: "Boneca",
      },
      {
        img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
        nome: "Bola",
      },
    ],
  },
  {
    pergunta: "Qual não é instrumento?",
    audio: "Qual não faz música?",
    correta: 2,
    opcoes: [
      {
        img: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=400&h=400&fit=crop",
        nome: "Violão",
      },
      {
        img: "https://images.unsplash.com/photo-1520527057852-44c0e5f439b1?w=400&h=400&fit=crop",
        nome: "Piano",
      },
      {
        img: "https://images.unsplash.com/photo-1503551723145-6c040742065b?w=400&h=400&fit=crop",
        nome: "Lápis",
      },
      {
        img: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",
        nome: "Bateria",
      },
    ],
  },
];

export default function Intruso() {
  const navigate = useNavigate();
  const player = getPlayer();

  const [questoesSorteadas, setQuestoesSorteadas] = useState([]);
  const [fase, setFase] = useState(0);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState(null);

  useEffect(() => {
    const shuffle = [...BANCO_DE_QUESTOES]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    setQuestoesSorteadas(shuffle);
  }, []);

  const desafioAtual = questoesSorteadas[fase];

  useEffect(() => {
    if (desafioAtual && !finalizado) {
      const timer = setTimeout(() => speak(desafioAtual.audio), 600);
      return () => clearTimeout(timer);
    }
  }, [fase, desafioAtual, finalizado]);

  const finalizarJogo = useCallback(async () => {
    setFinalizado(true);

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const total = questoesSorteadas.length || 1;
    const percentual = (score / total) * 100;

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
  }, [score, startTime, player, questoesSorteadas]);

  const handleResposta = (index) => {
    if (feedbackIndex !== null || !desafioAtual) return;

    setFeedbackIndex(index);

    const acertou = index === desafioAtual.correta;

    if (acertou) {
      speak("Muito bem! Você acertou.");
      setScore((current) => current + 1);
    } else {
      speak(`O intruso era o ${desafioAtual.opcoes[desafioAtual.correta].nome}.`);
    }

    setTimeout(() => {
      setFeedbackIndex(null);

      if (fase < questoesSorteadas.length - 1) {
        setFase((current) => current + 1);
      } else {
        finalizarJogo();
      }
    }, 2500);
  };

  if (finalizado) {
    const total = questoesSorteadas.length || 1;
    const percentual = ((score / total) * 100).toFixed(0);

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-sky-50 p-10 rounded-[40px] border border-sky-100 mb-8">
          <h1 className="text-5xl font-black text-sky-900 mb-4">
            Fim de Jogo!
          </h1>

          <p className="text-6xl font-black text-sky-600">{percentual}%</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="px-10 py-5 bg-sky-500 text-white rounded-full font-bold text-2xl"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!desafioAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-semibold">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
        >
          ← Sair
        </button>

        <h2 className="text-xl font-black">Encontre o Intruso</h2>

        <div className="bg-sky-100 px-4 py-1 rounded-full font-bold text-sky-700">
          {fase + 1} / {questoesSorteadas.length}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col justify-center">
        <div className="bg-white rounded-[40px] p-8 border border-slate-200 mb-10 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-800">
            {desafioAtual.pergunta}
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {desafioAtual.opcoes.map((opcao, index) => (
            <button
              key={index}
              onClick={() => handleResposta(index)}
              disabled={feedbackIndex !== null}
              className={`p-4 bg-white border-[10px] rounded-[50px] transition-all ${
                feedbackIndex === null
                  ? "border-slate-100 hover:scale-105"
                  : index === desafioAtual.correta
                    ? "border-emerald-500 bg-emerald-50"
                    : index === feedbackIndex
                      ? "border-rose-500 bg-rose-50"
                      : "border-slate-100 opacity-40"
              }`}
            >
              <div className="aspect-square w-full rounded-[35px] overflow-hidden border bg-slate-50">
                <img
                  src={opcao.img}
                  alt={opcao.nome}
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="mt-4 block text-2xl font-black text-slate-700">
                {opcao.nome}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}