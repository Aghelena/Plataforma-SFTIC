import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";
import { getPlayer } from "../lib/player";

const API_BASE = "http://localhost:5001";

// Banco de dados de quebra-cabeças (Usando IDs fixos do Unsplash para garantir imagens corretas e limpas)
const DESAFIOS = [
  {
    pergunta: "Arraste a peça para completar a rosquinha!",
    audio: "Olhe a imagem da rosquinha. Falta um pedaço. Arraste a peça correta para completar.",
    // Imagem da rosquinha inteira
    imgCompleta: "https://images.unsplash.com/photo-1514517116480-e3498b584e03?q=80&w=600&h=600&fit=crop",
    // Posição onde a peça que falta vai se encaixar (em %)
    target: { top: 20, left: 60, width: 40, height: 40 },
    // Peças disponíveis para arrastar
    pecas: [
      { id: 1, img: "https://images.unsplash.com/photo-1579308108842-be53a23a31c5?q=80&w=200&h=200&fit=crop", correta: false, nome: "Pedaço errado" }, // Pedaço de outra rosquinha
      { id: 2, img: "https://images.unsplash.com/photo-1614777986387-015c2a89b65e?q=80&w=200&h=200&fit=crop", correta: true, nome: "Pedaço certo" }, // Pedaço que encaixa
      { id: 3, img: "https://images.unsplash.com/photo-1596238865662-752836262b9a?q=80&w=200&h=200&fit=crop", correta: false, nome: "Pedaço errado" }  // Pedaço de chocolate
    ]
  },
  {
    pergunta: "Arraste a peça para completar o quebra-cabeça do urso!",
    audio: "Falta uma peça no quebra-cabeça do urso. Arraste a peça que combina para completar.",
    // Imagem do urso inteira (mas a zona de drag vai cobrir um pedaço)
    imgCompleta: "https://images.unsplash.com/photo-1581552807187-0f9978182bc1?q=80&w=600&h=600&fit=crop",
    target: { top: 50, left: 10, width: 40, height: 40 },
    pecas: [
      { id: 4, img: "https://images.unsplash.com/photo-1563297123-b15a6b01035b?q=80&w=200&h=200&fit=crop", correta: true, nome: "Peça certa" }, // Pedaço da barriga do urso
      { id: 5, img: "https://images.unsplash.com/photo-1571167443831-299a9a3848b3?q=80&w=200&h=200&fit=crop", correta: false, nome: "Peça errada" }, // Pedaço de grama
      { id: 6, img: "https://images.unsplash.com/photo-1579202673506-c3ce5a31ef7a?q=80&w=200&h=200&fit=crop", correta: false, nome: "Peça errada" }  // Pedaço de céu
    ]
  }
];

export default function QuebraCabeca() {
  const navigate = useNavigate();
  const player = getPlayer();
  
  const [fase, setFase] = useState(0);
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [pecaSolicitadaId, setPecaSolicitadaId] = useState(null); // ID da peça que está sendo arrastada
  const [dragOverTarget, setDragOverTarget] = useState(false); // Se a peça está sobre a zona correta
  const [pecasEmbaralhadas, setPecasEmbaralhadas] = useState([]);

  const desafioAtual = DESAFIOS[fase];

  // Embaralha as peças no início de cada fase
  useEffect(() => {
    if (desafioAtual) {
      const shuffle = [...desafioAtual.pecas].sort(() => Math.random() - 0.5);
      setPecasEmbaralhadas(shuffle);
    }
  }, [fase, desafioAtual]);

  useEffect(() => {
    if (desafioAtual && !finalizado) {
      setTimeout(() => speak(desafioAtual.audio), 600);
    }
  }, [fase, desafioAtual, finalizado]);

  // Funções de Drag and Drop
  const handleDragStart = (e, pecaId) => {
    setPecaSolicitadaId(pecaId);
    e.dataTransfer.setData("pecaId", pecaId);
    // Cria uma imagem fantasma vazia para esconder o padrão do navegador se desejar
    // e.dataTransfer.setDragImage(new Image(), 0, 0); 
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o drop
    setDragOverTarget(true);
  };

  const handleDragLeave = () => {
    setDragOverTarget(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverTarget(false);
    const pecaDropadaId = Number(e.dataTransfer.getData("pecaId"));
    
    // Encontra a peça nos dados
    const peca = desafioAtual.pecas.find(p => p.id === pecaDropadaId);

    if (peca && peca.correta) {
      speak("Muito bem! Encaixou perfeito.");
      setScore(s => s + 1);
      
      // Delay antes de passar de fase
      setTimeout(() => {
        if (fase < DESAFIOS.length - 1) {
          setFase(f => f + 1);
        } else {
          finalizarJogo();
        }
      }, 2000);
    } else {
      speak("Ops! Essa peça não encaixa aí. Tente outra.");
    }
    
    setPecaSolicitadaId(null); // Reseta
  };

  const finalizarJogo = useCallback(async () => {
    setFinalizado(true);
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const percentual = (score / DESAFIOS.length) * 100;

    try {
      await fetch(`${API_BASE}/api/dashboard/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: player?.id || 0,
          game: "Quebra-Cabeça",
          score: percentual, // Assertividade Visuoespacial
          total: DESAFIOS.length,
          duration_seconds: duration // Tempo total
        })
      });
    } catch (e) {
      console.error("Erro no analytics", e);
    }
  }, [score, startTime, player]);

  // Tela de Fim de Jogo (Padrão assistivo)
  if (finalizado) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 shadow-sm mb-8">
          <h1 className="text-5xl font-extrabold text-emerald-800 mb-4">Quebra-Cabeça Completo!</h1>
          <p className="text-2xl text-slate-600 mb-2 font-bold">{player?.name || 'Você'} encaixou {score} peças corretas.</p>
        </div>
        <button 
          onClick={() => navigate("/")}
          className="px-10 py-5 bg-sky-500 text-white rounded-full font-bold text-2xl shadow-xl hover:bg-sky-600 transition-transform active:scale-95"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">← Sair</button>
        <h2 className="text-xl font-black text-slate-800">Quebra-Cabeça</h2>
        <div className="bg-sky-100 px-4 py-1 rounded-full font-bold text-sky-700">
          {fase + 1} / {DESAFIOS.length}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Lado Esquerdo: Área do Quebra-Cabeça Principal (Onde solta) */}
        <div className="md:col-span-2 flex flex-col items-center">
          <div className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-200 mb-6 text-center w-full">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {desafioAtual?.pergunta}
            </h1>
          </div>
          
          <div className="relative aspect-square w-full max-w-[500px] bg-white rounded-[40px] shadow-inner border-8 border-slate-100 overflow-hidden">
            {/* Imagem de fundo completa */}
            <img 
              src={desafioAtual?.imgCompleta} 
              alt="Quebra-cabeça principal" 
              className="w-full h-full object-cover opacity-80"
              draggable="false"
            />
            
            {/* Zona de Drop (Onde solta a peça) */}
            <div 
              className={`absolute rounded-xl border-8 border-dashed transition-all
                ${dragOverTarget ? 'border-sky-500 bg-sky-100' : 'border-sky-300 bg-sky-50'}
                ${pecaSolicitadaId !== null ? 'opacity-100' : 'opacity-60'}`}
              style={{
                top: `${desafioAtual?.target.top}%`,
                left: `${desafioAtual?.target.left}%`,
                width: `${desafioAtual?.target.width}%`,
                height: `${desafioAtual?.target.height}%`
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-label="Zona para encaixar a peça"
            />
          </div>
        </div>

        {/* Lado Direito: Área das Peças Disponíveis (De onde arrasta) */}
        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-200 flex flex-col items-center gap-6">
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider">Peças</h3>
          <p className="text-sm text-slate-400 text-center">Arraste a peça correta com o mouse até a área azul piscante</p>
          
          <div className="grid grid-cols-1 gap-5 w-full">
            {pecasEmbaralhadas.map((peca) => (
              <div
                key={peca.id}
                draggable
                onDragStart={(e) => handleDragStart(e, peca.id)}
                className={`p-3 bg-white border-8 ${pecaSolicitadaId === peca.id ? 'border-sky-400 scale-105 opacity-50' : 'border-slate-100'} 
                  rounded-[30px] shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing
                  hover:border-sky-200 hover:scale-105 transition-all outline-none`}
                aria-label={`Arraste esta peça: ${peca.nome}`}
              >
                <div className="aspect-square w-full max-w-[120px] rounded-[20px] overflow-hidden border bg-slate-50">
                  <img 
                    src={peca.img} 
                    alt={peca.nome} 
                    className="w-full h-full object-cover"
                    draggable="false" // Impede o drag da imagem em si, deixa o div pai lidar
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="p-6 text-center text-slate-400 text-sm border-t border-slate-100 mt-8">
        © {new Date().getFullYear()} Plataforma Terapêutica Inclusiva - Franca/SP
      </footer>
    </div>
  );
}