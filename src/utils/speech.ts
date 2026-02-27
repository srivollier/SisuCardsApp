const FINNISH_LANG = "fi-FI";

/**
 * Returns true if the Web Speech API SpeechSynthesis is available (browser environment).
 */
export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "speechSynthesis" in window;
}

/**
 * Speaks the given text using Finnish TTS (fi-FI). No-op if speech is unsupported or text is empty.
 * Cancels any ongoing utterance before speaking. Prefers a Finnish voice when available.
 */
export function speakFi(text: string): void {
  const trimmed = text?.trim();
  if (!trimmed || !isSpeechSupported()) {
    return;
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = FINNISH_LANG;

  const voices = synthesis.getVoices();
  const finnishVoice = voices.find((v) => v.lang.startsWith("fi"));
  if (finnishVoice) {
    utterance.voice = finnishVoice;
  }

  synthesis.speak(utterance);
}
