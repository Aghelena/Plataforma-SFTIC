import { store } from "../lib/store.js";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, Clock, CheckCircle2 } from "lucide-react";
import { speak } from "../lib/speech";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logosfitc.png";

/* -------- Normalizadores -------- */
function normalizeQuiz(qz) {
  return {
    ...qz,
    questions: (qz.questions || []).map((p) => ({
      ...p,
      correct: Number(p.correct),
    })),
  };
}

function readQuizzes() {
  try {
    const raw = localStorage.getItem("quizzes");
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeQuiz) : [];
    }
  } catch {
    // fallback
  }
  const fromStore = store.get("quizzes", []);
  return Array.isArray(fromStore) ? fromStore.map(normalizeQuiz) : [];
}

/* -------- Dialog reutilizável -------- */
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 text-slate-700">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

/* -------- Página principal -------- */
export default function User() {
  const [quizzes, setQuizzes] = useState([]);
  const [current, setCurrent] = useState(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [reading, setReading] = useState(false);

  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  // ✅ useNavigate dentro do componente
  const navigate = useNavigate();
  const goBack = () =>
    (window.history.length > 1 ? navigate(-1) : navigate("/"));

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
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          next();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    if (reading) {
      const q = current.questions[idx];
      speak(`Questão ${idx + 1}. ${q.q}. Opções: ${q.opts.join(", ")}`);
    }

    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [current, idx]);

  function start(id) {
    const qz = quizzes.find((q) => q.id === id);
    if (!qz) return;
    setCurrent(normalizeQuiz(qz));
    setIdx(0);
    setScore(0);
  }

  function answer(i) {
    const q = current.questions[idx];
    if (i === Number(q.correct)) setScore((s) => s + 1);
    next();
  }

  function next() {
    if (idx + 1 >= current.questions.length) {
      const scores = store.get("scores", []);
      scores.push({
        quizId: current.id,
        title: current.title,
        when: new Date().toISOString(),
        score,
        total: current.questions.length,
      });
      store.set("scores", scores);
      setResult({
        title: "Resultado",
        text: `Você acertou ${score} de ${current.questions.length} (${Math.round(
          (score / current.questions.length) * 100
        )}%)`,
      });
      setCurrent(null);
      setIdx(0);
    } else {
      setIdx((i) => i + 1);
    }
  }

  // Pode ser usado depois (histórico)
  const history = store.get("scores", []).slice(-20).reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ✅ Header com Voltar + logo branca */}
      <header className="bg-sky-500 text-black sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Esquerda: Voltar */}
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          {/* Centro: logo + título */}
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-black">Quiz Acessível</h1>
          </div>

          {/* Direita: espaçador para balancear */}
          <div aria-hidden className="w-[88px]" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* ---------- Lista de quizzes ---------- */}
        {!current && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Quizzes disponíveis
              </h2>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm transition"
                  onClick={() => setReading((v) => !v)}
                  aria-pressed={reading}
                >
                  {reading ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {reading ? "Leitor: ON" : "Leitor: OFF"}
                </button>
              </div>
            </div>

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
                      <Clock size={12} /> {q.timePerQuestion}s por questão
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition"
                      onClick={() => start(q.id)}
                    >
                      Iniciar
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium transition"
                      onClick={() =>
                        setPreview({
                          title: `Prévia — ${q.title}`,
                          lines: q.questions.map(
                            (x, i) =>
                              `${i + 1}. ${x.q}\n- ${x.opts.join("\n- ")}`
                          ),
                        })
                      }
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
          <section className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                Questão {idx + 1} de {current.questions.length}
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} /> Tempo restante: {remaining}s
              </div>
            </div>

            <p className="mt-4 text-lg font-medium text-slate-800">
              {current.questions[idx].q}
            </p>

            <div className="grid md:grid-cols-2 gap-3 mt-5">
              {current.questions[idx].opts.map((op, i) => (
                <button
                  key={i}
                  className="px-4 py-3 text-left rounded-lg bg-slate-100 hover:bg-sky-100 border border-slate-200 text-slate-800 font-medium transition"
                  onClick={() => answer(i)}
                >
                  {`${"ABCD"[i]}) ${op}`}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ---------- Prévia ---------- */}
      <Dialog
        open={!!preview}
        title={preview?.title || ""}
        onClose={() => setPreview(null)}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600"
            onClick={() => setPreview(null)}
          >
            Fechar
          </button>
        }
      >
        <div className="space-y-3 text-sm whitespace-pre-line">
          {preview?.lines?.map((ln, idx) => (
            <pre key={idx}>{ln}</pre>
          ))}
        </div>
      </Dialog>

      {/* ---------- Resultado ---------- */}
      <Dialog
        open={!!result}
        title={result?.title || "Resultado"}
        onClose={() => setResult(null)}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600"
            onClick={() => setResult(null)}
          >
            OK
          </button>
        }
      >
        <div className="flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="text-green-500" /> {result?.text}
        </div>
      </Dialog>
    </div>
  );
}
