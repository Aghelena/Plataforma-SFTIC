// src/lib/speech.js

export function isSpeechSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function getVoices() {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function getReadableText() {
  const selectedText = window.getSelection()?.toString()?.trim();

  if (selectedText) {
    return selectedText;
  }

  const content =
    document.querySelector("#conteudo") ||
    document.querySelector("main") ||
    document.body;

  const clone = content.cloneNode(true);

  clone
    .querySelectorAll(
      "script, style, svg, nav, header, footer, [data-reader-ignore]"
    )
    .forEach((element) => element.remove());

  return clone.innerText.replace(/\s+/g, " ").trim();
}

export function splitTextIntoChunks(text) {
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

export function stopSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function pauseSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.resume();
}

export function speakText(text, options = {}) {
  if (!isSpeechSupported()) {
    throw new Error("Seu navegador não suporta leitura por voz.");
  }

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = options.lang || "pt-BR";
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  if (options.voice) {
    utterance.voice = options.voice;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  if (options.onError) {
    utterance.onerror = options.onError;
  }

  window.speechSynthesis.speak(utterance);

  return utterance;
}