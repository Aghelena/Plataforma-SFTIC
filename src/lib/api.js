// src/lib/api.js
import { auth } from "./firebase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function apiFetch(path, options = {}) {
  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Se houver um usuário Firebase logado (fluxo de admin/terapeuta),
  // anexa o ID Token para as rotas protegidas no back-end.
  // Rotas públicas (login do paciente, registro de sessão de jogo)
  // simplesmente ignoram esse header.
  const authHeaders = {};
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      authHeaders.Authorization = `Bearer ${idToken}`;
    } catch (err) {
      console.warn("Não foi possível obter o token de autenticação:", err.message);
    }
  }

  const response = await fetch(`${baseUrl}${cleanPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta não é JSON: ${text}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Erro HTTP ${response.status}`);
  }

  return data;
}