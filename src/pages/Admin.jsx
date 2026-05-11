// src/pages/Admin.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  X,
  Activity,
  Heart,
  ShieldCheck,
  Users,
  Gamepad2,
} from "lucide-react";

import { store } from "../lib/store.js";
import { apiFetch } from "../lib/api.js";

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

function StatCard({ title, value, icon, description }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="p-2 rounded-xl bg-sky-50 text-sky-600">{icon}</div>
      </div>

      <p className="text-3xl font-black text-slate-800">{value}</p>

      {description && (
        <p className="mt-2 text-xs text-slate-400">{description}</p>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("quiz");

  const [quizzes, setQuizzes] = useState(() => {
    const data = store.get("quizzes", []);
    return Array.isArray(data) ? data : [];
  });

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    timePerQuestion: 20,
  });

  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "student",
  });

  const [info, setInfo] = useState(null);

  const goBack = () => {
    window.history.length > 1 ? navigate(-1) : navigate("/");
  };

  useEffect(() => {
    store.set("quizzes", quizzes);
    window.dispatchEvent(new Event("quizzes-updated"));
  }, [quizzes]);

  useEffect(() => {
    if (activeTab !== "dashboard") return;

    async function loadDashboard() {
      setDashLoading(true);
      setDashError("");

      try {
        const data = await apiFetch("/api/dashboard/admin-summary");
        setDashData(data);
      } catch (error) {
        console.error(error);
        setDashError("Erro ao carregar dados do dashboard.");
      } finally {
        setDashLoading(false);
      }
    }

    loadDashboard();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "users") return;

    async function loadUsers() {
      setUsersLoading(true);
      setUsersError("");

      try {
        const data = await apiFetch("/api/users");
        setUsersList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setUsersError("Erro ao carregar usuários.");
      } finally {
        setUsersLoading(false);
      }
    }

    loadUsers();
  }, [activeTab]);

  function handleCreateQuiz(e) {
    e.preventDefault();

    if (!newQuiz.title.trim()) {
      setInfo({
        title: "Atenção",
        message: "Informe o título do quiz.",
      });
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

    setNewQuiz({
      title: "",
      description: "",
      timePerQuestion: 20,
    });

    setInfo({
      title: "Quiz criado",
      message: "Quiz criado localmente com sucesso.",
    });
  }

  function handleRemoveQuiz(id) {
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== id));
  }

  async function handleCreateUser(e) {
    e.preventDefault();

    const username = newUser.username.trim();
    const name = newUser.name.trim() || username;

    if (!username) {
      setInfo({
        title: "Atenção",
        message: "Informe o username do usuário.",
      });
      return;
    }

    const roleMap = {
      student: "Usuário",
      user: "Usuário",
      admin: "Admin",
    };

    try {
      const created = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          name,
          role: roleMap[newUser.role] || "Usuário",
        }),
      });

      setUsersList((prev) => [created, ...prev]);

      setNewUser({
        username: "",
        name: "",
        role: "student",
      });

      setInfo({
        title: "Usuário criado",
        message: "Usuário cadastrado no banco com sucesso.",
      });
    } catch (error) {
      console.error(error);
      setInfo({
        title: "Erro",
        message: error.message || "Erro ao criar usuário.",
      });
    }
  }

  async function handleRemoveUser(id) {
    try {
      await apiFetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      setUsersList((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error(error);
      setInfo({
        title: "Erro",
        message: error.message || "Erro ao remover usuário.",
      });
    }
  }

  const totalLoginsDia = dashData?.total_logins_dia ?? 0;
  const usuariosAtivos30 = dashData?.usuarios_ativos_30_dias ?? 0;
  const acoesPorUsuario30d = dashData?.acoes_por_usuario_30d ?? 0;
  const jogos = dashData?.jogos ?? [];
  const acessibilidade = dashData?.acessibilidade ?? [];

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md text-black hover:bg-black/5 font-semibold w-fit"
            >
              ← Voltar
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-slate-800">
                Painel Administrativo
              </h1>

              <div className="mt-3 inline-flex bg-slate-100 rounded-full p-1">
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

            <div className="w-[90px]" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {activeTab === "quiz" && (
            <section className="space-y-6">
              <form
                onSubmit={handleCreateQuiz}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 grid md:grid-cols-4 gap-4 items-end"
              >
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título
                  </label>
                  <input
                    value={newQuiz.title}
                    onChange={(e) =>
                      setNewQuiz((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Ex: Quiz de Libras"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição
                  </label>
                  <input
                    value={newQuiz.description}
                    onChange={(e) =>
                      setNewQuiz((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Descrição breve"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tempo por pergunta
                  </label>
                  <input
                    type="number"
                    value={newQuiz.timePerQuestion}
                    onChange={(e) =>
                      setNewQuiz((prev) => ({
                        ...prev,
                        timePerQuestion: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium"
                >
                  <PlusCircle size={18} />
                  Novo Quiz
                </button>
              </form>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-slate-800">
                    Quizzes cadastrados
                  </h2>

                  <span className="text-sm text-slate-400">
                    Total: {quizzes.length}
                  </span>
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
                          <td
                            colSpan="5"
                            className="py-8 text-center text-slate-400 italic"
                          >
                            Nenhum quiz cadastrado.
                          </td>
                        </tr>
                      ) : (
                        quizzes.map((quiz) => (
                          <tr
                            key={quiz.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3 font-semibold">
                              {quiz.title}
                            </td>
                            <td className="py-2 px-3">
                              {quiz.description || "-"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {quiz.questions?.length || 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {quiz.timePerQuestion || 20}s
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleRemoveQuiz(quiz.id)}
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition"
                              >
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
            </section>
          )}

          {activeTab === "dashboard" && (
            <section className="space-y-6">
              {dashLoading && (
                <p className="text-slate-500 italic">Carregando dashboard...</p>
              )}

              {dashError && (
                <p className="text-rose-600 font-medium">{dashError}</p>
              )}

              <div className="grid md:grid-cols-4 gap-4">
                <StatCard
                  title="Logins hoje"
                  value={totalLoginsDia}
                  icon={<Activity size={20} />}
                  description="Eventos de login registrados no dia atual."
                />

                <StatCard
                  title="Usuários ativos 30d"
                  value={usuariosAtivos30}
                  icon={<Users size={20} />}
                  description="Usuários distintos nos últimos 30 dias."
                />

                <StatCard
                  title="Ações por usuário"
                  value={acoesPorUsuario30d}
                  icon={<ShieldCheck size={20} />}
                  description="Média de ações nos últimos 30 dias."
                />

                <StatCard
                  title="Quizzes locais"
                  value={quizzes.length}
                  icon={<Gamepad2 size={20} />}
                  description="Quizzes salvos no navegador."
                />
              </div>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-semibold text-lg text-slate-800 mb-4">
                  Desempenho por jogo
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-left">
                        <th className="py-2 px-3">Jogo</th>
                        <th className="py-2 px-3 text-center">Sessões</th>
                        <th className="py-2 px-3 text-center">
                          Usuários únicos
                        </th>
                        <th className="py-2 px-3 text-center">
                          Tempo médio
                        </th>
                        <th className="py-2 px-3 text-center">
                          Assertividade
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {jogos.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-8 text-center text-slate-400 italic"
                          >
                            Nenhum dado de jogo encontrado.
                          </td>
                        </tr>
                      ) : (
                        jogos.map((item) => (
                          <tr
                            key={item.game}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3 font-semibold">
                              {item.game}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.total_sessoes || 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.usuarios_unicos || 0}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {Number(item.tempo_medio_segundos || 0)}s
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-600">
                              {Number(item.assertividade_media || 0).toFixed(1)}
                              %
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-semibold text-lg text-slate-800 mb-4">
                  Recursos de acessibilidade
                </h2>

                {acessibilidade.length === 0 ? (
                  <p className="text-slate-400 italic">
                    Nenhum uso de recurso assistivo encontrado.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {acessibilidade.map((item) => (
                      <div
                        key={item.recurso}
                        className="rounded-2xl bg-slate-50 border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-700">
                            {item.recurso}
                          </p>
                          <Heart size={18} className="text-rose-500" />
                        </div>

                        <p className="text-3xl font-black text-slate-800 mt-2">
                          {item.total_usos}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          )}

          {activeTab === "users" && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg text-slate-800">
                  Gerenciamento de usuários
                </h2>

                <span className="text-sm text-slate-400">
                  Total: {usersList.length}
                </span>
              </div>

              {usersLoading && (
                <p className="text-sm text-slate-500 italic">
                  Carregando usuários...
                </p>
              )}

              {usersError && (
                <p className="text-sm text-rose-600">{usersError}</p>
              )}

              <form
                onSubmit={handleCreateUser}
                className="grid gap-3 md:grid-cols-4 items-end bg-slate-50 border border-slate-200 rounded-xl p-4"
              >
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Username
                  </label>

                  <input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                    placeholder="ex: joao.silva"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Nome
                  </label>

                  <input
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none"
                    placeholder="João da Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Papel
                  </label>

                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-black focus:ring-2 focus:ring-sky-400 outline-none bg-white"
                  >
                    <option value="student">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition font-medium"
                >
                  Adicionar usuário
                </button>
              </form>

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
                    {usersList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-8 text-center text-slate-400 italic"
                        >
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-2 px-3 font-mono">
                            {user.username || "-"}
                          </td>
                          <td className="py-2 px-3">{user.name || "-"}</td>
                          <td className="py-2 px-3">
                            {user.role === "Admin" ? "Admin" : "Usuário"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition"
                            >
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
          )}
        </main>
      </div>

      <Dialog
        open={!!info}
        title={info?.title || ""}
        onClose={() => setInfo(null)}
        actions={
          <button
            className="px-4 py-2 rounded-lg bg-sky-500 text-white"
            onClick={() => setInfo(null)}
          >
            OK
          </button>
        }
      >
        <p>{info?.message}</p>
      </Dialog>
    </>
  );
}