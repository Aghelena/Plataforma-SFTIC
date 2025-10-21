import { useEffect, useState } from "react";

export const CONTRAST_MODES = [
  { id: "default",     label: "Padrão" },
  { id: "hc-dark",     label: "Alto contraste — Escuro" },   // branco no preto
  { id: "hc-light",    label: "Alto contraste — Claro" },    // preto no branco
  { id: "black-yellow",label: "Preto / Amarelo" },
  { id: "cyan-black",  label: "Ciano / Preto" },
  { id: "magenta-black",label:"Magenta / Preto" },
];

export function useContrast() {
  const [mode, setMode] = useState(
    () => localStorage.getItem("contrastMode") || "default"
  );

  useEffect(() => {
    const root = document.documentElement;
    // remove qualquer classe anterior de contraste
    root.classList.forEach((c) => {
      if (c.startsWith("contrast-")) root.classList.remove(c);
    });
    root.classList.add(`contrast-${mode}`);
    localStorage.setItem("contrastMode", mode);
  }, [mode]);

  return { mode, setMode, modes: CONTRAST_MODES };
}
