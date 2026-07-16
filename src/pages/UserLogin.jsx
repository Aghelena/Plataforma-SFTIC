// src/pages/UserLogin.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogIn, Loader2 } from "lucide-react";
import { setPlayer } from "../lib/player";
import { apiFetch } from "../lib/api.js";
import { speak } from "../lib/speech.js";

function UserLogin() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const liveRef = useRef(null);
  const inputRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  // Anuncia as instruções assim que a tela carrega e leva o foco
  // direto pro campo de nome, já que essa é a única ação possível
  // aqui.
  useEffect(() => {
    const t = setTimeout(() => {
      announce(
        "Tela de entrada. Digite o nome cadastrado pela sua terapeuta e pressione Espaço, ou navegue com Tab até o botão Entrar."
      );
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  const goBack = () => {
    window.history.length > 1 ? nav(-1) : nav("/");
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim()) {
      const msg = "Digite seu nome.";
      setErr(msg);
      announce(msg);
      return;
    }

    setLoading(true);
    announce("Entrando, aguarde um momento.");

    try {
      const data = await apiFetch("/api/users/login", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });

      setPlayer(data);
      announce(`Bem-vindo, ${data?.name || name.trim()}.`);

      const nextGame = localStorage.getItem("nextGameRoute") || "/";
      nav(nextGame);
    } catch (error) {
      // O apiFetch lança o data.error do servidor como mensagem
      // então conseguimos distinguir 404 de outros erros
      const serverMessage = error.message || "";

      let friendlyMessage;

      if (serverMessage.includes("não encontrado")) {
        friendlyMessage =
          "Nome não encontrado. Peça para sua terapeuta realizar seu cadastro.";
      } else if (serverMessage.includes("obrigatório")) {
        friendlyMessage = "Digite seu nome antes de entrar.";
      } else {
        friendlyMessage = "Erro ao fazer login. Tente novamente.";
      }

      setErr(friendlyMessage);
      announce(friendlyMessage);
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={goBack}
            tabIndex={-1}
            className="px-3 py-1.5 rounded-md text-black hover:bg-black/5 font-semibold"
            aria-label="Voltar"
          >
            ← Voltar
          </button>
          <span className="w-[88px]" aria-hidden="true" />
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 via-white to-sky-50 p-4">
        <section
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          aria-labelledby="login-title"
        >
          <h1
            id="login-title"
            className="text-3xl font-bold text-center text-gray-800 mb-2"
          >
            Bem-vindo!
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Digite o nome cadastrado pela sua terapeuta.
          </p>

          <form onSubmit={handleUserLogin} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="user-name"
                className="block font-medium text-gray-700 mb-1"
              >
                Seu nome
              </label>

              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => announce("Campo: seu nome. Digite o nome cadastrado pela sua terapeuta.")}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  placeholder="Digite seu nome"
                  autoComplete="off"
                  aria-describedby={err ? "login-error" : undefined}
                  aria-invalid={!!err}
                />
              </div>
            </div>

            {err && (
              <p
                id="login-error"
                role="alert"
                className="text-red-600 text-sm font-medium"
              >
                {err}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              onFocus={() => announce("Botão: Entrar. Pressione Espaço para confirmar seu nome.")}
              className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg py-2 font-semibold transition focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" size={18} />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn aria-hidden="true" size={18} />
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