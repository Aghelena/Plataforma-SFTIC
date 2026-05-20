// src/components/VLibras.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function removeVLibras() {
  // remove todos os elementos que o VLibras injeta no body
  document.querySelectorAll("[vw]").forEach((el) => el.remove());
  document
    .querySelectorAll("[data-vlibras-container]")
    .forEach((el) => el.remove());
  document
    .querySelectorAll(".vw-plugin-top-wrapper")
    .forEach((el) => el.remove());
  // remove o select de voz (Luciana - pt-BR)
  document.querySelectorAll("select[id^='vw']").forEach((el) => el.remove());
  // remove qualquer elemento filho direto do body com classe vw
  document
    .querySelectorAll("body > [class*='vw']")
    .forEach((el) => el.remove());
  // remove o iframe que o plugin injeta
  document
    .querySelectorAll("iframe[src*='vlibras']")
    .forEach((el) => el.remove());
  window.__vlibrasWidget = null;
}

export default function VLibras() {
  const location = useLocation();
  const isAdmin = location.pathname.toLowerCase().startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      removeVLibras();
      return;
    }

    if (!document.querySelector("[data-vlibras-container]")) {
      const wrap = document.createElement("div");
      wrap.setAttribute("vw", "");
      wrap.className = "enabled";
      wrap.setAttribute("data-vlibras-container", "true");
      wrap.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(wrap);
    }

    const init = () => {
      if (window.VLibras && !window.__vlibrasWidget) {
        window.__vlibrasWidget = new window.VLibras.Widget(
          "https://vlibras.gov.br/app",
        );
      }
    };

    const already = document.querySelector("script[data-vlibras]");
    if (!already) {
      const script = document.createElement("script");
      script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      script.async = true;
      script.defer = true;
      script.setAttribute("data-vlibras", "true");
      script.onload = init;
      script.onerror = () =>
        console.warn("Não foi possível carregar o VLibras.");
      document.body.appendChild(script);
    } else {
      init();
    }

    return () => removeVLibras();
  }, [isAdmin]);

  return null;
}
