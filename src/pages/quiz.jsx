import { store } from "../lib/store.js";
import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { speak } from "../lib/speech.js";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logosfitc.png";

/* ============================================================
   QUIZZES PADRÃO
   ============================================================ */
const DEFAULT_QUIZZES = [
  {
    id: "quiz-curiosidades-animais",
    title: "Curiosidades sobre Animais",
    description: "Um quiz divertido pra testar o que você sabe sobre bichos.",
    timePerQuestion: 200,
    questions: [
      {
        q: "Qual desses animais consegue dormir com um olho aberto?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Golfinho", image: null, imageAlt: "" },
          { text: "Coelho", image: null, imageAlt: "" },
          { text: "Gato", image: null, imageAlt: "" },
        ],
        correct: 0,
      },
      {
        q: "Qual é o maior animal terrestre do mundo?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Elefante-africano", image: null, imageAlt: "" },
          { text: "Girafa", image: null, imageAlt: "" },
          { text: "Rinoceronte", image: null, imageAlt: "" },
        ],
        correct: 0,
      },
      {
        q: "As abelhas se comunicam principalmente através de:",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Sons", image: null, imageAlt: "" },
          { text: "Danças", image: null, imageAlt: "" },
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "quiz-geografia-mundo",
    title: "Volta ao Mundo",
    description: "Teste seus conhecimentos de geografia com perguntas rápidas.",
    timePerQuestion: 200,
    questions: [
      {
        q: "Qual é o maior oceano do planeta?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Oceano Atlântico", image: null, imageAlt: "" },
          { text: "Oceano Pacífico", image: null, imageAlt: "" },
          { text: "Oceano Índico", image: null, imageAlt: "" },
        ],
        correct: 1,
      },
      {
        q: "A Torre Eiffel fica em qual cidade?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Paris", image: null, imageAlt: "" },
          { text: "Roma", image: null, imageAlt: "" },
        ],
        correct: 0,
      },
      {
        q: "Qual é o maior país do mundo em área territorial?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "China", image: null, imageAlt: "" },
          { text: "Canadá", image: null, imageAlt: "" },
          { text: "Rússia", image: null, imageAlt: "" },
        ],
        correct: 2,
      },
    ],
  },
  {
    id: "quiz-ciencia-curiosa",
    title: "Ciência Curiosa",
    description: "Pequenas curiosidades científicas para exercitar a mente.",
    timePerQuestion: 200,
    questions: [
      {
        q: "Qual é o estado físico da água a 0°C, no nível do mar?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Líquido", image: null, imageAlt: "" },
          { text: "Sólido (gelo)", image: null, imageAlt: "" },
        ],
        correct: 1,
      },
      {
        q: "Quantos ossos tem, aproximadamente, o corpo humano adulto?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "206", image: null, imageAlt: "" },
          { text: "150", image: null, imageAlt: "" },
          { text: "300", image: null, imageAlt: "" },
        ],
        correct: 0,
      },
      {
        q: "Qual planeta do sistema solar é conhecido como 'planeta vermelho'?",
        image: null,
        imageAlt: "",
        opts: [
          { text: "Vênus", image: null, imageAlt: "" },
          { text: "Marte", image: null, imageAlt: "" },
          { text: "Júpiter", image: null, imageAlt: "" },
        ],
        correct: 1,
      },
    ],
  },
];

/* -------- Normalizadores -------- */
function normalizeOption(op) {
  if (typeof op === "string") {
    return { text: op, image: null, imageAlt: "" };
  }
  return {
    text: op?.text ?? "",
    image: op?.image ?? null,
    imageAlt: op?.imageAlt ?? "",
  };
}

function normalizeQuiz(qz) {
  return {
    ...qz,
    questions: (qz.questions || []).map((p) => ({
      ...p,
      correct: Number(p.correct),
      image: p.image ?? null,
      imageAlt: p.imageAlt ?? "",
      opts: (p.opts || []).map(normalizeOption),
    })),
  };
}

function readQuizzes() {
  let saved = [];

  try {
    const raw = localStorage.getItem("quizzes");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) saved = parsed;
    }
  } catch {
    // fallback
  }

  if (saved.length === 0) {
    const fromStore = store.get("quizzes", []);
    if (Array.isArray(fromStore)) saved = fromStore;
  }

  const savedIds = new Set(saved.map((q) => q.id));

  // Para os 3 quizzes padrão, o tempo por pergunta sempre vem do
  // código (DEFAULT_QUIZZES), mesmo que exista uma cópia salva
  // antiga no localStorage/store com um valor desatualizado. Isso
  // não afeta quizzes criados/editados pelo Admin (ids diferentes).
  const defaultsById = new Map(DEFAULT_QUIZZES.map((d) => [d.id, d]));
  const savedWithSyncedTime = saved.map((s) => {
    const def = defaultsById.get(s.id);
    return def ? { ...s, timePerQuestion: def.timePerQuestion } : s;
  });

  const merged = [
    ...DEFAULT_QUIZZES.filter((d) => !savedIds.has(d.id)),
    ...savedWithSyncedTime,
  ];

  return merged.map(normalizeQuiz);
}

/* -------- Dialog reutilizável -------- */
function Dialog({ open, title, children, actions, onClose, titleId, onAnnounce }) {
  const closeBtnRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement;
      const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => clearTimeout(t);
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 id={titleId} className="font-semibold text-slate-800">
            {title}
          </h3>
          <button
            ref={closeBtnRef}
            onFocus={() => onAnnounce?.("Botão: Fechar. Pressione Enter para fechar esta janela.")}
            className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            onClick={onClose}
            aria-label="Fechar"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="mt-4 text-slate-700">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

/* -------- Página principal -------- */
export default function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [current, setCurrent] = useState(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const [feedback, setFeedback] = useState("");
  const [locked, setLocked] = useState(false);
  const advanceTimeoutRef = useRef(null);

  const [timeAnnouncement, setTimeAnnouncement] = useState("");
  const announcedMarksRef = useRef(new Set());

  const liveRef = useRef(null);
  const questionHeadingRef = useRef(null);

  const navigate = useNavigate();
  const goBack = () =>
    (window.history.length > 1 ? navigate(-1) : navigate("/"));

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  const COMANDOS_LISTA =
    "Use Tab para navegar entre os quizzes disponíveis. Cada quiz tem dois botões: Iniciar e Prévia. Pressione Enter para ativar o botão selecionado.";

  const COMANDOS_QUESTAO =
    "Use Tab para navegar entre as alternativas de resposta, e Enter ou Espaço para escolher uma.";

  /* Sincroniza quizzes */
  useEffect(() => {
    const load = () => setQuizzes(readQuizzes());
    load();
    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    window.addEventListener("quizzes-updated", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", load);
      window.removeEventListener("quizzes-updated", load);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    setRemaining(current.timePerQuestion);
    announcedMarksRef.current = new Set();
    setFeedback("");
    setLocked(false);

    const t = setInterval(() => {
      setRemaining((r) => {
        const next_r = r - 1;
        if (next_r <= 0) {
          clearInterval(t);
          handleTimeout();
          return 0;
        }
        if ((next_r === 10 || next_r === 5) && !announcedMarksRef.current.has(next_r)) {
          announcedMarksRef.current.add(next_r);
          setTimeAnnouncement(`${next_r} segundos restantes`);
        }
        return next_r;
      });
    }, 1000);

    // Anuncia a pergunta automaticamente ao carregar. Na primeira
    // pergunta do quiz, inclui a explicação dos comandos de teclado.
    const q = current.questions[idx];
    const optsText = q.opts.map((o, i) => `${"ABCD"[i]}) ${o.text}`).join(", ");
    const prefixo = idx === 0 ? `${COMANDOS_QUESTAO} ` : "";
    announce(`${prefixo}Questão ${idx + 1} de ${current.questions.length}. ${q.q} Alternativas: ${optsText}.`);

    questionHeadingRef.current?.focus();

    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [current, idx]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  function start(id) {
    const qz = quizzes.find((q) => q.id === id);
    if (!qz) return;
    setCurrent(normalizeQuiz(qz));
    setIdx(0);
    setScore(0);
  }

  function comoJogar() {
    if (!current) return;
    const q = current.questions[idx];
    const optsText = q.opts.map((o, i) => `${"ABCD"[i]}) ${o.text}`).join(", ");
    announce(`${COMANDOS_QUESTAO} Pergunta atual: ${q.q} Alternativas: ${optsText}.`);
  }

  function handleTimeout() {
    setFeedback("Tempo esgotado. Resposta considerada incorreta.");
    setLocked(true);
    advanceTimeoutRef.current = setTimeout(() => goToNext(score), 1200);
  }

  function answer(i) {
    if (locked) return;
    const q = current.questions[idx];
    const isCorrect = i === Number(q.correct);
    const newScore = isCorrect ? score + 1 : score;

    setScore(newScore);
    setLocked(true);
    setFeedback(
      isCorrect
        ? "Correto!"
        : `Incorreto. A resposta certa era: ${q.opts[q.correct]?.text ?? ""}.`
    );

    advanceTimeoutRef.current = setTimeout(() => goToNext(newScore), 1200);
  }

  function goToNext(scoreAtThisPoint) {
    if (idx + 1 >= current.questions.length) {
      const scores = store.get("scores", []);
      scores.push({
        quizId: current.id,
        title: current.title,
        when: new Date().toISOString(),
        score: scoreAtThisPoint,
        total: current.questions.length,
      });
      store.set("scores", scores);
      setResult({
        title: "Resultado",
        text: `Você acertou ${scoreAtThisPoint} de ${current.questions.length} (${Math.round(
          (scoreAtThisPoint / current.questions.length) * 100
        )}%)`,
      });
      setCurrent(null);
      setIdx(0);
    } else {
      setIdx((i) => i + 1);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="bg-sky-500 text-black sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={goBack}
            onFocus={() => announce(
              current
                ? "Botão: Voltar. Isso vai sair do Quiz e voltar para a tela inicial da plataforma. Pressione Enter para confirmar."
                : "Botão: Voltar. Isso vai sair da lista de quizzes e voltar para a tela inicial da plataforma. Pressione Enter para confirmar."
            )}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Voltar para a tela inicial"
          >
            ← Voltar
          </button>

          <div className="flex items-center gap-3">
            <h1 className="font-bold text-black">Quiz Acessível</h1>
          </div>

          <div className="flex items-center gap-2">
            {current && (
              <button
                onClick={comoJogar}
                onFocus={() => announce("Botão: Como jogar. Pressione Enter para repetir a pergunta atual e os comandos.")}
                className="px-3 py-1.5 rounded-md text-black font-bold hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Ouvir como jogar e repetir a pergunta atual"
                title="Como jogar"
              >
                🔊
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* ---------- Lista de quizzes ---------- */}
        {!current && (
          <section aria-labelledby="quizzes-heading" aria-describedby="quizzes-instrucoes">
            <div className="flex items-center justify-between mb-4">
              <h2 id="quizzes-heading" className="text-xl font-bold text-slate-800">
                Quizzes disponíveis
              </h2>
            </div>

            <p id="quizzes-instrucoes" className="sr-only">
              {COMANDOS_LISTA}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {q.title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {q.description || ""}
                    </p>
                    <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      <span>{q.timePerQuestion}s por questão</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                      onClick={() => start(q.id)}
                      onFocus={() => announce(`Botão: Iniciar quiz ${q.title}. Pressione Enter para começar.`)}
                      aria-label={`Iniciar quiz ${q.title}`}
                    >
                      Iniciar
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                      onClick={() =>
                        setPreview({
                          title: `Prévia — ${q.title}`,
                          items: q.questions.map((x) => ({
                            question: x.q,
                            options: x.opts.map((o) => o.text),
                          })),
                        })
                      }
                      onFocus={() => announce(`Botão: Ver prévia do quiz ${q.title}. Pressione Enter para ver as perguntas antes de começar.`)}
                      aria-label={`Ver prévia do quiz ${q.title}`}
                    >
                      Prévia
                    </button>
                  </div>
                </div>
              ))}

              {quizzes.length === 0 && (
                <div className="text-slate-400">
                  Nenhum quiz disponível ainda.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ---------- Execução do quiz ---------- */}
        {current && (
          <section
            className="bg-white border border-slate-200 rounded-xl shadow-md p-6"
            aria-labelledby="current-question-heading"
            aria-describedby="questao-instrucoes"
          >
            <div className="flex items-center justify-between">
              <h2
                id="current-question-heading"
                ref={questionHeadingRef}
                tabIndex={-1}
                className="font-semibold text-slate-800 focus:outline-none"
              >
                Questão {idx + 1} de {current.questions.length}
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} aria-hidden="true" />
                <span aria-hidden="true">Tempo restante: {remaining}s</span>
              </div>
            </div>

            <p id="questao-instrucoes" className="sr-only">
              {COMANDOS_QUESTAO}
            </p>

            <div className="sr-only" role="status" aria-live="assertive">
              {timeAnnouncement}
            </div>

            <p className="mt-4 text-lg font-medium text-slate-800">
              {current.questions[idx].q}
            </p>

            {current.questions[idx].image && (
              <img
                src={current.questions[idx].image}
                alt={current.questions[idx].imageAlt || ""}
                className="mt-3 rounded-lg max-h-56 w-auto object-cover"
              />
            )}

            <div className="grid md:grid-cols-2 gap-3 mt-5">
              {current.questions[idx].opts.map((op, i) => (
                <button
                  key={i}
                  className="px-4 py-3 text-left rounded-lg bg-slate-100 hover:bg-sky-100 border border-slate-200 text-slate-800 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 aria-disabled:opacity-60"
                  onClick={() => answer(i)}
                  onFocus={() => announce(`Alternativa ${"ABCD"[i]}: ${op.text}. Pressione Enter para escolher.`)}
                  aria-disabled={locked ? true : undefined}
                  aria-label={`Alternativa ${"ABCD"[i]}: ${op.text}`}
                >
                  <span aria-hidden="true">{`${"ABCD"[i]}) ${op.text}`}</span>
                  {op.image && (
                    <img
                      src={op.image}
                      alt={op.imageAlt || ""}
                      className="mt-2 rounded max-h-28 w-auto object-cover"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="sr-only" role="status" aria-live="assertive">
              {feedback}
            </div>
          </section>
        )}
      </main>

      {/* ---------- Prévia ---------- */}
      <Dialog
        open={!!preview}
        title={preview?.title || ""}
        titleId="preview-dialog-title"
        onClose={() => setPreview(null)}
        onAnnounce={announce}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            onClick={() => setPreview(null)}
            onFocus={() => announce("Botão: Fechar prévia. Pressione Enter para voltar à lista de quizzes.")}
          >
            Fechar
          </button>
        }
      >
        <ol className="space-y-3 text-sm list-decimal list-inside">
          {preview?.items?.map((item, i) => (
            <li key={i}>
              {item.question}
              <ul className="list-disc list-inside ml-4 mt-1 text-slate-600">
                {item.options.map((opt, j) => (
                  <li key={j}>{opt}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Dialog>

      {/* ---------- Resultado ---------- */}
      <Dialog
        open={!!result}
        title={result?.title || "Resultado"}
        titleId="result-dialog-title"
        onClose={() => setResult(null)}
        onAnnounce={announce}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            onClick={() => setResult(null)}
            onFocus={() => announce("Botão: OK. Pressione Enter para fechar o resultado.")}
          >
            OK
          </button>
        }
      >
        <div className="flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="text-green-500" aria-hidden="true" />
          <span>{result?.text}</span>
        </div>
      </Dialog>
    </div>
  );
}