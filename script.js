/* ============================================================
   LinguaFlow — script.js
   Handles: translation API calls, swap, copy, TTS, char count,
            loading state, error display, keyboard shortcuts.
   ============================================================ */

"use strict";

// ── DOM references ────────────────────────────────────────────
const sourceLang     = document.getElementById("source-lang");
const targetLang     = document.getElementById("target-lang");
const sourceText     = document.getElementById("source-text");
const translatedBox  = document.getElementById("translated-text");
const charCount      = document.getElementById("char-count");
const errorMsg       = document.getElementById("error-msg");
const spinner        = document.getElementById("spinner");
const translateBtn   = document.getElementById("translate-btn");
const clearBtn       = document.getElementById("clear-btn");
const swapBtn        = document.getElementById("swap-btn");
const copyBtn        = document.getElementById("copy-btn");
const ttsBtn         = document.getElementById("tts-btn");

// Maximum chars accepted by the backend
const MAX_CHARS = 5000;

// Track whether TTS is currently speaking
let isSpeaking = false;

// ── Character counter ─────────────────────────────────────────
sourceText.addEventListener("input", () => {
  const len = sourceText.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  // Warn visually when approaching limit
  charCount.classList.toggle("warn", len > MAX_CHARS * 0.9);
});

// ── Translate ─────────────────────────────────────────────────
/**
 * Main translation flow:
 *   1. Validate input
 *   2. Show loading state
 *   3. POST to Flask /translate
 *   4. Render result or error
 *   5. Reset UI state
 */
async function runTranslation() {
  const text = sourceText.value.trim();

  // Client-side validation — gives instant feedback before any network call
  if (!text) {
    showError("Please enter some text before translating.");
    return;
  }
  if (text.length > MAX_CHARS) {
    showError(`Input exceeds ${MAX_CHARS.toLocaleString()} characters.`);
    return;
  }

  clearError();
  clearOutput();
  setLoading(true);

  try {
    const response = await fetch("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text:        text,
        source_lang: sourceLang.value,
        target_lang: targetLang.value,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      // Server returned an error payload
      showError(data.error || "An error occurred. Please try again.");
    } else {
      // Successful translation
      renderOutput(data.translated_text);
    }
  } catch (networkErr) {
    // Fetch itself failed — likely offline
    showError("Network error: could not reach the translation service. Check your connection.");
    console.error("Translation fetch error:", networkErr);
  } finally {
    setLoading(false);
  }
}

// ── UI helpers ────────────────────────────────────────────────

/** Show the translated text and enable action buttons. */
function renderOutput(text) {
  translatedBox.textContent = text;        // safe: textContent escapes HTML
  copyBtn.disabled = false;
  ttsBtn.disabled  = !("speechSynthesis" in window); // disable if browser lacks TTS
}

/** Reset the output panel to placeholder state. */
function clearOutput() {
  translatedBox.innerHTML = '<span class="placeholder-msg">Your translation will appear here.</span>';
  copyBtn.disabled = true;
  ttsBtn.disabled  = true;
  stopSpeech();
}

/** Toggle loading spinner and disable the translate button. */
function setLoading(active) {
  spinner.hidden    = !active;
  translateBtn.disabled = active;
  if (active) translateBtn.setAttribute("aria-busy", "true");
  else        translateBtn.removeAttribute("aria-busy");
}

/** Display an error below the output panel. */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

/** Clear any visible error. */
function clearError() {
  errorMsg.textContent = "";
  errorMsg.hidden = true;
}

// ── Translate button click ────────────────────────────────────
translateBtn.addEventListener("click", runTranslation);

// Keyboard shortcut: Ctrl/Cmd + Enter inside the source textarea
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runTranslation();
  }
});

// ── Clear button ──────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  sourceText.value      = "";
  charCount.textContent = `0 / ${MAX_CHARS}`;
  charCount.classList.remove("warn");
  clearOutput();
  clearError();
  sourceText.focus();
});

// ── Swap languages ────────────────────────────────────────────
/**
 * Swaps source ↔ target language codes.
 * If source was "auto", sets it to the previous target instead,
 * and moves the translated text back into the input field.
 */
swapBtn.addEventListener("click", () => {
  const srcVal = sourceLang.value;
  const tgtVal = targetLang.value;

  // We cannot swap "auto" meaningfully as a target — fall back to English
  const newSrc = tgtVal;
  const newTgt = srcVal === "auto" ? "en" : srcVal;

  // Check if both codes are valid options in their respective <select>
  const srcHasOption = [...sourceLang.options].some(o => o.value === newSrc);
  const tgtHasOption = [...targetLang.options].some(o => o.value === newTgt);

  if (srcHasOption) sourceLang.value = newSrc;
  if (tgtHasOption) targetLang.value = newTgt;

  // If there's already a translation, move it to the input and clear output
  const currentOutput = translatedBox.textContent.trim();
  const isPlaceholder = translatedBox.querySelector(".placeholder-msg");
  if (!isPlaceholder && currentOutput) {
    sourceText.value = currentOutput;
    charCount.textContent = `${currentOutput.length} / ${MAX_CHARS}`;
    clearOutput();
    clearError();
  }
});

// ── Copy translation ──────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  const text = translatedBox.textContent.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast("Translation copied!");
    // Brief icon feedback
    copyBtn.innerHTML = '<i class="bi bi-clipboard-check"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
    }, 1800);
  } catch {
    // Fallback for browsers that block clipboard API
    legacyCopy(text);
  }
});

/** Fallback copy via execCommand (deprecated but widely supported). */
function legacyCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "absolute";
  el.style.opacity  = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  showToast("Translation copied!");
}

// ── Text-to-speech ────────────────────────────────────────────
/**
 * Uses the Web Speech API (SpeechSynthesis) to read out the
 * translated text in the target language.
 * Clicking while speaking stops playback.
 */
ttsBtn.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    showToast("Text-to-speech not supported in this browser.");
    return;
  }

  if (isSpeaking) {
    stopSpeech();
    return;
  }

  const text = translatedBox.textContent.trim();
  if (!text || translatedBox.querySelector(".placeholder-msg")) return;

  const utterance       = new SpeechSynthesisUtterance(text);
  utterance.lang        = targetLang.value;   // hint to the browser which voice to pick
  utterance.rate        = 0.95;               // slightly slower for clarity
  utterance.pitch       = 1;

  utterance.onstart = () => {
    isSpeaking = true;
    ttsBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop';
    ttsBtn.title     = "Stop speaking";
  };
  utterance.onend = utterance.onerror = () => {
    isSpeaking = false;
    ttsBtn.innerHTML = '<i class="bi bi-volume-up"></i> Listen';
    ttsBtn.title     = "Listen to translation";
  };

  window.speechSynthesis.speak(utterance);
});

/** Cancel any ongoing speech synthesis. */
function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    ttsBtn.innerHTML = '<i class="bi bi-volume-up"></i> Listen';
    ttsBtn.title     = "Listen to translation";
  }
}

// ── Toast notification ────────────────────────────────────────
let toastTimer = null;

/**
 * Creates (or reuses) a bottom-centre toast and shows it briefly.
 * @param {string} message
 * @param {number} [duration=2200] – ms before auto-hide
 */
function showToast(message, duration = 2200) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}
