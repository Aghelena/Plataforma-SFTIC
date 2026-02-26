// src/pages/Admin.jsx
import { store } from "../lib/store.js";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5001";

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

  // Quizzes
  const [quizzes, setQuizzes] = useState(() => store.get("quizzes", []));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    timePerQuestion: 20,
    questions: [],
  });
  const [defaultOptionCount, setDefaultOptionCount] = useState(4);

  // Pop-ups
  const [info, setInfo] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // Abas: Quiz / Dashboard / Usuários
  const [activeTab, setActiveTab] = useState("quiz");

  // Dados do dashboard vindos do backend
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState("");

  // Resultados locais (caso você salve tentativas em store.results)
  const [results] = useState(() => {
    const stored = store.get("results", []);
    return Array.isArray(stored) ? stored : [];
  });

  // ✅ Usuários agora vêm do BACKEND (Postgres)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "student",
  });

  // Normaliza estrutura ao carregar quizzes
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

  // Reflete mudanças de quizzes
  useEffect(() => {
    store.set("quizzes", quizzes);
    window.dispatchEvent(new Event("quizzes-updated"));
  }, [quizzes]);

  // Carrega métricas do backend quando a aba Dashboard é ativada
  useEffect(() => {
    if (activeTab !== "dashboard") return;

    async function fetchDashboard() {
      setDashLoading(true);
      setDashError("");
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/admin-summary`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erro ao carregar dashboard");
        }
        setDashData(data);
      } catch (e) {
        console.error(e);
        setDashError("Erro ao carregar dados do dashboard.");
      } finally {
        setDashLoading(false);
      }
    }

    fetchDashboard();
  }, [activeTab]);

  // ✅ Carrega usuários do backend quando a aba Usuários é ativada
  useEffect(() => {
    if (activeTab !== "users") return;

    async function fetchUsers() {
      setUsersLoading(true);
      setUsersError("");
      try {
        const res = await fetch(`${API_BASE}/api/users`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar usuários");
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setUsersError("Erro ao carregar usuários do banco.");
      } finally {
        setUsersLoading(false);
      }
    }

    fetchUsers();
  }, [activeTab]);

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

  function setQuestionOptionCount(i, newCount) {
    setForm((f) => {
      const qs = [...f.questions];
      const current = qs[i] || { opts: [], correct: -1 };
      const resized = resizeOptions(current.opts, newCount);

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
    setForm(JSON.parse(JSON.stringify(q)));
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

  // ✅ Cadastro de usuário (BACKEND)
  async function handleAddUser(e) {
    e.preventDefault();

    const username = newUser.username.trim();
    const name = newUser.name.trim() || username;

    if (!username) {
      setInfo({
        title: "Atenção",
        message: "Informe pelo menos o nome de usuário.",
      });
      return;
    }

    const roleMap = {
      user: "Usuário",
      admin: "Admin",
    };

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name,
          role: roleMap[newUser.role] || "Usuário",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar usuário");

      setUsers((prev) => [data, ...prev]);
      setNewUser({ username: "", name: "", role: "student" });

      setInfo({
        title: "Usuário criado",
        message: "Usuário cadastrado no banco com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setInfo({
        title: "Erro",
        message: err.message || "Erro ao criar usuário.",
      });
    }
  }

  // ✅ Remover usuário (BACKEND)
  async function handleRemoveUser(id) {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao remover usuário");

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setInfo({
        title: "Erro",
        message: err.message || "Erro ao remover usuário.",
      });
    }
  }

  // Métricas locais
  const totalQuizzesLocal = quizzes.length;
  const totalAttempts = results.length; // (mantido)
  const uniqueUsersCount = (() => {
    const ids = new Set(
      results.map(
        (r) =>
          r.userId ||
          r.userEmail ||
          r.userName ||
          r.usuario ||
          r.aluno ||
          "desconhecido"
      )
    );
    return ids.size;
  })();
  const lastAttempts = [...results].slice(-10).reverse();

  // Métricas backend
  const totalLoginsDia = dashData?.total_logins_dia ?? 0;
  const acoesPorUsuario = dashData?.acoes_por_usuario_30d ?? 0;
  const usuariosAtivos30 = dashData?.usuarios_ativos_30_dias ?? 0;
  const tempoMedioUserSeg = dashData?.tempo_medio_user_segundos ?? 0;
  const jogosStats = dashData?.jogos ?? [];
  const topAtivos = dashData?.top_ativos ?? [];
  const retencao = dashData?.retencao_7d ?? null;
  const totalQuizzesDb = dashData?.quizzes?.total ?? 0;

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md text-black hover:bg-white/10 font-semibold"
              aria-label="Voltar"
            >
              ← Voltar
            </button>

            <div className="flex-1 flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                Painel Administrativo
              </h1>
              <div className="mt-1 inline-flex bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                    activeTab === "quiz"
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Quiz
                </button>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                    activeTab === "dashboard"
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                    activeTab === "users"
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Usuários
                </button>
              </div>
            </div>

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
          {/* ABA QUIZ */}
          {activeTab === "quiz" && (
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
          )}

          {/* ABA DASHBOARD */}
          {activeTab === "dashboard" && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800">
                  Dashboard de Desempenho
                </h3>
                <span className="text-xs text-slate-400">
                  Métricas da plataforma
                </span>
              </div>

              {dashLoading && (
                <p className="text-sm text-slate-500">
                  Carregando dados do dashboard...
                </p>
              )}
              {dashError && (
                <p className="text-sm text-rose-600">{dashError}</p>
              )}

              {/* Métricas principais */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Logins hoje
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {totalLoginsDia}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Usuários ativos (30 dias)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {usuariosAtivos30}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Ações por usuário (30d)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {acoesPorUsuario.toFixed(1)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Tempo médio / usuário
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {(tempoMedioUserSeg / 60).toFixed(1)} min
                  </p>
                </div>
              </div>

              {/* Quizzes + retenção */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Quizzes no banco (SQL)
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {totalQuizzesDb}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Quizzes neste painel
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {totalQuizzesLocal}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    (armazenados no store/localStorage)
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Retenção 7 dias
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-800">
                    {retencao ? `${retencao.percentual.toFixed(1)}%` : "–"}
                  </p>
                  {retencao && (
                    <p className="text-xs text-slate-500 mt-1">
                      {retencao.retidos_7d} de {retencao.usuarios_7d} usuários
                      voltaram na última semana.
                    </p>
                  )}
                </div>
              </div>

              {/* Jogos */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">
                  Jogos da plataforma
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                        <th className="py-2 px-3">Jogo</th>
                        <th className="py-2 px-3 text-center">Sessões</th>
                        <th className="py-2 px-3 text-center">
                          Usuários únicos
                        </th>
                        <th className="py-2 px-3 text-center">Tempo médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogosStats.map((g) => (
                        <tr
                          key={g.game}
                          className="border-b border-slate-100 hover:bg-slate-50 transition"
                        >
                          <td className="py-2 px-3">{g.game}</td>
                          <td className="py-2 px-3 text-center">
                            {g.total_sessoes}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {g.usuarios_unicos}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {(g.tempo_medio_segundos / 60).toFixed(1)} min
                          </td>
                        </tr>
                      ))}
                      {jogosStats.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-6 text-center text-slate-400"
                          >
                            Ainda não há sessões registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Últimas tentativas (store.results) */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">
                  Últimas tentativas de quiz
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                        <th className="py-2 px-3">Usuário</th>
                        <th className="py-2 px-3">Quiz</th>
                        <th className="py-2 px-3 text-center">Pontuação</th>
                        <th className="py-2 px-3 text-center">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastAttempts.map((r, idx) => {
                        const quizTitle =
                          quizzes.find((q) => q.id === r.quizId)?.title ||
                          r.quizTitle ||
                          "Quiz desconhecido";

                        const userLabel =
                          r.userName ||
                          r.userEmail ||
                          r.usuario ||
                          r.aluno ||
                          "Usuário";

                        let scoreText = "-";
                        if (typeof r.score === "number") {
                          scoreText = `${r.score.toFixed(1)}%`;
                        } else if (
                          typeof r.correct === "number" &&
                          typeof r.total === "number" &&
                          r.total > 0
                        ) {
                          const pct = (r.correct / r.total) * 100;
                          scoreText = `${pct.toFixed(1)}% (${r.correct}/${r.total})`;
                        }

                        const date =
                          r.date || r.createdAt || r.data || r.timestamp;
                        const dateText = date
                          ? new Date(date).toLocaleString()
                          : "-";

                        return (
                          <tr
                            key={idx}
                            className="border-b border-slate-100 hover:bg-slate-50 transition"
                          >
                            <td className="py-2 px-3">{userLabel}</td>
                            <td className="py-2 px-3">{quizTitle}</td>
                            <td className="py-2 px-3 text-center">{scoreText}</td>
                            <td className="py-2 px-3 text-center">{dateText}</td>
                          </tr>
                        );
                      })}
                      {lastAttempts.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-6 text-center text-slate-400"
                          >
                            Ainda não há tentativas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ABA USUÁRIOS */}
          {activeTab === "users" && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800">
                  Gerenciamento de usuários
                </h3>
                <span className="text-xs text-slate-400">
                  Total: {users.length}
                </span>
              </div>

              {/* (opcional) status - sem mudar design */}
              {usersLoading && (
                <p className="text-sm text-slate-500">
                  Carregando usuários do banco...
                </p>
              )}
              {usersError && (
                <p className="text-sm text-rose-600">{usersError}</p>
              )}

              {/* Formulário de novo usuário */}
              <form
                onSubmit={handleAddUser}
                className="grid gap-3 md:grid-cols-4 items-end bg-slate-50 border border-slate-200 rounded-xl p-4"
              >
                <div className="md:col-span-1">
                  <label className="block text-sm text-slate-700 mb-1">
                    Username (login)
                  </label>
                  <input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((u) => ({ ...u, username: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                    placeholder="ex: joao.silva"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm text-slate-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((u) => ({ ...u, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                    placeholder="João da Silva"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm text-slate-700 mb-1">
                    Papel
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((u) => ({ ...u, role: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                  >
                    <option value="student">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex flex-col gap-1">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium"
                  >
                    Adicionar usuário
                  </button>
                </div>
              </form>

              {/* Tabela de usuários */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                      <th className="py-2 px-3">Username</th>
                      <th className="py-2 px-3">Nome</th>
                      <th className="py-2 px-3">Papel</th>
                      <th className="py-2 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="py-2 px-3 font-mono">
                          {u.username || "-"}
                        </td>
                        <td className="py-2 px-3">{u.name}</td>
                        <td className="py-2 px-3">
                          {u.role === "Admin"
                            ? "Admin"
                            : "Usuário"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition"
                            aria-label="Excluir usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!usersLoading && users.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-6 text-center text-slate-400"
                        >
                          Nenhum usuário cadastrado ainda. Use o formulário
                          acima para adicionar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modal de criação/edição de quiz */}
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
                <div className="md:col-span-2 flex items-end gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium transition"
                    onClick={addQuestion}
                  >
                    <PlusCircle size={18} /> Adicionar pergunta
                  </button>
                </div>
              </div>

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
                        <div key={j} className="flex items-center text-black gap-2">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={Number(q.correct ?? -1) === j}
                            onChange={() => updateQuestion(i, { correct: Number(j) })}
                            className="accent-sky-500"
                          />
                          <input
                            value={op}
                            onChange={(e) =>
                              updateQuestion(i, {
                                opts: q.opts.map((o, k) => (k === j ? e.target.value : o)),
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

      {/* Pop-ups */}
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