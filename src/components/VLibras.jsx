// src/components/VLibras.jsx

import { useEffect } from "react";

export default function VLibras() {
  useEffect(() => {
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
          "https://vlibras.gov.br/app"
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

      script.onerror = () => {
        console.warn("Não foi possível carregar o VLibras.");
      };

      document.body.appendChild(script);
    } else {
      init();
    }

    return () => {
      const container = document.querySelector("[data-vlibras-container]");
      if (container) {
        container.remove();
      }

      window.__vlibrasWidget = null;
    };
  }, []);

  return null;
}