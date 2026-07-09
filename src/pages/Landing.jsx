// src/pages/Landing.jsx
import { useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { speak } from "../lib/speech";
import logo from "../assets/logosfitc.png";
import { getPlayer, clearPlayer } from "../lib/player";

const MS_PER_CHAR = 55;
const MIN_LOCK_MS = 1200;
const EXTRA_BUFFER_MS = 400;

function estimateSpeechDuration(text) {
  return Math.max(MIN_LOCK_MS, text.length * MS_PER_CHAR) + EXTRA_BUFFER_MS;
}

const FAVORITES_KEY = "favoriteGames";
const MAX_FAVORITES = 2;

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

if (typeof window !== "undefined") {
  clearPlayer();
}

function GamePill({ title, color, textColor, onClick, available, locked, isFavorite, onToggleFavorite, isNew }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        aria-disabled={locked ? true : undefined}
        aria-label={isFavorite ? `Remover ${title} dos favoritos` : `Marcar ${title} como favorito`}
        className="absolute z-10 top-1 left-1 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-disabled={locked ? true : undefined}
        className="block w-full rounded-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-transform hover:scale-[1.03]"
        style={{ backgroundColor: color, opacity: available ? 1 : 0.6 }}
        aria-label={
          available
            ? `Jogar ${title}${isNew ? ", novo" : ""}${isFavorite ? ", favorito" : ""}`
            : `${title} — em breve, ainda não disponível`
        }
      >
        <div className="relative rounded-[36px] overflow-hidden shadow-xl ring-1 ring-white/10 w-full h-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,.25),transparent_60%)]" />
          <div
            className="absolute left-5 bottom-2 text-xl font-extrabold drop-shadow"
            style={{ color: textColor }}
          >
            {title}
          </div>
          {!available && (
            <div className="absolute top-2 right-3 text-white text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full">
              Em breve
            </div>
          )}
          {available && isNew && (
            <div className="absolute top-2 right-3 text-white text-xs font-bold bg-emerald-700 px-2 py-0.5 rounded-full">
              Novo
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function LandingTopbar() {
  return (
    <header className="sticky top-0 z-40 bg-sky-500 bg-opacity-90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center text-white gap-3 group">
          <img
            src={logo}
            alt="Logo da Plataforma Inclusiva"
            className="h-12 w-auto"
            draggable="false"
          />
          <span className="text-black text-lg font-bold tracking-tight group-hover:opacity-90">
            Plataforma Inclusiva
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md text-black hover:text-white hover:bg-white/10 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Área administrativa"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [lock, setLock] = useState(false);
  const [favorites, setFavorites] = useState(() => readFavorites());
  const [filtro, setFiltro] = useState("Todos");
  const liveRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  function announceAndLock(msg, onDone) {
    announce(msg);
    setLock(true);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setLock(false);
      lockTimeoutRef.current = null;
      if (onDone) onDone();
    }, estimateSpeechDuration(msg));
  }

  const ALL_GAMES = useMemo(
    () => [
      { title: "Quiz", color: "#ef4444", textColor: "#FFFFFF", route: "/quiz", categoria: "Linguagem" },
      { title: "Jogo da Memória", color: "#f59e0b", textColor: "#1E293B", route: "/memory", categoria: "Memória" },
      { title: "Forca", color: "#fc03f4", textColor: "#FFFFFF", route: "/forca", categoria: "Linguagem" },
      { title: "Encontre o Intruso", color: "#10b981", textColor: "#1E293B", route: "/intruso", categoria: "Atenção", novo: true },
      { title: "Quebra-Cabeça", color: "#732836", textColor: "#FFFFFF", route: "/quebracabeca", categoria: "Raciocínio", novo: true },
      { title: "Candy Crush", color: "#1f0ac2", textColor: "#FFFFFF", route: "/candy", categoria: "Atenção" },
      { title: "Ache a Ordem", color: "#28521c", textColor: "#FFFFFF", route: null, categoria: "Memória" },
      { title: "Mémoria Numérica*", color: "#c2ebb7", textColor: "#1E293B", route: null, categoria: "Memória" },
      { title: "Corrida Maluca", color: "#076ab8", textColor: "#FFFFFF", route: null, categoria: "Atenção" },
    ],
    [],
  );

  const categorias = useMemo(() => {
    const unicas = [...new Set(ALL_GAMES.map((g) => g.categoria))];
    return ["Todos", ...unicas];
  }, [ALL_GAMES]);

  const games = useMemo(() => {
    const filtrados = filtro === "Todos"
      ? ALL_GAMES
      : ALL_GAMES.filter((g) => g.categoria === filtro);

    const favoritosNaLista = filtrados.filter((g) => favorites.includes(g.title));
    const restoNaLista = filtrados.filter((g) => !favorites.includes(g.title));
    return [...favoritosNaLista, ...restoNaLista];
  }, [ALL_GAMES, filtro, favorites]);

  function toggleFavorite(title) {
    if (lock) return;
    setFavorites((prev) => {
      if (prev.includes(title)) {
        const next = prev.filter((t) => t !== title);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        announceAndLock(`${title} removido dos favoritos.`);
        return next;
      }
      if (prev.length >= MAX_FAVORITES) {
        announceAndLock(`Você já tem ${MAX_FAVORITES} jogos favoritos. Remova um para adicionar outro.`);
        return prev;
      }
      const next = [...prev, title];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      announceAndLock(`${title} adicionado aos favoritos.`);
      return next;
    });
  }

  function handleFilterClick(cat) {
    if (lock) return;
    setFiltro(cat);
    announce(cat === "Todos" ? "Mostrando todos os jogos." : `Mostrando jogos de ${cat}.`);
  }

  function lerListaDeJogos() {
    if (lock) return;
    const disponiveis = games.filter((g) => g.route).map((g) => g.title);
    const emBreve = games.filter((g) => !g.route).map((g) => g.title);

    let msg = disponiveis.length > 0
      ? `Jogos disponíveis: ${disponiveis.join(", ")}.`
      : "Nenhum jogo disponível nesse filtro no momento.";

    if (emBreve.length > 0) {
      msg += ` Jogos que ainda serão adicionados: ${emBreve.join(", ")}.`;
    }

    announceAndLock(msg);
  }

  function getSpeechForGame(game) {
    if (!game.route) {
      return `O jogo ${game.title} ainda será adicionado futuramente.`;
    }
    return `Abrindo ${game.title}.`;
  }

  const handleGameClick = (game) => {
    if (lock) return;
    const msg = getSpeechForGame(game);

    announceAndLock(msg, () => {
      if (!game.route) return;

      const player = getPlayer();
      if (player?.id || player?.name) {
        navigate(game.route);
        return;
      }

      localStorage.setItem("nextGameRoute", game.route);
      navigate("/userLogin");
    });
  };

  const handleUserLoginClick = () => {
    if (lock) return;
    localStorage.removeItem("nextGameRoute");
    navigate("/userLogin");
  };

  const handleSwitchUser = () => {
    if (lock) return;
    announceAndLock("Usuário removido. Clique em começar para registrar um novo nome.", () => {
      clearPlayer();
      localStorage.removeItem("nextGameRoute");
      navigate("/");
    });
  };

  const player = getPlayer();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />

      <LandingTopbar />

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-black">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Estimulação Cognitiva
            </h1>
            <p className="mt-2 text-black">
              Desafios acessíveis para todos. Escolha um jogo e comece!
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              {!player?.id && !player?.name ? (
                <>
                  <p className="text-black">
                    Clique no botão abaixo para registrar o seu nome e comece a
                    jogar!
                  </p>
                  <button
                    type="button"
                    onClick={handleUserLoginClick}
                    aria-disabled={lock ? true : undefined}
                    className="px-8 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 aria-disabled:opacity-70 aria-disabled:cursor-not-allowed"
                    aria-label="Registrar nome"
                  >
                    Começar a Jogar!
                  </button>
                </>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="text-base text-slate-700">
                    Olá, <strong>{player.name}</strong>!
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchUser}
                    aria-disabled={lock ? true : undefined}
                    className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 aria-disabled:opacity-70 aria-disabled:cursor-not-allowed"
                    aria-label="Sair do usuário atual"
                  >
                    Sair / Trocar Usuário
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={lerListaDeJogos}
              aria-disabled={lock ? true : undefined}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
              aria-label="Ouvir a lista de jogos disponíveis"
            >
              🔊 O que tem aqui?
            </button>

            <div
              className="flex flex-wrap justify-center gap-2"
              role="group"
              aria-label="Filtrar jogos por tipo de estímulo"
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleFilterClick(cat)}
                  aria-pressed={filtro === cat}
                  aria-disabled={lock ? true : undefined}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed ${
                    filtro === cat
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="group"
            aria-label="Jogos disponíveis"
          >
            {games.map((g) => (
              <GamePill
                key={g.title}
                title={g.title}
                color={g.color}
                textColor={g.textColor}
                available={!!g.route}
                locked={lock}
                isNew={!!g.novo}
                isFavorite={favorites.includes(g.title)}
                onToggleFavorite={() => toggleFavorite(g.title)}
                onClick={() => handleGameClick(g)}
              />
            ))}

            {games.length === 0 && (
              <p className="col-span-full text-center text-slate-400">
                Nenhum jogo encontrado para esse filtro.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-black/60 text-sm">
        © {new Date().getFullYear()} Desenvolvido por Agnyh Helena Souza
      </footer>
    </div>
  );
}