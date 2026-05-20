// src/pages/Admin.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, Trash2, X, Activity,
  Users, Gamepad2, Clock, Target,
} from "lucide-react";
import { store } from "../lib/store.js";
import { apiFetch } from "../lib/api.js";

// ─── utilidades ──────────────────────────────────────────────
function initials(name = "") {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAECE7", text: "#993C1D" },
  { bg: "#FBEAF0", text: "#993556" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#EAF3DE", text: "#3B6D11" },
];

function avatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function statusTag(pct) {
  if (pct >= 75) return { label: "evolução",  bg: "#EEEDFE", color: "#534AB7" };
  if (pct >= 50) return { label: "estável",   bg: "#E1F5EE", color: "#0F6E56" };
  return               { label: "atenção",    bg: "#FCEBEB", color: "#A32D2D" };
}

function fmtSeconds(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m > 0 ? `${m}min ${ss}s` : `${ss}s`;
}

// ─── componentes menores ──────────────────────────────────────
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button className="text-slate-400 hover:text-slate-600 transition" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 text-slate-700">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── gráfico de barras inline (sem dependência externa) ───────
function BarChart({ data, colorKey }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const COLORS = {
    purple: "#534AB7", teal: "#1D9E75",
    coral: "#D85A30", gray: "#888780",
    blue: "#378ADD",  green: "#639922",
  };
  const palette = ["#534AB7", "#1D9E75", "#D85A30", "#888780", "#378ADD", "#639922"];

  return (
    <div className="space-y-2 mt-2">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium capitalize">{d.label}</span>
            <span>{d.display ?? d.value}</span>
          </div>
          <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all"
              style={{
                width: `${Math.round((d.value / max) * 100)}%`,
                background: palette[i % palette.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── aba dashboard ────────────────────────────────────────────
function TabDashboard({ quizzes }) {
  const [data, setData]       = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summary, userList] = await Promise.all([
          apiFetch("/api/dashboard/admin-summary"),
          apiFetch("/api/users"),
        ]);
        setData(summary);
        setUsers(Array.isArray(userList) ? userList : []);
      } catch (e) {
        setError("Erro ao carregar dashboard. Verifique se o servidor está rodando.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedUser) { setUserDetail(null); return; }
    async function loadUser() {
      setDetailLoading(true);
      try {
        const detail = await apiFetch(`/api/dashboard/users/${selectedUser.id}/summary`);
        setUserDetail(detail);
      } catch (e) {
        console.error(e);
      } finally {
        setDetailLoading(false);
      }
    }
    loadUser();
  }, [selectedUser]);

  if (loading) return <p className="text-slate-500 italic py-8 text-center">Carregando dashboard...</p>;
  if (error)   return <p className="text-rose-600 font-medium py-8 text-center">{error}</p>;

  const jogos        = data?.jogos          ?? [];
  const acess        = data?.acessibilidade ?? [];
  const totalSessoes = jogos.reduce((s, j) => s + (j.total_sessoes || 0), 0);
  const jogoTop      = jogos[0]?.game ?? "—";
  const assertMedia  = jogos.length
    ? Math.round(jogos.reduce((s, j) => s + Number(j.assertividade_media || 0), 0) / jogos.length)
    : 0;
  const tempoMedio   = jogos.length
    ? Math.round(jogos.reduce((s, j) => s + Number(j.tempo_medio_segundos || 0), 0) / jogos.length)
    : 0;

  const jogosBarData = jogos.map((j) => ({
    label: j.game,
    value: j.total_sessoes || 0,
  }));

  const assertBarData = jogos.map((j) => ({
    label: j.game,
    value: Math.round(Number(j.assertividade_media || 0)),
    display: `${Math.round(Number(j.assertividade_media || 0))}%`,
  }));

  const acessBarData = acess.map((a) => ({
    label: a.recurso.replace("toggle_", "").replace("_", " "),
    value: a.total_usos || 0,
  }));

  return (
    <div className="space-y-6">

      {/* métricas gerais */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Visão geral</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Sessões totais"    value={totalSessoes} sub="jogos registrados"      icon={<Gamepad2 size={16} />} />
          <MetricCard label="Assertividade média" value={`${assertMedia}%`} sub="acertos nos jogos" icon={<Target size={16} />} />
          <MetricCard label="Tempo médio"       value={fmtSeconds(tempoMedio)} sub="por sessão"    icon={<Clock size={16} />} />
          <MetricCard label="Usuários ativos"   value={data?.usuarios_ativos_30_dias ?? 0} sub="últimos 30 dias" icon={<Users size={16} />} />
        </div>
      </div>

      {/* jogos + assertividade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Sessões por jogo</p>
          {jogosBarData.length === 0
            ? <p className="text-slate-400 italic text-sm mt-4">Nenhuma sessão registrada ainda.</p>
            : <BarChart data={jogosBarData} />}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Assertividade por jogo</p>
          {assertBarData.length === 0
            ? <p className="text-slate-400 italic text-sm mt-4">Nenhum dado disponível ainda.</p>
            : <BarChart data={assertBarData} />}
        </div>
      </div>

      {/* evolução individual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Evolução individual</p>

        {users.length === 0 ? (
          <p className="text-slate-400 italic text-sm">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const color  = avatarColor(u.name);
              const isOpen = selectedUser?.id === u.id;
              return (
                <div key={u.id}>
                  <button
                    className="w-full text-left py-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 transition"
                    onClick={() => setSelectedUser(isOpen ? null : u)}
                    aria-expanded={isOpen}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: color.bg, color: color.text }}>
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 text-sm">{u.name}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {isOpen ? "▲ fechar" : "▼ detalhes"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        cadastrado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pb-4 px-2">
                      {detailLoading ? (
                        <p className="text-sm text-slate-400 italic">Carregando...</p>
                      ) : userDetail ? (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <MetricCard label="Sessões" value={userDetail.resumo.total_sessoes} />
                            <MetricCard label="Tempo médio" value={fmtSeconds(userDetail.resumo.tempo_medio_segundos)} />
                            <MetricCard
                              label="Assertividade"
                              value={`${Math.round(Number(userDetail.resumo.assertividade_media))}%`}
                            />
                          </div>

                          {userDetail.jogos.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Desempenho por jogo</p>
                              <div className="space-y-2">
                                {userDetail.jogos.map((j) => {
                                  const pct   = Math.round(Number(j.assertividade_media || 0));
                                  const tag   = statusTag(pct);
                                  return (
                                    <div key={j.game} className="flex items-center gap-3">
                                      <span className="text-xs font-medium text-slate-700 w-20 capitalize truncate">{j.game}</span>
                                      <div className="flex-1 h-4 bg-slate-200 rounded overflow-hidden">
                                        <div className="h-full rounded" style={{ width: `${pct}%`, background: tag.color }} />
                                      </div>
                                      <span className="text-xs w-8 text-right text-slate-600">{pct}%</span>
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: tag.bg, color: tag.color }}>
                                        {tag.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {userDetail.jogos.length === 0 && (
                            <p className="text-sm text-slate-400 italic">Nenhum jogo registrado para este usuário ainda.</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Sem dados disponíveis.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* acessibilidade */}
      {acessBarData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Uso de recursos assistivos</p>
          <BarChart data={acessBarData} />
        </div>
      )}

    </div>
  );
}

// ─── aba usuários ─────────────────────────────────────────────
function TabUsers() {
  const [usersList, setUsersList]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [info, setInfo]             = useState(null);
  const [newUser, setNewUser]       = useState({ name: "", email: "" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/users");
        setUsersList(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Erro ao carregar usuários.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const name  = newUser.name.trim();
    const email = newUser.email.trim() || null;

    if (!name) {
      setInfo({ title: "Atenção", message: "O nome é obrigatório." });
      return;
    }

    try {
      const created = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
      setUsersList((prev) => [created, ...prev]);
      setNewUser({ name: "", email: "" });
      setInfo({ title: "Usuário criado", message: `${name} foi cadastrado com sucesso.` });
    } catch (e) {
      setInfo({ title: "Erro", message: e.message || "Erro ao criar usuário." });
    }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remover "${name}"?`)) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setInfo({ title: "Erro", message: e.message || "Erro ao remover usuário." });
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Gerenciamento de usuários</h2>
          <span className="text-sm text-slate-400">Total: {usersList.length}</span>
        </div>

        {loading && <p className="text-sm text-slate-400 italic">Carregando...</p>}
        {error   && <p className="text-sm text-rose-600">{error}</p>}

        {/* formulário de cadastro */}
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3 items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Nome <span className="text-rose-500">*</span></label>
            <input
              value={newUser.name}
              onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
              placeholder="Ex: Fabrício"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">E-mail <span className="text-slate-400 text-xs">(opcional)</span></label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
              placeholder="fabricio@email.com"
            />
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium">
            <PlusCircle size={18} />
            Adicionar
          </button>
        </form>

        {/* tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700" style={{ tableLayout: "fixed", width: "100%" }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                <th className="py-2 px-3 w-8"></th>
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">E-mail</th>
                <th className="py-2 px-3">Cadastro</th>
                <th className="py-2 px-3 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const color = avatarColor(u.name);
                  return (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ background: color.bg, color: color.text }}>
                          {initials(u.name)}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-medium">{u.name || "—"}</td>
                      <td className="py-2 px-3 text-slate-400">{u.email || "—"}</td>
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleRemove(u.id, u.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          aria-label={`Remover ${u.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!info} title={info?.title || ""} onClose={() => setInfo(null)}
        actions={<button className="px-4 py-2 rounded-lg bg-sky-500 text-white" onClick={() => setInfo(null)}>OK</button>}>
        <p>{info?.message}</p>
      </Dialog>
    </>
  );
}

// ─── aba quiz ─────────────────────────────────────────────────
function TabQuiz({ quizzes, setQuizzes }) {
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", timePerQuestion: 20 });
  const [info, setInfo]       = useState(null);

  function handleCreate(e) {
    e.preventDefault();
    if (!newQuiz.title.trim()) {
      setInfo({ title: "Atenção", message: "Informe o título do quiz." });
      return;
    }
    const quiz = {
      id: Date.now().toString(36),
      title: newQuiz.title.trim(),
      description: newQuiz.description.trim(),
      timePerQuestion: Number(newQuiz.timePerQuestion) || 20,
      questions: [],
    };
    setQuizzes((prev) => [quiz, ...prev]);
    setNewQuiz({ title: "", description: "", timePerQuestion: 20 });
    setInfo({ title: "Quiz criado", message: "Quiz criado com sucesso." });
  }

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input value={newQuiz.title}
              onChange={(e) => setNewQuiz((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Ex: Quiz de Libras" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input value={newQuiz.description}
              onChange={(e) => setNewQuiz((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Descrição breve" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo por pergunta (s)</label>
            <input type="number" value={newQuiz.timePerQuestion}
              onChange={(e) => setNewQuiz((p) => ({ ...p, timePerQuestion: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <button type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium">
            <PlusCircle size={18} /> Novo Quiz
          </button>
        </form>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-slate-800">Quizzes cadastrados</h2>
            <span className="text-sm text-slate-400">Total: {quizzes.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                  <th className="py-2 px-3">Título</th>
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-3 text-center">Perguntas</th>
                  <th className="py-2 px-3 text-center">Tempo</th>
                  <th className="py-2 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">Nenhum quiz cadastrado.</td>
                  </tr>
                ) : (
                  quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold">{quiz.title}</td>
                      <td className="py-2 px-3">{quiz.description || "—"}</td>
                      <td className="py-2 px-3 text-center">{quiz.questions?.length || 0}</td>
                      <td className="py-2 px-3 text-center">{quiz.timePerQuestion || 20}s</td>
                      <td className="py-2 px-3 text-center">
                        <button onClick={() => setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id))}
                          className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition"
                          aria-label={`Remover quiz ${quiz.title}`}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={!!info} title={info?.title || ""} onClose={() => setInfo(null)}
        actions={<button className="px-4 py-2 rounded-lg bg-sky-500 text-white" onClick={() => setInfo(null)}>OK</button>}>
        <p>{info?.message}</p>
      </Dialog>
    </>
  );
}

// ─── página principal ─────────────────────────────────────────
export default function Admin() {
  const navigate   = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [quizzes, setQuizzes] = useState(() => {
    const data = store.get("quizzes", []);
    return Array.isArray(data) ? data : [];
  });

  useEffect(() => {
    store.set("quizzes", quizzes);
    window.dispatchEvent(new Event("quizzes-updated"));
  }, [quizzes]);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "users",     label: "Usuários"  },
    { id: "quiz",      label: "Quiz"      },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="px-3 py-1.5 rounded-md text-black hover:bg-black/5 font-semibold w-fit">
            ← Voltar
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-slate-800 mb-3">Painel Administrativo</h1>
            <div className="inline-flex bg-slate-100 rounded-full p-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                    tab === t.id ? "bg-white text-sky-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-[90px]" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "dashboard" && <TabDashboard quizzes={quizzes} />}
        {tab === "users"     && <TabUsers />}
        {tab === "quiz"      && <TabQuiz quizzes={quizzes} setQuizzes={setQuizzes} />}
      </main>
    </div>
  );
}