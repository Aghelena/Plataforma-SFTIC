// src/components/accessibility/TextReader.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Volume2, Pause, Play, Square } from "lucide-react";

export default function TextReader() {
  const location = useLocation();

  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");

  const chunksRef = useRef([]);
  const indexRef = useRef(0);
  const stoppedRef = useRef(false);
  const selectedVoiceRef = useRef(null);

  useEffect(() => {
    const hasSupport =
      "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

    setSupported(hasSupport);

    if (!hasSupport) return;

    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();

      setVoices(availableVoices);

      const ptVoice =
        availableVoices.find((voice) => voice.lang === "pt-BR") ||
        availableVoices.find((voice) => voice.lang.startsWith("pt")) ||
        availableVoices[0];

      if (ptVoice) {
        selectedVoiceRef.current = ptVoice;

        setSelectedVoiceURI((current) => {
          return current || ptVoice.voiceURI;
        });
      }
    }

    loadVoices();

    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const voice = voices.find((item) => item.voiceURI === selectedVoiceURI);
    selectedVoiceRef.current = voice || null;
  }, [selectedVoiceURI, voices]);

  useEffect(() => {
    stopSpeech();
  }, [location.pathname]);

  function getReadableText() {
    const selectedText = window.getSelection()?.toString()?.trim();

    if (selectedText) {
      return selectedText;
    }

    const content =
      document.querySelector("#conteudo") ||
      document.querySelector("main") ||
      document.body;

    if (!content) {
      return "";
    }

    const clone = content.cloneNode(true);

    clone
      .querySelectorAll(
        "script, style, svg, nav, header, footer, select, [data-reader-ignore]"
      )
      .forEach((element) => element.remove());

    const text = clone.innerText || clone.textContent || "";

    return text.replace(/\s+/g, " ").trim();
  }

  function splitText(text) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 220) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        currentChunk = sentence;
      } else {
        currentChunk += " " + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  function speakNextChunk() {
    if (stoppedRef.current) return;

    if (indexRef.current >= chunksRef.current.length) {
      setSpeaking(false);
      setPaused(false);
      return;
    }

    const text = chunksRef.current[indexRef.current];

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };

    utterance.onend = () => {
      if (stoppedRef.current) return;

      indexRef.current += 1;
      speakNextChunk();
    };

    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") {
        return;
      }

      console.error("Erro na leitura por voz:", event.error, event);

      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  function startSpeech() {
    if (!supported) {
      alert("Seu navegador não suporta leitura por voz.");
      return;
    }

    const text = getReadableText();

    console.log("Texto encontrado para leitura:", text);

    if (!text) {
      alert("Nenhum texto encontrado para leitura.");
      return;
    }

    stoppedRef.current = true;
    window.speechSynthesis.cancel();

    setTimeout(() => {
      stoppedRef.current = false;
      chunksRef.current = splitText(text);
      indexRef.current = 0;

      setSpeaking(true);
      setPaused(false);

      speakNextChunk();
    }, 150);
  }

  function pauseSpeech() {
    window.speechSynthesis.pause();
    setPaused(true);
  }

  function resumeSpeech() {
    window.speechSynthesis.resume();
    setPaused(false);
  }

  function stopSpeech() {
    if (!("speechSynthesis" in window)) return;

    stoppedRef.current = true;
    chunksRef.current = [];
    indexRef.current = 0;

    window.speechSynthesis.cancel();

    setSpeaking(false);
    setPaused(false);
  }

  if (!supported) return null;

  return (
    <div
      className="fixed right-16 top-1/2 z-[999999] flex -translate-y-1/2 flex-col items-end gap-2"
      data-reader-ignore
    >
      {voices.length > 1 && !speaking && (
        <select
          value={selectedVoiceURI}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
          className="max-w-[190px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Selecionar voz de leitura"
        >
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} - {voice.lang}
            </option>
          ))}
        </select>
      )}

      {!speaking && (
        <button
          type="button"
          onClick={startSpeech}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-600 text-white shadow-lg transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          aria-label="Ler conteúdo da página em voz alta"
          title="Ler página"
        >
          <Volume2 size={22} aria-hidden="true" />
        </button>
      )}

      {speaking && !paused && (
        <button
          type="button"
          onClick={pauseSpeech}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
          aria-label="Pausar leitura"
          title="Pausar leitura"
        >
          <Pause size={22} aria-hidden="true" />
        </button>
      )}

      {speaking && paused && (
        <button
          type="button"
          onClick={resumeSpeech}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          aria-label="Continuar leitura"
          title="Continuar leitura"
        >
          <Play size={22} aria-hidden="true" />
        </button>
      )}

      {speaking && (
        <button
          type="button"
          onClick={stopSpeech}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-600 text-white shadow-lg transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
          aria-label="Parar leitura"
          title="Parar leitura"
        >
          <Square size={22} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}