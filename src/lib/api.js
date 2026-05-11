// src/lib/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function apiFetch(path, options = {}) {
  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${baseUrl}${cleanPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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