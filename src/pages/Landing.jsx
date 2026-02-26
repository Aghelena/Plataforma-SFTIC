// src/pages/Landing.jsx
import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { speak } from "../lib/speech";
import logo from "../assets/logosfitc.png";
import { getPlayer, clearPlayer } from "../lib/player";

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
      { title: "Quiz", color: "#ef4444", route: "/quiz" },
      { title: "Jogo da Memória", color: "#f59e0b", route: "/memory" },
      { title: "Forca", color: "#fc03f4", route: "/forca" },
      { title: "Candy Crush", color: "#1f0ac2", route: "/candy" },
      { title: "Bloco de madeira", color: "#3c3a4a", route: "/wood" },
      { title: "Palavras-Cruzadas", color: "#732836", route: "/wordcross" },
      { title: "-", color: "#28521c", route: null },
      { title: "-", color: "#c2ebb7", route: null },
      { title: "-", color: "#076ab8", route: null },
    ],
    [],
  );

  // fala certa pra cada jogo
  function getSpeechForGame(title) {
    switch (title) {
      case "Quiz":
        return "Abrindo o quiz.";
      case "Jogo da Memória":
        return "Abrindo jogo da memória.";
      case "Forca":
        return "Abrindo o jogo da forca.";
      case "Candy Crush":
        return "Abrindo Candy Crush.";
      case "Bloco de madeira":
        return "Abrindo o jogo dos blocos.";
      case "Palavras-Cruzadas":
        return "Abrindo o jogo das palavras cruzadas.";
      default:
        return `O jogo ${title} ainda será adicionado futuramente.`;
    }
  }

  const handleGameClick = (game) => {
    if (!game.route) {
      speak(getSpeechForGame(game.title));
      return;
    }

    speak(getSpeechForGame(game.title));

    const player = getPlayer();

    // Se já tem player, entra direto no jogo
    if (player?.id) {
      navigate(game.route);
      return;
    }

    //  Se não tem, guarda rota e manda pro login
    localStorage.setItem("nextGameRoute", game.route);
    navigate("/userLogin");
  };

  const handleUserLoginClick = () => {
    localStorage.removeItem("nextGameRoute"); // opcional: login direto sem escolher jogo
    navigate("/userLogin");
  };

  const handleSwitchUser = () => {
    clearPlayer();
    localStorage.removeItem("nextGameRoute");
    navigate("/userLogin");
  };

  const player = getPlayer();

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
            <p className="mt-2 text-black">
              Clique no botão abaixo para registar o seu nome e comece a jogar!
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              {!player?.id ? (
                <button
                  onClick={handleUserLoginClick}
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm focus:ring-2 focus:ring-sky-300"
                  aria-label="Registrar nome"
                >
                  Registrar nome
                </button>
              ) : (
                <>
                  <div className="text-sm text-slate-700">
                    Usuário atual: <strong>{player.name}</strong>
                  </div>
                  <button
                    onClick={handleSwitchUser}
                    className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm focus:ring-2 focus:ring-rose-300"
                    aria-label="Trocar usuário"
                  >
                    Trocar usuário
                  </button>
                </>
              )}
            </div>
          </div>

          {/* grade de jogos */}
          <div className="mt-5 grid gap-5  sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <GamePill
                key={g.title}
                title={g.title}
                color={g.color}
                onClick={() => handleGameClick(g)}
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
