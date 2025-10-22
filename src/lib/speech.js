// src/lib/speech.js
let speaking = false;
let queue = [];

export function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  speaking = false;

  // divide textos longos pra não truncar
  queue = String(text).match(/.{1,180}(\s|$)/g) || [String(text)];
  playNext();
}

function playNext() {
  if (!queue.length) { speaking = false; return; }
  const chunk = queue.shift().trim();
  if (!chunk) return playNext();

  const u = new SpeechSynthesisUtterance(chunk);
  u.lang = "pt-BR"; u.rate = 1; u.pitch = 1;
  u.onend = () => playNext();
  speaking = true;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  queue = []; speaking = false;
}

/** Inicializa anúncios quando o foco muda via teclado (Tab/Shift+Tab/setas) */
export function initKeyboardAnnouncer() {
  if (typeof window === "undefined") return;

  let lastInputWasKeyboard = false;

  const isAdmin = () => window.location.pathname.startsWith("/admin");
  const isAllowedRoute = () => !isAdmin(); // bloqueia na /admin

  const onKeyDown = (e) => {
    // Tab/Shift+Tab/Arrows marcam que o próximo focus veio do teclado
    if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      lastInputWasKeyboard = true;
    }
  };
  const onMouseDown = () => { lastInputWasKeyboard = false; };

  const labelFrom = (el) => {
    if (!el) return "";
    const aria = el.getAttribute("aria-label");
    if (aria) return aria;
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const n = document.getElementById(labelledBy);
      if (n) return n.textContent?.trim() || "";
    }
    // usa texto visível como fallback
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    return text;
  };

  const onFocusIn = (e) => {
    if (!isAllowedRoute() || !lastInputWasKeyboard) return;

    const el = e.target;
    // deixe os elementos com data-speak="off" silenciosos
    if (el && el.getAttribute && el.getAttribute("data-speak") === "off") return;

    let text = labelFrom(el);
    // prefixos amigáveis
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "a") text = `Link: ${text}`;
    else if (tag === "button") text = `Botão: ${text}`;
    else if (tag === "input") {
      const type = el.getAttribute("type") || "texto";
      const p = labelFrom(document.querySelector(`label[for="${el.id}"]`));
      text = p ? `Campo ${p}` : `Campo ${type}`;
    }

    // se ainda ficou vazio, tenta o parent imediato
    if (!text) text = labelFrom(el.parentElement);

    if (text) speak(text);
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("mousedown", onMouseDown, true);
  window.addEventListener("focusin", onFocusIn, true);

  // retorno para descadastrar (se você quiser usar no unmount)
  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("mousedown", onMouseDown, true);
    window.removeEventListener("focusin", onFocusIn, true);
  };
}
