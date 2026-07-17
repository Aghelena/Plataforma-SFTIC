// src/pages/Forca.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { speak } from "../lib/speech";

/* ============================================================
   BANCO DE PALAVRAS
   ============================================================ */
const WORDS = [
  // animais
  "GATO", "RATO", "PATO", "SAPO", "PEIXE", "VACA", "BURRO", "CAVALO",
  "GALINHA", "COELHO", "PORCO", "CACHORRO", "PASSARO", "ARARA", "TARTARUGA",
  "ELEFANTE", "GIRAFA", "LEAO", "TIGRE", "MACACO", "URSO", "LOBO",
  "RAPOSA", "ZEBRA", "CAMELO", "CANGURU", "PINGUIM", "GOLFINHO", "BALEIA",
  "TUBARAO", "POLVO", "CARANGUEJO", "BORBOLETA", "ABELHA", "FORMIGA",
  "ARANHA", "COBRA", "JACARE", "SAPINHO", "PATINHO",

  // comidas
  "BOLO", "SOPA", "BALA", "BISCOITO", "PIPOCA", "SUCO", "PIZZA",
  "MACARRAO", "ARROZ", "FEIJAO", "SALADA", "OMELETE", "IOGURTE",
  "SORVETE", "CHOCOLATE", "PUDIM", "TORTA", "PAO", "QUEIJO", "MANTEIGA",
  "CAFE", "LEITE", "GELEIA", "MEL", "LARANJA", "BANANA", "MACA",
  "MORANGO", "UVA", "MELANCIA", "ABACAXI", "MAMAO", "PERA", "LIMAO",
  "COCO", "MANGA", "GOIABA",

  // objetos e casa
  "MESA", "CAMA", "SOFA", "FITA", "COLA", "FONE", "LIVRO", "CADEIRA",
  "JANELA", "PORTA", "ESPELHO", "RELOGIO", "LAMPADA", "TESOURA",
  "CANETA", "LAPIS", "BORRACHA", "MOCHILA", "CADERNO", "CHAVE",
  "GARRAFA", "COPO", "PRATO", "PANELA", "TOALHA", "TRAVESSEIRO",
  "COBERTOR", "ESCOVA", "SABONETE", "SHAMPOO", "GUARDACHUVA",

  // roupas
  "MEIA", "SAPATO", "BOTA", "SAIA", "CAMISA", "CALCA", "VESTIDO",
  "CASACO", "BONE", "CHAPEU", "LUVA", "CINTO", "SANDALIA", "TENIS",

  // lugares e natureza
  "PARQUE", "PRAIA", "ESCOLA", "FLORESTA", "MONTANHA", "RIO", "LAGO",
  "JARDIM", "FAZENDA", "CIDADE", "IGREJA", "HOSPITAL", "MERCADO",
  "PADARIA", "BIBLIOTECA", "CINEMA", "PARQUINHO", "QUINTAL",
  "NUVEM", "CHUVA", "TROVAO", "ARCOIRIS", "ESTRELA", "LUA", "SOL",
  "VULCAO", "DESERTO", "ILHA", "CACHOEIRA", "FLOR", "ARVORE", "FOLHA",

  // corpo e saude
  "CABECA", "OLHO", "NARIZ", "BOCA", "ORELHA", "BRACO", "PERNA",
  "DEDO", "JOELHO", "OMBRO", "CORACAO", "DENTE", "CABELO",

  // transportes
  "CARRO", "ONIBUS", "BICICLETA", "MOTO", "TREM", "AVIAO", "BARCO",
  "CAMINHAO", "PATINETE", "METRO", "FOGUETE", "HELICOPTERO",

  // profissoes
  "MEDICO", "PROFESSOR", "BOMBEIRO", "COZINHEIRO", "PINTOR",
  "DENTISTA", "ENGENHEIRO", "MOTORISTA", "CANTOR", "JARDINEIRO",
  "VETERINARIO", "AGRICULTOR", "PADEIRO", "ALFAIATE",

  // esportes e brincadeiras
  "FUTEBOL", "BASQUETE", "NATACAO", "CORRIDA", "PIPA", "BONECA",
  "QUEBRACABECA", "PATINS", "PULAPULA", "GANGORRA", "ESCORREGADOR",
  "BOLA", "PIAO", "IOIO", "DOMINO", "XADREZ",

  // diversos
  "FERIAS", "ANIVERSARIO", "PRESENTE", "MUSICA", "DANCA", "TEATRO",
  "PINTURA", "DESENHO", "HISTORIA", "AMIZADE", "FAMILIA", "SORRISO",
  "ABRACO", "CARINHO", "GRATIDAO", "COMPUTADOR", "TELEFONE", "RADIO",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISTAKES = 6;
const MAX_HINTS = 3;

// Tempo de bloqueio proporcional ao tamanho da fala anunciada,
// para nenhuma ação nova ser feita enquanto o NVDA/TTS ainda fala.
const MS_PER_CHAR = 55;
const MIN_LOCK_MS = 1200;
const EXTRA_BUFFER_MS = 400;

function estimateSpeechDuration(text) {
  return Math.max(MIN_LOCK_MS, text.length * MS_PER_CHAR) + EXTRA_BUFFER_MS;
}

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
      aria-label={`Desenho da forca com ${mistakes} erro${mistakes !== 1 ? "s" : ""}`}
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

function Key({ letter, pressed, correct, gameOver, locked, onClick, onFocusAnnounce }) {
  // "disabled" nativo apenas quando o jogo termina de vez (não precisa
  // mais de interação). Enquanto o jogo está rodando, usamos
  // aria-disabled para letra já tentada / bloqueio temporário, para
  // não remover o elemento do fluxo de foco por teclado.
  const blocked = pressed || locked;

  function handleActivate() {
    if (gameOver || blocked) return;
    onClick();
  }

  function handleKey(e) {
    if (gameOver || blocked) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  let label = `Letra ${letter}`;
  if (pressed) label += correct ? ", correta, já tentada" : ", incorreta, já tentada";

  return (
    <button
      type="button"
      onClick={handleActivate}
      onKeyDown={handleKey}
      onFocus={() => onFocusAnnounce(letter, pressed, correct, gameOver, blocked)}
      disabled={gameOver}
      aria-disabled={!gameOver && blocked ? true : undefined}
      aria-pressed={pressed}
      aria-label={label}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold transition shadow-sm",
        pressed ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-sky-50 text-gray-800",
        gameOver || locked ? "opacity-60 cursor-not-allowed" : "",
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
  const [lock, setLock] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const liveRef = useRef(null);
  const resultRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const appRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  // Anuncia e bloqueia novas ações pelo tempo estimado de fala.
  function announceAndLock(msg) {
    announce(msg);
    setLock(true);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setLock(false);
      lockTimeoutRef.current = null;
    }, estimateSpeechDuration(msg));
  }

  const COMANDOS_TECLADO =
    "Digite a letra direto no teclado do computador para tentar, ou use Tab para navegar até a letra desejada no teclado da tela e pressione Enter.";

  // Armadilha de foco: impede que o Tab "vaze" da página para a
  // interface do navegador (barra de endereço, etc.). Ao chegar no
  // último elemento focável e apertar Tab, o foco volta pro
  // primeiro; ao apertar Shift+Tab no primeiro, volta pro último.
  useEffect(() => {
    function trapTab(e) {
      if (e.key !== "Tab") return;
      const container = appRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll('button:not([disabled])')
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", trapTab);
    return () => document.removeEventListener("keydown", trapTab);
  }, []);

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
  const gameOver = won || lost;

  function readScreen() {
    if (lock || gameOver) return;
    const revealedLetters = [...guessed].filter((l) => lettersInWord.has(l));
    const hintsLeft = MAX_HINTS - hintsUsed;
    announceAndLock(
      `Jogo da Forca. A palavra tem ${lettersInWord.size} letras. ` +
      `Você acertou ${revealedLetters.length} até agora. ` +
      `Erros: ${mistakes} de ${MAX_MISTAKES}. ` +
      `Dicas disponíveis: ${hintsLeft}. ` +
      `${COMANDOS_TECLADO}`
    );
  }

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Resultado: anuncia, foca o aviso e salva recorde
  useEffect(() => {
    if (!won && !lost) return;
    setRunning(false);

    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }
    setLock(false);

    if (won) {
      announce(`Parabéns! Você acertou a palavra ${word} com ${mistakes} erro${mistakes !== 1 ? "s" : ""}.`);
    } else {
      announce(`Fim de jogo! A palavra era ${word}. Tente novamente.`);
    }

    try {
      const best = JSON.parse(localStorage.getItem("hangman_best") || "{}");
      localStorage.setItem("hangman_best", JSON.stringify({
        time: best.time ? Math.min(best.time, time) : time,
        mistakes: best.mistakes !== undefined ? Math.min(best.mistakes, mistakes) : mistakes,
      }));
    } catch {}

    // Leva o foco direto para o resultado, para quem usa leitor de
    // tela não precisar procurar o desfecho na tela.
    const t = setTimeout(() => resultRef.current?.focus(), 50);
    return () => clearTimeout(t);
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
  const hintsLeft     = MAX_HINTS - hintsUsed;

  // Anuncia início, já explicando os comandos de teclado.
  useEffect(() => {
    announceAndLock(`Jogo da Forca iniciado. A palavra tem ${lettersInWord.size} letras. ${COMANDOS_TECLADO}`);
    // eslint-disable-next-line
  }, []);

  const guessLetter = useCallback(
    (letter) => {
      if (won || lost || lock) return;
      const L = letter.toUpperCase();
      if (!/[A-Z]/.test(L)) return;
      if (guessed.has(L)) {
        announceAndLock(`A letra ${L} já foi tentada.`);
        return;
      }
      setGuessed((prev) => new Set(prev).add(L));
      if (lettersInWord.has(L)) {
        announceAndLock(`Acertou! A letra ${L} está na palavra.`);
      } else {
        setMistakes((m) => {
          const next = m + 1;
          announceAndLock(`Errou. A letra ${L} não está na palavra. ${MAX_MISTAKES - next} chances restantes.`);
          return next;
        });
      }
    },
    [guessed, won, lost, lock, lettersInWord]
  );

  function useHint() {
    if (won || lost || lock) return;
    if (hintsLeft <= 0) {
      announceAndLock("Você já usou todas as dicas disponíveis nesta partida.");
      return;
    }
    const remainingLetters = [...lettersInWord].filter((l) => !guessed.has(l));
    if (remainingLetters.length === 0) return;
    const letter = remainingLetters[Math.floor(Math.random() * remainingLetters.length)];
    setGuessed((prev) => new Set(prev).add(letter));
    setHintsUsed((n) => n + 1);
    announceAndLock(`Dica: a palavra contém a letra ${letter}. Restam ${hintsLeft - 1} dicas.`);
  }

  // Anuncia o foco de uma letra do teclado virtual.
  function announceKeyFocus(letter, pressed, correct, gameOver, blocked) {
    if (gameOver) {
      announce(`Letra ${letter}. Jogo encerrado.`);
      return;
    }
    if (pressed) {
      announce(`Letra ${letter}, já tentada, ${correct ? "correta" : "incorreta"}.`);
      return;
    }
    if (blocked) {
      announce(`Letra ${letter}. Aguarde a fala terminar.`);
      return;
    }
    announce(`Letra ${letter}. Pressione Enter para tentar.`);
  }

  // Teclado físico
  useEffect(() => {
    const onKey = (e) => {
      if (won || lost || lock) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) { e.preventDefault(); guessLetter(key); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guessLetter, won, lost, lock]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  const restart = () => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = null;
    }
    setWord(pickWord());
    setGuessed(new Set());
    setMistakes(0);
    setTime(0);
    setRunning(true);
    setHintsUsed(0);
    setLock(false);
    setTimeout(() => announceAndLock(`Novo jogo iniciado. Boa sorte! ${COMANDOS_TECLADO}`), 100);
  };

  const formatTime = (total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50" ref={appRef}>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="bg-sky-500 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            onFocus={() => announce("Botão: Voltar. Atenção, pressione Enter para sair do jogo da forca e voltar à tela anterior.")}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Voltar. Atenção, isso sai do jogo da forca"
          >
            ← Voltar
          </button>
          <h1 className="font-bold text-black">Jogo da Forca</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={readScreen}
              onFocus={() => announce("Botão: Ler tela. Pressione Enter para ouvir a situação atual do jogo.")}
              disabled={lock || gameOver}
              className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Ler situação do jogo da forca"
              title="Ler tela"
            >
              🔊
            </button>
            <button
              type="button"
              onClick={restart}
              onFocus={() => announce("Botão: Reiniciar. Pressione Enter para começar um novo jogo.")}
              disabled={lock}
              className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Reiniciar jogo da forca"
            >
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

        <h2 className="sr-only">Desenho da forca</h2>
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 mb-4 text-gray-800">
          <HangmanSVG mistakes={mistakes} />
        </section>

        <h2 className="sr-only">Palavra a adivinhar</h2>
        <section role="status" aria-live="polite" className="mb-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-sm uppercase tracking-wide text-black mb-1">Palavra</div>
          <div className="font-mono text-2xl sm:text-3xl text-black break-words">{reveal}</div>
          <div className="mt-2 text-xs text-black">
            Letras únicas: {totalLetters} • Acertos: {correctGuesses}
          </div>
        </section>

        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={useHint}
            onFocus={() => announce(`Botão: Dica. ${hintsLeft} dica${hintsLeft !== 1 ? "s" : ""} restante${hintsLeft !== 1 ? "s" : ""}. Pressione Enter para revelar uma letra.`)}
            disabled={lock || gameOver || hintsLeft <= 0}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold border border-amber-200 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={`Usar dica. ${hintsLeft} dica${hintsLeft !== 1 ? "s" : ""} restante${hintsLeft !== 1 ? "s" : ""}`}
          >
            💡 Dica ({hintsLeft} restante{hintsLeft !== 1 ? "s" : ""})
          </button>
        </div>

        <h2 id="teclado-heading" className="sr-only">Teclado de letras</h2>
        <p id="teclado-instrucoes" className="sr-only">
          {COMANDOS_TECLADO}
        </p>
        <section
          className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4"
          aria-labelledby="teclado-heading"
          aria-describedby="teclado-instrucoes"
        >
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 select-none">
            {ALPHABET.map((L) => (
              <Key
                key={L}
                letter={L}
                pressed={guessed.has(L)}
                correct={lettersInWord.has(L)}
                gameOver={gameOver}
                locked={lock}
                onClick={() => guessLetter(L)}
                onFocusAnnounce={announceKeyFocus}
              />
            ))}
          </div>
        </section>

        {won && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className="mt-6 p-4 rounded-xl bg-emerald-100 text-emerald-900 font-semibold text-center focus:outline-none"
          >
            Parabéns! Você acertou "{word}" com {mistakes} erro{mistakes !== 1 ? "s" : ""} em {formatTime(time)}.
          </div>
        )}
        {lost && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className="mt-6 p-4 rounded-xl bg-rose-100 text-rose-900 font-semibold text-center focus:outline-none"
          >
            Fim de jogo! A palavra era "{word}". Tente novamente.
          </div>
        )}
      </main>
    </div>
  );
}