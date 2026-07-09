// src/pages/Admin.jsx

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, Trash2, X, Activity, Pencil, Save, Copy,
  Users, Gamepad2, Clock, Target, LayoutDashboard, TrendingUp,
  Download, Search,
} from "lucide-react";
import { store } from "../lib/store.js";
import { apiFetch } from "../lib/api.js";

// ─── utilidades ──────────────────────────────────────────────
function initials(name) {
  const safe = (name || "").trim();
  if (!safe) return "?";
  return safe.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAECE7", text: "#993C1D" },
  { bg: "#FBEAF0", text: "#993556" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#EAF3DE", text: "#3B6D11" },
];

function avatarColor(name) {
  const safe = (name || "?").trim() || "?";
  const code = safe.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
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

// Catálogo dos jogos que existem na plataforma. O dashboard sempre
// mostra todos eles, mesmo que ainda não tenham nenhuma sessão
// registrada na API — evita o efeito de jogo "sumido" da lista.
const KNOWN_GAMES = [
  "Quiz",
  "Jogo da Memória",
  "Forca",
  "Encontre o Intruso",
  "Quebra-Cabeça",
];

function mergeWithKnownGames(jogosDaApi) {
  const porNome = new Map((jogosDaApi || []).map((j) => [j.game, j]));
  return KNOWN_GAMES.map((nome) => porNome.get(nome) || {
    game: nome,
    total_sessoes: 0,
    assertividade_media: 0,
    tempo_medio_segundos: 0,
  });
}

// Monta e baixa um CSV a partir de linhas [{ ... }]
function baixarCSV(nomeArquivo, linhas) {
  if (!linhas || linhas.length === 0) return;
  const colunas = Object.keys(linhas[0]);
  const escapar = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cabecalho = colunas.map(escapar).join(";");
  const corpo = linhas.map((l) => colunas.map((c) => escapar(l[c])).join(";")).join("\n");
  const csv = "\uFEFF" + cabecalho + "\n" + corpo; // BOM ajuda o Excel a ler acentos certinho

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── quizzes padrão ─────────────────────────────────────────
const DEFAULT_QUIZZES = [
  {
    id: "quiz-curiosidades-animais",
    title: "Curiosidades sobre Animais",
    description: "Um quiz divertido pra testar o que você sabe sobre bichos.",
    timePerQuestion: 20,
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
    timePerQuestion: 20,
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
    timePerQuestion: 25,
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

function mergeWithDefaultQuizzes(saved) {
  const list = Array.isArray(saved) ? saved : [];
  const savedIds = new Set(list.map((q) => q.id));
  return [
    ...DEFAULT_QUIZZES.filter((d) => !savedIds.has(d.id)),
    ...list,
  ];
}

// ─── quiz: helpers de dados ────────────────────────────────────
function emptyOption() {
  return { text: "", image: null, imageAlt: "" };
}

function emptyQuestion() {
  return {
    q: "",
    image: null,
    imageAlt: "",
    correct: 0,
    opts: [emptyOption(), emptyOption()],
  };
}

// ─── componentes menores ──────────────────────────────────────
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1 transition" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirmLabel = "Remover" }) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}

function MetricCard({ label, value, sub, icon, tint = "sky" }) {
  const tints = {
    sky: { bg: "bg-sky-50", text: "text-sky-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  };
  const t = tints[tint] || tints.sky;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl ${t.bg} ${t.text} flex items-center justify-center`}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── gráfico de barras inline (sem dependência externa) ───────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const palette = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#06B6D4"];

  return (
    <div className="space-y-3 mt-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex justify-between text-sm text-slate-600 mb-1.5">
            <span className="font-medium">{d.label}</span>
            <span className="text-slate-400">{d.display ?? d.value}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
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

// Mini gráfico de evolução (sparkline em barras) para o histórico
// de sessões de um usuário. Espera userDetail.historico como
// [{ data, assertividade }], mais recente por último.
function EvolutionChart({ historico }) {
  if (!historico || historico.length < 2) {
    return (
      <p className="text-sm text-slate-400 italic">
        Ainda não há sessões suficientes para montar um gráfico de evolução (precisa de pelo menos 2).
      </p>
    );
  }

  const max = 100;
  return (
    <div>
      <div className="flex items-end gap-1.5 h-24">
        {historico.map((h, i) => {
          const pct = Math.max(4, Math.round((Number(h.assertividade) / max) * 100));
          const isLast = i === historico.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className={`w-full rounded-t-md transition-all ${isLast ? "bg-sky-500" : "bg-sky-200"}`}
                style={{ height: `${pct}%` }}
              />
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition text-xs bg-slate-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                {Math.round(h.assertividade)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-slate-400">
        <span>Sessão mais antiga</span>
        <span>Sessão mais recente</span>
      </div>
    </div>
  );
}

// ─── aba dashboard ────────────────────────────────────────────
const PERIODOS = [
  { id: 7,   label: "7 dias" },
  { id: 30,  label: "30 dias" },
  { id: 90,  label: "90 dias" },
  { id: 0,   label: "Tudo" },
];

function TabDashboard({ quizzes }) {
  const [data, setData]       = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [periodo, setPeriodo] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const query = periodo > 0 ? `?dias=${periodo}` : "";
        const [summary, userList] = await Promise.all([
          apiFetch(`/api/dashboard/admin-summary${query}`),
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
  }, [periodo]);

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

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-slate-400 mt-3">Carregando dashboard...</p>
      </div>
    );
  }
  if (error) return <p className="text-rose-600 font-medium py-8 text-center">{error}</p>;

  // Sempre mostra os 5 jogos conhecidos da plataforma, mesmo os que
  // ainda não têm nenhuma sessão registrada na API.
  const jogos = mergeWithKnownGames(data?.jogos);
  const acess = data?.acessibilidade ?? [];

  const totalSessoes = jogos.reduce((s, j) => s + (j.total_sessoes || 0), 0);
  const jogosComDados = jogos.filter((j) => j.total_sessoes > 0);
  const assertMedia  = jogosComDados.length
    ? Math.round(jogosComDados.reduce((s, j) => s + Number(j.assertividade_media || 0), 0) / jogosComDados.length)
    : 0;
  const tempoMedio   = jogosComDados.length
    ? Math.round(jogosComDados.reduce((s, j) => s + Number(j.tempo_medio_segundos || 0), 0) / jogosComDados.length)
    : 0;

  const jogosBarData = jogos.map((j) => ({
    label: j.game,
    value: j.total_sessoes || 0,
  }));

  const assertBarData = jogos.map((j) => ({
    label: j.game,
    value: Math.round(Number(j.assertividade_media || 0)),
    display: j.total_sessoes > 0 ? `${Math.round(Number(j.assertividade_media || 0))}%` : "sem dados",
  }));

  const acessBarData = acess.map((a) => ({
    label: a.recurso.replace("toggle_", "").replace("_", " "),
    value: a.total_usos || 0,
  }));

  const semDados = jogos.filter((j) => j.total_sessoes === 0).map((j) => j.game);

  function exportarDashboardCSV() {
    const linhasJogos = jogos.map((j) => ({
      jogo: j.game,
      sessoes: j.total_sessoes || 0,
      assertividade_media_pct: Math.round(Number(j.assertividade_media || 0)),
      tempo_medio_segundos: Math.round(Number(j.tempo_medio_segundos || 0)),
    }));
    baixarCSV(`dashboard_jogos_${periodo || "tudo"}dias.csv`, linhasJogos);
  }

  return (
    <div className="space-y-6">

      {/* Filtro de período + exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 rounded-full p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
                periodo === p.id ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={exportarDashboardCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {semDados.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <strong>Sem sessões registradas ainda:</strong> {semDados.join(", ")}.
          {" "}Esses jogos aparecem com 0 até alguém completar uma partida.
        </div>
      )}

      {/* métricas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Sessões totais" value={totalSessoes} sub="jogos registrados" icon={<Gamepad2 size={20} />} tint="sky" />
        <MetricCard label="Assertividade média" value={`${assertMedia}%`} sub="acertos nos jogos" icon={<Target size={20} />} tint="emerald" />
        <MetricCard label="Tempo médio" value={fmtSeconds(tempoMedio)} sub="por sessão" icon={<Clock size={20} />} tint="violet" />
        <MetricCard label="Usuários ativos" value={data?.usuarios_ativos_30_dias ?? 0} sub={periodo > 0 ? `últimos ${periodo} dias` : "todo o período"} icon={<Users size={20} />} tint="amber" />
        <MetricCard label="Quizzes cadastrados" value={quizzes?.length ?? 0} sub="disponíveis para jogar" icon={<TrendingUp size={20} />} tint="sky" />
      </div>

      {/* jogos + assertividade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Sessões por jogo</p>
          <BarChart data={jogosBarData} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Assertividade por jogo</p>
          <BarChart data={assertBarData} />
        </div>
      </div>

      {/* evolução individual */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">Evolução individual</p>
          {users.length > 0 && (
            <button
              onClick={() => baixarCSV("usuarios.csv", users.map((u) => ({
                nome: u.name || "",
                email: u.email || "",
                cadastro: u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "",
              })))}
              className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              <Download size={13} /> Exportar usuários
            </button>
          )}
        </div>

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
                    className="w-full text-left py-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 transition"
                    onClick={() => setSelectedUser(isOpen ? null : u)}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: color.bg, color: color.text }}>
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 text-sm">{u.name || "Sem nome"}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {isOpen ? "▲ fechar" : "▼ detalhes"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        cadastrado em {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pb-4 px-2">
                      {detailLoading ? (
                        <p className="text-sm text-slate-400 italic">Carregando...</p>
                      ) : userDetail ? (
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <MetricCard label="Sessões" value={userDetail.resumo.total_sessoes} icon={<Gamepad2 size={18} />} tint="sky" />
                            <MetricCard label="Tempo médio" value={fmtSeconds(userDetail.resumo.tempo_medio_segundos)} icon={<Clock size={18} />} tint="violet" />
                            <MetricCard
                              label="Assertividade"
                              value={`${Math.round(Number(userDetail.resumo.assertividade_media))}%`}
                              icon={<Target size={18} />}
                              tint="emerald"
                            />
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Evolução (assertividade por sessão)</p>
                            <EvolutionChart historico={userDetail.historico} />
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
                                      <span className="text-xs font-medium text-slate-700 w-24 truncate">{j.game}</span>
                                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tag.color }} />
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Uso de recursos assistivos</p>
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
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [newUser, setNewUser]       = useState({ name: "", email: "" });
  const [busca, setBusca]           = useState("");

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

  const usersFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usersList;
    return usersList.filter((u) =>
      (u.name || "").toLowerCase().includes(termo) ||
      (u.email || "").toLowerCase().includes(termo)
    );
  }, [usersList, busca]);

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

  async function confirmAndRemove() {
    if (!confirmRemove) return;
    const { id } = confirmRemove;
    setConfirmRemove(null);
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setInfo({ title: "Erro", message: e.message || "Erro ao remover usuário." });
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-slate-800 text-lg">Gerenciamento de usuários</h2>
          <span className="text-sm text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
            {usersFiltrados.length} de {usersList.length}
          </span>
        </div>

        {loading && <p className="text-sm text-slate-400 italic">Carregando...</p>}
        {error   && <p className="text-sm text-rose-600">{error}</p>}

        {/* formulário de cadastro */}
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3 items-end bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1 font-medium">Nome <span className="text-rose-500">*</span></label>
            <input
              value={newUser.name}
              onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition"
              placeholder="Ex: Fabrício"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1 font-medium">E-mail <span className="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition"
              placeholder="fabricio@email.com"
            />
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition font-medium shadow-sm">
            <PlusCircle size={18} />
            Adicionar
          </button>
        </form>

        {/* busca */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          />
        </div>

        {/* tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="py-2 px-3 w-8"></th>
                <th className="py-2 px-3 text-slate-400 font-medium">Nome</th>
                <th className="py-2 px-3 text-slate-400 font-medium">E-mail</th>
                <th className="py-2 px-3 text-slate-400 font-medium">Cadastro</th>
                <th className="py-2 px-3 text-center w-20 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usersFiltrados.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                    {busca ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado."}
                  </td>
                </tr>
              ) : (
                usersFiltrados.map((u) => {
                  const color = avatarColor(u.name);
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ background: color.bg, color: color.text }}>
                          {initials(u.name)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{u.name || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.email || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setConfirmRemove({ id: u.id, name: u.name || "este usuário" })}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
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
        actions={<button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition" onClick={() => setInfo(null)}>OK</button>}>
        <p>{info?.message}</p>
      </Dialog>

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover usuário"
        message={`Tem certeza que deseja remover "${confirmRemove?.name}"? Essa ação não pode ser desfeita.`}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={confirmAndRemove}
      />
    </>
  );
}

// ─── aba quiz: editor de perguntas ─────────────────────────────
function QuizEditor({ quiz, onSave, onCancel }) {
  const [draft, setDraft] = useState(quiz);
  const [validationError, setValidationError] = useState("");

  function updateField(field, value) {
    setDraft((p) => ({ ...p, [field]: value }));
  }

  function addQuestion() {
    setDraft((p) => ({ ...p, questions: [...p.questions, emptyQuestion()] }));
  }

  function removeQuestion(qIndex) {
    setDraft((p) => ({
      ...p,
      questions: p.questions.filter((_, i) => i !== qIndex),
    }));
  }

  function updateQuestion(qIndex, field, value) {
    setDraft((p) => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qIndex ? { ...q, [field]: value } : q
      ),
    }));
  }

  function addOption(qIndex) {
    setDraft((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIndex) return q;
        if (q.opts.length >= 4) return q;
        return { ...q, opts: [...q.opts, emptyOption()] };
      }),
    }));
  }

  function removeOption(qIndex, optIndex) {
    setDraft((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIndex) return q;
        if (q.opts.length <= 2) return q;
        const opts = q.opts.filter((_, j) => j !== optIndex);
        let correct = q.correct;
        if (optIndex === q.correct) correct = 0;
        else if (optIndex < q.correct) correct = q.correct - 1;
        return { ...q, opts, correct };
      }),
    }));
  }

  function updateOption(qIndex, optIndex, field, value) {
    setDraft((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          opts: q.opts.map((o, j) =>
            j === optIndex ? { ...o, [field]: value } : o
          ),
        };
      }),
    }));
  }

  function setCorrect(qIndex, optIndex) {
    updateQuestion(qIndex, "correct", optIndex);
  }

  function handleSave() {
    if (!draft.title.trim()) {
      setValidationError("Informe o título do quiz.");
      return;
    }
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i];
      if (!q.q.trim()) {
        setValidationError(`Preencha o texto da pergunta ${i + 1}.`);
        return;
      }
      if (q.opts.some((o) => !o.text.trim())) {
        setValidationError(`Preencha todas as alternativas da pergunta ${i + 1}.`);
        return;
      }
    }
    setValidationError("");
    onSave(draft);
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-lg text-slate-800">
          {quiz.__isNew ? "Novo quiz" : `Editando: ${quiz.title}`}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 font-medium transition shadow-sm"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>

      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          {validationError}
        </div>
      )}

      {/* dados do quiz */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
          <input
            value={draft.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input
            value={draft.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tempo por pergunta (s)</label>
          <input
            type="number"
            value={draft.timePerQuestion}
            onChange={(e) => updateField("timePerQuestion", Number(e.target.value) || 20)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
          />
        </div>
      </div>

      {/* perguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">Perguntas ({draft.questions.length})</h3>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-medium transition"
          >
            <PlusCircle size={16} /> Adicionar pergunta
          </button>
        </div>

        {draft.questions.length === 0 && (
          <p className="text-sm text-slate-400 italic">Nenhuma pergunta ainda. Clique em "Adicionar pergunta".</p>
        )}

        {draft.questions.map((q, qIndex) => (
          <div key={qIndex} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Pergunta {qIndex + 1}</span>
              <button
                onClick={() => removeQuestion(qIndex)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Texto da pergunta</label>
              <input
                value={q.q}
                onChange={(e) => updateQuestion(qIndex, "q", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Digite a pergunta"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Imagem da pergunta (URL, opcional)</label>
                <input
                  value={q.image || ""}
                  onChange={(e) => updateQuestion(qIndex, "image", e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descrição da imagem</label>
                <input
                  value={q.imageAlt || ""}
                  onChange={(e) => updateQuestion(qIndex, "imageAlt", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="O que a imagem mostra"
                />
              </div>
            </div>

            {/* alternativas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-600">
                  Alternativas (marque a correta)
                </label>
                {q.opts.length < 4 && (
                  <button
                    onClick={() => addOption(qIndex)}
                    className="text-xs px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium transition"
                  >
                    + alternativa
                  </button>
                )}
              </div>

              {q.opts.map((op, optIndex) => (
                <div key={optIndex} className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl p-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correct === optIndex}
                    onChange={() => setCorrect(qIndex, optIndex)}
                    className="mt-2 accent-sky-500"
                  />
                  <div className="flex-1 grid md:grid-cols-3 gap-2">
                    <input
                      value={op.text}
                      onChange={(e) => updateOption(qIndex, optIndex, "text", e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 md:col-span-1"
                      placeholder={`Alternativa ${"ABCD"[optIndex]}`}
                    />
                    <input
                      value={op.image || ""}
                      onChange={(e) => updateOption(qIndex, optIndex, "image", e.target.value || null)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Imagem (URL, opcional)"
                    />
                    <input
                      value={op.imageAlt || ""}
                      onChange={(e) => updateOption(qIndex, optIndex, "imageAlt", e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Descrição da imagem"
                    />
                  </div>
                  {q.opts.length > 2 && (
                    <button
                      onClick={() => removeOption(qIndex, optIndex)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition mt-1"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── aba quiz ─────────────────────────────────────────────────
function TabQuiz({ quizzes, setQuizzes }) {
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", timePerQuestion: 20 });
  const [editorQuiz, setEditorQuiz] = useState(null);
  const [info, setInfo] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

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
      __isNew: true,
    };
    setNewQuiz({ title: "", description: "", timePerQuestion: 20 });
    setEditorQuiz(quiz);
  }

  function openEditor(quiz) {
    setEditorQuiz({ ...quiz, __isNew: false });
  }

  function handleSaveEditor(draft) {
    const { __isNew, ...clean } = draft;
    setQuizzes((prev) => {
      const exists = prev.some((q) => q.id === clean.id);
      return exists
        ? prev.map((q) => (q.id === clean.id ? clean : q))
        : [clean, ...prev];
    });
    setEditorQuiz(null);
    setInfo({ title: "Quiz salvo", message: "As alterações foram salvas com sucesso." });
  }

  function handleCancelEditor() {
    setEditorQuiz(null);
  }

  function handleDuplicate(quiz) {
    const copia = {
      ...quiz,
      id: Date.now().toString(36),
      title: `${quiz.title} (cópia)`,
      questions: quiz.questions.map((q) => ({
        ...q,
        opts: q.opts.map((o) => ({ ...o })),
      })),
    };
    setQuizzes((prev) => [copia, ...prev]);
    setInfo({ title: "Quiz duplicado", message: `"${copia.title}" foi criado a partir de "${quiz.title}".` });
  }

  function confirmAndRemove() {
    if (!confirmRemove) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== confirmRemove.id));
    setConfirmRemove(null);
  }

  if (editorQuiz) {
    return (
      <>
        <QuizEditor quiz={editorQuiz} onSave={handleSaveEditor} onCancel={handleCancelEditor} />
        <Dialog open={!!info} title={info?.title || ""} onClose={() => setInfo(null)}
          actions={<button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition" onClick={() => setInfo(null)}>OK</button>}>
          <p>{info?.message}</p>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input value={newQuiz.title}
              onChange={(e) => setNewQuiz((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder="Ex: Quiz de Libras" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input value={newQuiz.description}
              onChange={(e) => setNewQuiz((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder="Descrição breve" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo por pergunta (s)</label>
            <input type="number" value={newQuiz.timePerQuestion}
              onChange={(e) => setNewQuiz((p) => ({ ...p, timePerQuestion: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-black outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition" />
          </div>
          <button type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition font-medium shadow-sm">
            <PlusCircle size={18} /> Novo Quiz
          </button>
        </form>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-slate-800">Quizzes cadastrados</h2>
            <span className="text-sm text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Total: {quizzes.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="py-2 px-3 text-slate-400 font-medium">Título</th>
                  <th className="py-2 px-3 text-slate-400 font-medium">Descrição</th>
                  <th className="py-2 px-3 text-center text-slate-400 font-medium">Perguntas</th>
                  <th className="py-2 px-3 text-center text-slate-400 font-medium">Tempo</th>
                  <th className="py-2 px-3 text-center text-slate-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">Nenhum quiz cadastrado.</td>
                  </tr>
                ) : (
                  quizzes.map((quiz) => {
                    const isRascunho = !quiz.questions || quiz.questions.length === 0;
                    return (
                      <tr key={quiz.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-semibold">
                          <div className="flex items-center gap-2">
                            {quiz.title}
                            {isRascunho && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                Rascunho
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">{quiz.description || "—"}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            quiz.questions?.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {quiz.questions?.length || 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">{quiz.timePerQuestion || 20}s</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditor(quiz)}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition"
                              title="Editar">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDuplicate(quiz)}
                              className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 transition"
                              title="Duplicar">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => setConfirmRemove({ id: quiz.id, title: quiz.title })}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              title="Remover">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={!!info} title={info?.title || ""} onClose={() => setInfo(null)}
        actions={<button className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition" onClick={() => setInfo(null)}>OK</button>}>
        <p>{info?.message}</p>
      </Dialog>

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover quiz"
        message={`Tem certeza que deseja remover "${confirmRemove?.title}"? Essa ação não pode ser desfeita.`}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={confirmAndRemove}
      />
    </>
  );
}

// ─── página principal ─────────────────────────────────────────
export default function Admin() {
  const navigate   = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [quizzes, setQuizzes] = useState(() => {
    const data = store.get("quizzes", []);
    return mergeWithDefaultQuizzes(data);
  });

  useEffect(() => {
    store.set("quizzes", quizzes);
    window.dispatchEvent(new Event("quizzes-updated"));
  }, [quizzes]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "users",     label: "Usuários",  icon: <Users size={16} /> },
    { id: "quiz",      label: "Quiz",      icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Painel Administrativo</h1>
              <p className="text-xs text-slate-400">Plataforma Inclusiva</p>
            </div>
          </div>

          <nav className="hidden sm:flex bg-slate-100 rounded-full p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition ${
                  tab === t.id ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-sm transition">
            ← Voltar
          </button>
        </div>

        {/* tabs em telas pequenas */}
        <div className="sm:hidden flex justify-center pb-3">
          <nav className="flex bg-slate-100 rounded-full p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${
                  tab === t.id ? "bg-white text-sky-600 shadow-sm" : "text-slate-500"
                }`}>
                {t.icon}
              </button>
            ))}
          </nav>
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