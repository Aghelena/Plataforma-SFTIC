// src/pages/Landing.jsx
import { useMemo, useRef, useState, useEffect } from "react";
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

if (typeof window !== "undefined") {
  clearPlayer();
}

function GamePill({ title, color, textColor, onClick, available, locked, isNew, onFocusAnnounce }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onFocus={onFocusAnnounce}
      aria-disabled={locked ? true : undefined}
      className="block w-full rounded-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-transform hover:scale-[1.03]"
      style={{ backgroundColor: color, opacity: available ? 1 : 0.6 }}
      aria-label={
        available
          ? `Jogar ${title}${isNew ? ", novo" : ""}`
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
  );
}

// Cabeçalho: tabIndex={-1} em tudo que for interativo aqui, para o
// teclado nunca sair do conteúdo principal da Landing e alcançar
// o logo ou o link de Admin.
function LandingTopbar() {
  return (
    <header className="sticky top-0 z-40 bg-sky-500 bg-opacity-90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" tabIndex={-1} className="flex items-center text-white gap-3 group">
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
            tabIndex={-1}
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
  const liveRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  function announce(msg) {
    speak(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      setTimeout(() => { liveRef.current.textContent = msg; }, 20);
    }
  }

  // Anuncia, bloqueia novas ações pelo tempo estimado de fala e só
  // então executa "onDone" — evita que a navegação para outra tela
  // corte a frase no meio.
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

  const COMANDOS_JOGOS =
    "Use Tab para navegar entre os jogos, e Enter para jogar o que estiver selecionado.";

  const ALL_GAMES = useMemo(
    () => [
      { title: "Quiz", color: "#ef4444", textColor: "#FFFFFF", route: "/quiz" },
      { title: "Jogo da Memória", color: "#f59e0b", textColor: "#1E293B", route: "/memory" },
      { title: "Forca", color: "#fc03f4", textColor: "#FFFFFF", route: "/forca" },
      { title: "Encontre o Intruso", color: "#10b981", textColor: "#1E293B", route: "/intruso", novo: true },
      { title: "Quebra-Cabeça", color: "#732836", textColor: "#FFFFFF", route: "/quebracabeca", novo: true },
      { title: "Candy Crush", color: "#1f0ac2", textColor: "#FFFFFF", route: "/candy" },
      { title: "Ache a Ordem", color: "#28521c", textColor: "#FFFFFF", route: null },
      { title: "Mémoria Numérica*", color: "#c2ebb7", textColor: "#1E293B", route: null },
      { title: "Corrida Maluca", color: "#076ab8", textColor: "#FFFFFF", route: null },
    ],
    [],
  );

  // Anúncio de boas-vindas ao carregar a tela, explicando o único
  // comando de teclado que existe aqui.
  useEffect(() => {
    const t = setTimeout(() => {
      announce(`Bem-vindo à Plataforma Inclusiva. ${COMANDOS_JOGOS}`);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  function lerListaDeJogos() {
    if (lock) return;
    const disponiveis = ALL_GAMES.filter((g) => g.route).map((g) => g.title);
    const emBreve = ALL_GAMES.filter((g) => !g.route).map((g) => g.title);

    let msg = disponiveis.length > 0
      ? `Jogos disponíveis: ${disponiveis.join(", ")}.`
      : "Nenhum jogo disponível no momento.";

    if (emBreve.length > 0) {
      msg += ` Jogos que ainda serão adicionados: ${emBreve.join(", ")}.`;
    }

    msg += ` ${COMANDOS_JOGOS}`;

    announceAndLock(msg);
  }

  function getSpeechForGame(game) {
    if (!game.route) {
      return `O jogo ${game.title} ainda será adicionado futuramente.`;
    }
    return `Abrindo ${game.title}.`;
  }

  // TEMPORÁRIO: login não é mais obrigatório para jogar. O clique
  // no jogo navega direto, sem checar/exigir um usuário cadastrado.
  // Pra reverter, basta colocar de volta a checagem de getPlayer()
  // e o redirecionamento para "/userLogin" quando não houver player.
  const handleGameClick = (game) => {
    if (lock) return;
    const msg = getSpeechForGame(game);

    announceAndLock(msg, () => {
      if (!game.route) return;
      navigate(game.route);
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
                    Se quiser, registre seu nome para acompanhar seu progresso — mas não é obrigatório para jogar.
                  </p>
                  {/* <button
                    type="button"
                    onClick={handleUserLoginClick}
                    onFocus={() => announce("Botão: Registrar nome. Opcional, não é necessário para jogar. Pressione Enter para registrar.")}
                    aria-disabled={lock ? true : undefined}
                    className="px-8 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 aria-disabled:opacity-70 aria-disabled:cursor-not-allowed"
                    aria-label="Registrar nome (opcional)"
                  >
                    Registrar meu nome
                  </button> */}
                </>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
                  <div className="text-base text-slate-700">
                    Olá, <strong>{player.name}</strong>!
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchUser}
                    onFocus={() => announce("Botão: Sair ou trocar usuário. Pressione Enter para remover o usuário atual.")}
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

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={lerListaDeJogos}
              onFocus={() => announce("Botão: O que tem aqui. Pressione Enter para ouvir a lista de jogos.")}
              aria-disabled={lock ? true : undefined}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
              aria-label="Ouvir a lista de jogos disponíveis"
            >
              🔊 O que tem aqui?
            </button>
          </div>

          <div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="group"
            aria-label="Jogos disponíveis"
          >
            {ALL_GAMES.map((g) => (
              <GamePill
                key={g.title}
                title={g.title}
                color={g.color}
                textColor={g.textColor}
                available={!!g.route}
                locked={lock}
                isNew={!!g.novo}
                onClick={() => handleGameClick(g)}
                onFocusAnnounce={() =>
                  announce(
                    g.route
                      ? `Jogo: ${g.title}${g.novo ? ", novo" : ""}. Pressione Enter para jogar.`
                      : `${g.title}, em breve, ainda não disponível.`
                  )
                }
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