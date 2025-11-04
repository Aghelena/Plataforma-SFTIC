// src/pages/Landing.jsx
import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { store } from "../lib/store";
import { speak } from "../lib/speech";
import logo from "../assets/logosfitc.png";

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

// --- Cada bloco colorido ---
function GamePill({ title, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="block rounded-[36px] focus:outline-none focus:ring-2 focus:ring-white/40 transition-transform hover:scale-[1.03]"
      style={{ backgroundColor: color }}
      aria-label={`Abrir ${title}`}
    >
      <div className="relative rounded-[36px] overflow-hidden shadow-xl ring-1 ring-white/10 w-full h-28">
        <div
          className="pointer-events-none absolute inset-0
                      bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,.25),transparent_60%)]"
        />
        <div className="absolute left-5 bottom-2 text-white drop-shadow font-semibold">
          {title}
        </div>
      </div>
    </button>
  );
}

// --- Topbar ---
function LandingTopbar() {
  return (
    <header className="sticky top-0 z-40 bg-sky-500 bg-opacity-90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto bg-gradient-to-b from-sky-100px-4 h-14 flex items-center justify-between">
        {/* Esquerda: logo + título */}
        <Link to="/" className="flex items-center text-white gap-3 group">
          <img
            src={logo}
            alt="Logo da Plataforma Inclusiva"
            className="h-12 w-auto filter "
            draggable="false"
          />
          <span className="text-black text-lg font-bold tracking-tight group-hover:opacity-90">
            Plataforma Inclusiva
          </span>
        </Link>

        {/* Direita: navegação */}
        <nav className="flex items-center gap-1">
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold"
            aria-label="Área administrativa"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

// --- Página principal ---
export default function Landing() {
  const navigate = useNavigate();

  const games = useMemo(
    () => [
      { title: "-", color: "#ef4444" },
      { title: "Jogo da Memória", color: "#f59e0b" },
      { title: "Forca", color: "#fc03f4" },
      { title: "Candy Crush", color: "#1f0ac2" },
      { title: "-", color: "#3c3a4a" },
      { title: "-", color: "#732836" },
      { title: "-", color: "#28521c" },
      { title: "-", color: "#c2ebb7" },
      { title: "-", color: "#076ab8" },
    ],
    []
  );

  return (
    <div className="min-h-screen  flex flex-col bg-white">
      <LandingTopbar />

      {/* Hero + grade */}
      <main className="flex-1 ">
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-black">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Aprenda brincando
            </h1>
            <p className="mt-2 text-black">
              Desafios acessíveis para todos. Escolha um jogo e comece!
            </p>
          </div>

          {/* grade de jogos */}
          <div className="mt-5 grid gap-5  sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <GamePill
                key={g.id ?? g.title} // evite usar o índice
                title={g.title}
                color={g.color}
                onClick={() => {
                  if (g.title === "Quiz") {
                    speak("Abrindo o quiz.");
                    navigate("/user");
                  } else if (g.title === "Jogo da Memória") {
                    speak("Abrindo jogo da memória.");
                    navigate("/memory");
                  } else if (g.title === "Forca") {
                    speak("Abrindo o jogo da forca.");
                    navigate("/forca");
                  } else {
                    speak(
                      `O jogo ${g.title} ainda será adicionado futuramente.`
                    );
                  }
                  if (g.title === "Candy Crush") {
                    speak("Abrindo Candy Crush.");
                    navigate("/candy");
                  } else {
                  }
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-black/60 text-sm">
        © {new Date().getFullYear()} Desenvolvido por Agnyh Helena Souza
      </footer>
    </div>
  );
}
