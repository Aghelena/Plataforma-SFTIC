// src/pages/UserLogin.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogIn, Loader2 } from "lucide-react";
import { setPlayer } from "../lib/player";
import { apiFetch } from "../lib/api.js";

function UserLogin() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    window.history.length > 1 ? nav(-1) : nav("/");
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      setErr("Digite seu nome.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/api/users/login", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      setPlayer(data);

      const nextGame = localStorage.getItem("nextGameRoute") || "/";
      nav(nextGame);
    } catch (error) {
      console.error(error);
      setErr("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={goBack}
            className="px-3 py-1.5 rounded-md text-black hover:bg-black/5 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>

          <span className="w-[88px]" aria-hidden="true" />
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 via-white to-sky-50 p-4">
        <section className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Bem-vindo! Escreva seu nome
          </h1>

          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Seu nome
              </label>

              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  placeholder="Digite seu nome"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {err && (
              <p className="text-red-600 text-sm font-medium">{err}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 font-semibold transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

export default UserLogin;