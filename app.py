# ============================================================
# CodeAlpha AI Language Translation Tool
# Author: CodeAlpha Internship Project
# Description: Flask backend using Deep Translator (Google)
# ============================================================

from flask import Flask, render_template, request, jsonify
from deep_translator import GoogleTranslator
from deep_translator.exceptions import (
    LanguageNotSupportedException,
    TranslationNotFound,
    RequestError,
)
import logging

# ── App Setup ────────────────────────────────────────────────
app = Flask(__name__)

# Configure logging so errors are easy to trace
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Supported Languages ──────────────────────────────────────
# Full language map exposed to the frontend dropdown menus.
# Keys are BCP-47 codes accepted by Google Translate; values
# are human-readable names shown in the UI.
LANGUAGES = {
    "auto":  "Auto Detect",
    "af":    "Afrikaans",
    "sq":    "Albanian",
    "am":    "Amharic",
    "ar":    "Arabic",
    "hy":    "Armenian",
    "az":    "Azerbaijani",
    "eu":    "Basque",
    "be":    "Belarusian",
    "bn":    "Bengali",
    "bs":    "Bosnian",
    "bg":    "Bulgarian",
    "ca":    "Catalan",
    "ceb":   "Cebuano",
    "ny":    "Chichewa",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "co":    "Corsican",
    "hr":    "Croatian",
    "cs":    "Czech",
    "da":    "Danish",
    "nl":    "Dutch",
    "en":    "English",
    "eo":    "Esperanto",
    "et":    "Estonian",
    "tl":    "Filipino",
    "fi":    "Finnish",
    "fr":    "French",
    "fy":    "Frisian",
    "gl":    "Galician",
    "ka":    "Georgian",
    "de":    "German",
    "el":    "Greek",
    "gu":    "Gujarati",
    "ht":    "Haitian Creole",
    "ha":    "Hausa",
    "haw":   "Hawaiian",
    "iw":    "Hebrew",
    "hi":    "Hindi",
    "hmn":   "Hmong",
    "hu":    "Hungarian",
    "is":    "Icelandic",
    "ig":    "Igbo",
    "id":    "Indonesian",
    "ga":    "Irish",
    "it":    "Italian",
    "ja":    "Japanese",
    "jw":    "Javanese",
    "kn":    "Kannada",
    "kk":    "Kazakh",
    "km":    "Khmer",
    "ko":    "Korean",
    "ku":    "Kurdish (Kurmanji)",
    "ky":    "Kyrgyz",
    "lo":    "Lao",
    "la":    "Latin",
    "lv":    "Latvian",
    "lt":    "Lithuanian",
    "lb":    "Luxembourgish",
    "mk":    "Macedonian",
    "mg":    "Malagasy",
    "ms":    "Malay",
    "ml":    "Malayalam",
    "mt":    "Maltese",
    "mi":    "Maori",
    "mr":    "Marathi",
    "mn":    "Mongolian",
    "my":    "Myanmar (Burmese)",
    "ne":    "Nepali",
    "no":    "Norwegian",
    "ps":    "Pashto",
    "fa":    "Persian",
    "pl":    "Polish",
    "pt":    "Portuguese",
    "pa":    "Punjabi",
    "ro":    "Romanian",
    "ru":    "Russian",
    "sm":    "Samoan",
    "gd":    "Scots Gaelic",
    "sr":    "Serbian",
    "st":    "Sesotho",
    "sn":    "Shona",
    "sd":    "Sindhi",
    "si":    "Sinhala",
    "sk":    "Slovak",
    "sl":    "Slovenian",
    "so":    "Somali",
    "es":    "Spanish",
    "su":    "Sundanese",
    "sw":    "Swahili",
    "sv":    "Swedish",
    "tg":    "Tajik",
    "ta":    "Tamil",
    "te":    "Telugu",
    "th":    "Thai",
    "tr":    "Turkish",
    "uk":    "Ukrainian",
    "ur":    "Urdu",
    "uz":    "Uzbek",
    "vi":    "Vietnamese",
    "cy":    "Welsh",
    "xh":    "Xhosa",
    "yi":    "Yiddish",
    "yo":    "Yoruba",
    "zu":    "Zulu",
}


# ── Routes ───────────────────────────────────────────────────

@app.route("/")
def index():
    """Render the main translation page, passing the language map."""
    return render_template("index.html", languages=LANGUAGES)


@app.route("/translate", methods=["POST"])
def translate():
    """
    POST /translate
    Body (JSON):
        text        – text to translate (required)
        source_lang – BCP-47 source code, or 'auto'  (default: 'auto')
        target_lang – BCP-47 target code              (default: 'en')

    Returns JSON:
        { translated_text: str }   on success
        { error: str }             on failure
    """
    try:
        data = request.get_json(force=True)

        text        = (data.get("text") or "").strip()
        source_lang = data.get("source_lang", "auto")
        target_lang = data.get("target_lang", "en")

        # ── Validation ───────────────────────────────────────
        if not text:
            return jsonify({"error": "Please enter some text to translate."}), 400

        if len(text) > 5000:
            return jsonify({"error": "Input exceeds the 5 000-character limit."}), 400

        if target_lang not in LANGUAGES:
            return jsonify({"error": f"Unsupported target language: {target_lang}"}), 400

        # ── Translation ──────────────────────────────────────
        logger.info("Translating %d chars: %s → %s", len(text), source_lang, target_lang)

        translated = GoogleTranslator(
            source=source_lang,
            target=target_lang,
        ).translate(text)

        if not translated:
            return jsonify({"error": "No translation returned. Please try again."}), 500

        return jsonify({"translated_text": translated})

    except LanguageNotSupportedException:
        return jsonify({"error": "One of the selected languages is not supported."}), 400

    except TranslationNotFound:
        return jsonify({"error": "Translation not found. Try different text."}), 500

    except RequestError as exc:
        logger.error("Google Translate request error: %s", exc)
        return jsonify({"error": "Could not reach the translation service. Check your internet connection."}), 503

    except Exception as exc:                          # noqa: BLE001
        logger.exception("Unexpected translation error: %s", exc)
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500


@app.route("/languages", methods=["GET"])
def get_languages():
    """Return the full language map as JSON (useful for future API consumers)."""
    return jsonify(LANGUAGES)


# ── Entry Point ──────────────────────────────────────────────
if __name__ == "__main__":
    # debug=True → hot-reload during development; set False in production
    app.run(debug=True, host="0.0.0.0", port=5000)
