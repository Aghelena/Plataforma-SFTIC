// src/lib/speech.js

export function isSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
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

// Cache de vozes — preenchido assim que o navegador as disponibilizar
let _voiceCache = [];

function _loadVoices() {
  if (!isSpeechSupported()) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) _voiceCache = voices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  _loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", _loadVoices);
}

export function getVoices() {
  if (!isSpeechSupported()) return [];
  if (_voiceCache.length === 0) _loadVoices();
  return _voiceCache;
}

function _pickPtBRVoice() {
  const voices = getVoices();
  return (
    voices.find((v) => v.name.includes("Luciana")) ||
    voices.find((v) => v.lang === "pt-BR") ||
    voices.find((v) => v.lang.startsWith("pt")) ||
    null
  );
}

export function speakText(text, options = {}) {
  if (!text) return;
  if (!isSpeechSupported()) {
    console.error("SpeechSynthesis não é suportado neste navegador.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang   = options.lang   || "pt-BR";
  utterance.rate   = options.rate   || 0.75;
  utterance.pitch  = options.pitch  || 1;
  utterance.volume = options.volume || 1;

  const voice = _pickPtBRVoice();
  if (voice) utterance.voice = voice;

  // Fallback: se as vozes ainda não carregaram, aguarda e tenta novamente
  if (!voice && _voiceCache.length === 0) {
    const retry = () => {
      _loadVoices();
      const v = _pickPtBRVoice();
      const u2 = new SpeechSynthesisUtterance(text);
      u2.lang   = utterance.lang;
      u2.rate   = utterance.rate;
      u2.pitch  = utterance.pitch;
      u2.volume = utterance.volume;
      if (v) u2.voice = v;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u2);
      window.speechSynthesis.removeEventListener("voiceschanged", retry);
    };
    window.speechSynthesis.addEventListener("voiceschanged", retry);
  }

  window.speechSynthesis.speak(utterance);
}

export function speak(text, options = {}) {
  return speakText(text, options);
}

export const stopSpeak = stopSpeech;

export function readCorrectAnswer() {
  return speak("Resposta correta!");
}

export function readWrongAnswer() {
  return speak("Resposta incorreta. Tente novamente.");
}

export function readText(text) {
  return speak(text);
}