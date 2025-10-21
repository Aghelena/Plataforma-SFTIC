// src/pages/Landing.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { store } from "../lib/store";

// --- Componente de diálogo genérico ---
function Dialog({ open, title, children, actions, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
      <div className="card w-full max-w-md p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button
            className="text-black hover:text-white"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 text-slate-200">{children}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}

function GamePill({ title, color, to }) {
  return (
    <Link
      to={to}
      className="block rounded-[36px] focus:outline-none focus:ring-2 focus:ring-white/40"
    >
      <div className="relative rounded-[36px] overflow-hidden shadow-xl ring-1 ring-white/10">
        {/* bloco sólido na cor escolhida */}
        <div className="h-28 w-full" style={{ backgroundColor: color }} />
        {/* brilho sutil */}
        <div
          className="pointer-events-none absolute inset-0
                      bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,.25),transparent_60%)]"
        />
        <div className="absolute left-5 bottom-2 text-white drop-shadow font-semibold">
          {title}
        </div>
      </div>
    </Link>
  );
}

function LandingTopbar({ onLogin, onSignup }) {
  return (
    <header className="sticky top-0 z-40 bg-[#3b0b6b] bg-opacity-90 backdrop-blur border-b border-white/10">  
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white text-lg font-bold">
            Plataforma Inclusiva
          </span>
          <nav className="hidden md:flex items-center gap-4 text-sm text-white/80">
            <Link
              to="/login"
              className="w-12 h-12 grid place-items-center font-bold text-white"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const games = useMemo(
    () => [
      { title: "Quiz", color: "#ef4444" }, // red-500
      { title: "Tic Tac Toe XXO", color: "#f59e0b" }, // amber-500
      { title: "Smiling Class", color: "#10b981" }, // emerald-500
      { title: "8 Ball Pro", color: "#3b82f6" }, // blue-500
      { title: "Color Link", color: "#8b5cf6" }, // violet-500
      { title: "Bloxorz", color: "#ec4899" }, // pink-500
      { title: "Mad Fish", color: "#14b8a6" }, // teal-500
      { title: "Chess", color: "#84cc16" }, // lime-500
      { title: "Forest Temple", color: "#f472b6" }, // pink-400
      { title: "Light Temple", color: "#22d3ee" }, // cyan-400
      { title: "4 Colors", color: "#a3e635" }, // lime-400
      { title: "Moto X3M", color: "#60a5fa" }, // blue-400
    ],
    []
  );

  // helpers simples de auth usando localStorage
  function getUsers() {
    return store.get("users", []);
  }
  function setUsers(arr) {
    store.set("users", arr);
  }
  function setCurrentUser(user) {
    store.set("currentUser", user);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff]">
      <LandingTopbar
        onLogin={() => setLoginOpen(true)}
        onSignup={() => setSignupOpen(true)}
      />

      {/* Hero + grade */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-black">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Aprenda brincando
            </h1>
            <p className="mt-2 text-black">
              Desafios acessíveis para todos. Escolha um jogo e comece!
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g, i) => (
              <GamePill key={i} {...g} />
            ))}
          </div>

          <div className="mt-8 flex justify-center"></div>
        </section>
      </main>

      <footer className="py-6 text-center text-black/60 text-sm">
        © {new Date().getFullYear()} Desenvolvido por Agnyh Helena Souza
      </footer>
    </div>
  );
}
