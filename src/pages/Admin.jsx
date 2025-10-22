// src/pages/Admin.jsx
import { store } from "../lib/store.js";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, X } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

/* -------- Dialog genérico -------- */
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
            className="text-slate-400 hover:text-slate-600 transition"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 text-slate-700">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

/* Util: ajusta o tamanho do array mantendo valores e preenchendo com "" */
function resizeOptions(opts = [], newLen = 4) {
  const next = [...opts];
  if (newLen > next.length) {
    while (next.length < newLen) next.push("");
  } else if (newLen < next.length) {
    next.length = newLen;
  }
  return next;
}

/* -------- Página principal -------- */
export default function Admin() {
  const navigate = useNavigate();
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");
  const [quizzes, setQuizzes] = useState(() => store.get("quizzes", []));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    timePerQuestion: 20,
    questions: [],
  });

  // quantidade padrão de alternativas para novas perguntas
  const [defaultOptionCount, setDefaultOptionCount] = useState(4);

  const [info, setInfo] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // Normaliza estrutura ao carregar
  useEffect(() => {
    const fixed = (store.get("quizzes", []) || []).map((qz) => ({
      ...qz,
      questions: (qz.questions || []).map((p) => ({
        ...p,
        opts:
          Array.isArray(p.opts) && p.opts.length >= 2
            ? p.opts
            : ["", "", "", ""],
        correct: Number.isFinite(Number(p.correct)) ? Number(p.correct) : -1,
      })),
    }));
    store.set("quizzes", fixed);
    setQuizzes(fixed);
  }, []);

  // Reflete mudanças (backup)
  useEffect(() => {
    store.set("quizzes", quizzes);
    window.dispatchEvent(new Event("quizzes-updated"));
  }, [quizzes]);

  function resetForm() {
    setForm({
      id: "",
      title: "",
      description: "",
      timePerQuestion: 20,
      questions: [],
    });
  }

  function addQuestion() {
    setForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        {
          q: "",
          opts: resizeOptions([], defaultOptionCount),
          correct: -1,
        },
      ],
    }));
  }

  function updateQuestion(i, patch) {
    setForm((f) => {
      const qs = [...f.questions];
      qs[i] = { ...qs[i], ...patch };
      return { ...f, questions: qs };
    });
  }

  // Ajusta a quantidade de alternativas de uma pergunta específica
  function setQuestionOptionCount(i, newCount) {
    setForm((f) => {
      const qs = [...f.questions];
      const current = qs[i] || { opts: [], correct: -1 };
      const resized = resizeOptions(current.opts, newCount);

      // se o índice correto sair do range, zera
      const correct =
        Number.isFinite(Number(current.correct)) &&
        current.correct >= 0 &&
        current.correct < newCount
          ? Number(current.correct)
          : -1;

      qs[i] = { ...current, opts: resized, correct };
      return { ...f, questions: qs };
    });
  }

  function editQuiz(id) {
    const q = quizzes.find((x) => x.id === id);
    if (!q) return;
    setForm(JSON.parse(JSON.stringify(q))); // deep clone
    setModalOpen(true);
  }

  function removeQuiz(id) {
    setConfirmDel({
      id,
      title: "Excluir quiz?",
      message:
        "Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.",
    });
  }

  function saveQuiz() {
    if (!form.title || form.questions.length === 0) {
      setInfo({
        title: "Atenção",
        message: "Preencha o título e pelo menos 1 pergunta.",
      });
      return;
    }

    // valida: cada pergunta precisa ter pelo menos 2 alternativas
    const invalid = form.questions.find(
      (p) => !Array.isArray(p.opts) || p.opts.length < 2
    );
    if (invalid) {
      setInfo({
        title: "Atenção",
        message: "Cada pergunta deve ter ao menos 2 alternativas.",
      });
      return;
    }

    const data = {
      ...form,
      questions: form.questions.map((p) => ({
        ...p,
        opts: p.opts.map((s) => String(s ?? "")),
        correct: Number.isFinite(Number(p.correct)) ? Number(p.correct) : -1,
      })),
      id: form.id || Date.now().toString(36),
    };

    setQuizzes((list) => {
      const idx = list.findIndex((x) => x.id === form.id);
      let next;
      if (idx >= 0) {
        next = [...list];
        next[idx] = data;
      } else {
        next = [...list, data];
      }
      store.set("quizzes", next);
      window.dispatchEvent(new Event("quizzes-updated"));
      return next;
    });

    setModalOpen(false);
    resetForm();
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          {/* Voltar */}
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:bg-white/10 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800">
              Painel Administrativo
            </h1>
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium"
            >
              <PlusCircle size={18} /> Novo Quiz
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Lista de quizzes */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-slate-800">
                Quizzes{" "}
                <span className="text-slate-400 text-sm">
                  ({quizzes.length})
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Título</th>
                    <th className="py-2 px-3 hidden md:table-cell">
                      Descrição
                    </th>
                    <th className="py-2 px-3 text-center">Perguntas</th>
                    <th className="py-2 px-3 text-center">Tempo</th>
                    <th className="py-2 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((q, i) => (
                    <tr
                      key={q.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{q.title}</td>
                      <td className="py-2 px-3 hidden md:table-cell text-slate-500">
                        {q.description || "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {q.questions.length}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {q.timePerQuestion}s
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => editQuiz(q.id)}
                            className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-600 transition"
                            aria-label="Editar quiz"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => removeQuiz(q.id)}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition"
                            aria-label="Excluir quiz"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quizzes.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 text-center text-slate-400"
                      >
                        Nenhum quiz criado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* -------- Modal de criação/edição de quiz -------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-semibold text-slate-800">
                {form.id ? "Editar Quiz" : "Novo Quiz"}
              </h3>
              <button
                className="text-slate-400 hover:text-slate-600 transition"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            {/* Campos principais */}
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1">
                    Título
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                    placeholder="Ex: Acessibilidade Web"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Tempo por questão (s)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={form.timePerQuestion}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        timePerQuestion: +e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border text-black border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Descrição
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                  placeholder="Resumo do tema"
                />
              </div>

              {/* Config global de novas perguntas */}
              <div className="grid md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Qtd. alternativas (padrão)
                  </label>
                  <select
                    value={defaultOptionCount}
                    onChange={(e) => setDefaultOptionCount(+e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                  >
                    {[2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} alternativas
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium transition"
                    onClick={addQuestion}
                  >
                    <PlusCircle size={18} /> Adicionar pergunta
                  </button>
                </div>
              </div>

              {/* Lista de perguntas */}
              <ol className="space-y-3">
                {form.questions.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3"
                  >
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-slate-700">
                          Pergunta {i + 1}
                        </label>
                        <input
                          value={q.q}
                          onChange={(e) =>
                            updateQuestion(i, { q: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                          placeholder="Digite a pergunta"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">
                          Qtd. alternativas
                        </label>
                        <select
                          value={q.opts?.length || 4}
                          onChange={(e) =>
                            setQuestionOptionCount(i, +e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                        >
                          {[2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(q.opts || []).map((op, j) => (
                        <div
                          key={j}
                          className="flex items-center text-black gap-2"
                        >
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={Number(q.correct ?? -1) === j}
                            onChange={() =>
                              updateQuestion(i, { correct: Number(j) })
                            }
                            className="accent-sky-500"
                          />
                          <input
                            value={op}
                            onChange={(e) =>
                              updateQuestion(i, {
                                opts: q.opts.map((o, k) =>
                                  k === j ? e.target.value : o
                                ),
                              })
                            }
                            className={`flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none ${
                              Number(q.correct ?? -1) === j
                                ? "bg-sky-50 border-sky-400"
                                : ""
                            }`}
                            placeholder={`Opção ${j + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-1">
                      <button
                        className="text-rose-600 hover:text-rose-700 text-sm"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            questions: f.questions.filter((_, k) => k !== i),
                          }))
                        }
                      >
                        Remover pergunta
                      </button>
                      <span className="text-xs text-slate-500">
                        Dica: marque o círculo da alternativa correta.
                      </span>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Ações */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 mt-2">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition"
                  onClick={saveQuiz}
                >
                  Salvar Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------- Pop-ups -------- */}
      <Dialog
        open={!!info}
        title={info?.title || ""}
        onClose={() => setInfo(null)}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition"
            onClick={() => setInfo(null)}
          >
            OK
          </button>
        }
      >
        <p>{info?.message}</p>
      </Dialog>

      <Dialog
        open={!!confirmDel}
        title={confirmDel?.title || ""}
        onClose={() => setConfirmDel(null)}
        actions={
          <>
            <button
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
              onClick={() => setConfirmDel(null)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
              onClick={() => {
                setQuizzes((q) => {
                  const next = q.filter((x) => x.id !== confirmDel.id);
                  store.set("quizzes", next);
                  window.dispatchEvent(new Event("quizzes-updated"));
                  return next;
                });
                setConfirmDel(null);
              }}
            >
              Excluir
            </button>
          </>
        }
      >
        <p>{confirmDel?.message}</p>
      </Dialog>
    </>
  );
}
