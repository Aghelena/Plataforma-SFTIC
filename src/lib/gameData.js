// src/lib/gameData.js
//
// Camada de dados do dashboard/analytics, agora 100% em cima do
// Firestore — substitui o antigo backend Express + PostgreSQL
// (server/ + src/lib/api.js).
//
// Coleções usadas no Firestore:
//   - "players": os "jogadores" pré-cadastrados pela terapeuta
//     (nome, email opcional). Não tem nenhuma relação com a coleção
//     "users" usada pelo Firebase Auth para o login do admin.
//   - "gameSessions": um documento por partida finalizada, com o
//     jogo, a pontuação (0-100, ver normalização em cada tela de
//     jogo), a duração e o jogador (quando houver).
//
// Regras de segurança relevantes (ver firestore.rules na raiz do
// projeto): qualquer visitante autenticado (inclusive anônimo) pode
// criar sessões e procurar um player pelo nome; só quem está
// logado como admin (role "admin" na coleção "users") consegue
// listar todos os players ou ler as sessões agregadas do dashboard.

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const PLAYERS_COL = "players";
const SESSIONS_COL = "gameSessions";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function playerFromDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: data.name || "",
    email: data.email || null,
    created_at: toDate(data.createdAt)?.toISOString() || null,
  };
}

/* ─────────────────────────── players ─────────────────────────── */

// Usado pela tela pública de "entrar com meu nome" (UserLogin.jsx).
// Mantém a mesma regra de negócio do backend antigo: não cria
// ninguém, só encontra quem a terapeuta já cadastrou.
export async function loginPlayerByName(name) {
  const clean = (name || "").trim();
  if (!clean) {
    throw new Error("Nome é obrigatório.");
  }

  const q = query(
    collection(db, PLAYERS_COL),
    where("name", "==", clean),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error(
      "Usuário não encontrado. Solicite o cadastro à sua terapeuta."
    );
  }

  return playerFromDoc(snap.docs[0]);
}

// Só o admin consegue chamar isso de verdade (ver firestore.rules) —
// usado pela aba "Usuários" do painel.
export async function listPlayers() {
  const q = query(collection(db, PLAYERS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(playerFromDoc);
}

export async function createPlayer({ name, email }) {
  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim() || null;

  if (!cleanName) {
    throw new Error("Name é obrigatório.");
  }

  // Mesma checagem de duplicidade que o Postgres fazia via UNIQUE.
  const dupSnap = await getDocs(
    query(collection(db, PLAYERS_COL), where("name", "==", cleanName), limit(1))
  );
  if (!dupSnap.empty) {
    throw new Error("Nome ou email já existe.");
  }

  const ref = await addDoc(collection(db, PLAYERS_COL), {
    name: cleanName,
    email: cleanEmail,
    createdAt: serverTimestamp(),
  });

  const created = await getDoc(ref);
  return playerFromDoc(created);
}

export async function deletePlayer(id) {
  await deleteDoc(doc(db, PLAYERS_COL, id));
}

/* ────────────────────────── game sessions ─────────────────────── */

// Chamado ao final de cada jogo. Nunca deixa uma falha de rede/regra
// quebrar a experiência de quem está jogando — só loga o erro.
export async function recordGameSession({
  playerId,
  playerName,
  game,
  score,
  total,
  durationSeconds,
}) {
  try {
    await addDoc(collection(db, SESSIONS_COL), {
      playerId: playerId || null,
      playerName: playerName || null,
      game,
      score: Number.isFinite(Number(score)) ? Number(score) : 0,
      total: Number.isFinite(Number(total)) ? Number(total) : 0,
      durationSeconds: Math.max(0, Math.round(Number(durationSeconds) || 0)),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Erro ao registrar sessão no Firestore:", err);
  }
}

function sessionFromDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    playerId: data.playerId || null,
    playerName: data.playerName || null,
    game: data.game || "—",
    score: Number(data.score) || 0,
    total: Number(data.total) || 0,
    durationSeconds: Number(data.durationSeconds) || 0,
    createdAt: toDate(data.createdAt),
  };
}

// Busca todas as sessões (só o admin tem permissão) ordenadas por
// data. O filtro de período é aplicado no cliente para não depender
// de índice composto no Firestore.
async function fetchAllSessions() {
  const q = query(collection(db, SESSIONS_COL), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(sessionFromDoc);
}

function filtrarPorPeriodo(sessions, dias) {
  if (!dias || dias <= 0) return sessions;
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => !s.createdAt || s.createdAt.getTime() >= limite);
}

function aggregatePorJogo(sessions) {
  const porJogo = new Map();

  for (const s of sessions) {
    if (!porJogo.has(s.game)) {
      porJogo.set(s.game, {
        game: s.game,
        total_sessoes: 0,
        somaScore: 0,
        somaDuracao: 0,
        usuarios: new Set(),
      });
    }
    const g = porJogo.get(s.game);
    g.total_sessoes += 1;
    g.somaScore += s.score;
    g.somaDuracao += s.durationSeconds;
    if (s.playerId) g.usuarios.add(s.playerId);
  }

  return Array.from(porJogo.values())
    .map((g) => ({
      game: g.game,
      total_sessoes: g.total_sessoes,
      usuarios_unicos: g.usuarios.size,
      tempo_medio_segundos: g.total_sessoes
        ? Math.round(g.somaDuracao / g.total_sessoes)
        : 0,
      assertividade_media: g.total_sessoes ? g.somaScore / g.total_sessoes : 0,
    }))
    .sort((a, b) => b.assertividade_media - a.assertividade_media);
}

// Equivalente ao antigo GET /api/dashboard/admin-summary.
export async function getAdminSummary(diasPeriodo) {
  const todas = await fetchAllSessions();
  const sessions = filtrarPorPeriodo(todas, diasPeriodo);

  const janela30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const usuariosAtivos30 = new Set(
    sessions
      .filter((s) => s.playerId && s.createdAt && s.createdAt.getTime() >= janela30)
      .map((s) => s.playerId)
  );

  return {
    usuarios_ativos_30_dias: usuariosAtivos30.size,
    jogos: aggregatePorJogo(sessions),
    // Ainda não há instrumentação de uso de recursos assistivos
    // (contraste, VLibras, narração) — fica pronto pra receber dados
    // no futuro, mas hoje sempre volta vazio.
    acessibilidade: [],
  };
}

// Equivalente ao antigo GET /api/dashboard/users/:id/summary.
export async function getUserSummary(playerId) {
  const playerSnap = await getDoc(doc(db, PLAYERS_COL, playerId));
  if (!playerSnap.exists()) {
    throw new Error("Usuário não encontrado.");
  }

  const snap = await getDocs(
    query(collection(db, SESSIONS_COL), where("playerId", "==", playerId))
  );
  const sessions = snap.docs
    .map(sessionFromDoc)
    .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

  const total_sessoes = sessions.length;
  const tempo_medio_segundos = total_sessoes
    ? Math.round(sessions.reduce((s, x) => s + x.durationSeconds, 0) / total_sessoes)
    : 0;
  const assertividade_media = total_sessoes
    ? sessions.reduce((s, x) => s + x.score, 0) / total_sessoes
    : 0;

  return {
    usuario: playerFromDoc(playerSnap),
    resumo: { total_sessoes, tempo_medio_segundos, assertividade_media },
    jogos: aggregatePorJogo(sessions),
    historico: sessions.map((s) => ({
      data: s.createdAt?.toISOString() || null,
      assertividade: s.score,
    })),
  };
}