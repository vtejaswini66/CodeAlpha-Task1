# 🌐 LinguaFlow — AI Language Translation Tool

> **CodeAlpha Artificial Intelligence Internship — Task Project**

A production-ready, full-stack AI language translator built with **Python / Flask** and **deep-translator**, featuring a modern glassmorphism UI, 100+ languages, Text-to-Speech, and more.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌍 100+ languages | Powered by Google Translate via `deep-translator` |
| 🔄 Swap languages | One click to flip source ↔ target and move text |
| 📋 Copy translation | Clipboard API with graceful fallback |
| 🔊 Text-to-Speech | Browser-native `SpeechSynthesis` in target language |
| ⏳ Loading animation | Three-dot bounce spinner during API call |
| ⚠️ Error handling | Client-side validation + server-side error responses |
| 📱 Responsive | Desktop, tablet, and mobile layouts |
| ⌨️ Keyboard shortcut | `Ctrl / Cmd + Enter` triggers translation |
| ♿ Accessible | ARIA labels, `aria-live` regions, focus rings |

---

## 🗂️ Project Structure

```
CodeAlpha_Language_Translator/
│
├── app.py               # Flask application & /translate endpoint
├── requirements.txt     # Python dependencies
├── README.md            # This file
├── .gitignore
│
├── templates/
│   └── index.html       # Jinja2 template – full single-page UI
│
├── static/
│   ├── style.css        # All styles (tokens, layout, components)
│   └── script.js        # All client-side logic
│
└── screenshots/         # Add UI screenshots here
```

---

## 🚀 Quick Start

### 1 — Clone the repo

```bash
git clone https://github.com/<your-username>/CodeAlpha_Language_Translator.git
cd CodeAlpha_Language_Translator
```

### 2 — Create a virtual environment

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Run the development server

```bash
python app.py
```

Open your browser at **http://localhost:5000**

---

## 🔌 API Reference

### `POST /translate`

**Request body (JSON)**

```json
{
  "text":        "Hello, world!",
  "source_lang": "auto",
  "target_lang": "es"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `text` | string | — | Text to translate (max 5 000 chars) |
| `source_lang` | string | `"auto"` | BCP-47 language code or `"auto"` |
| `target_lang` | string | `"en"` | BCP-47 language code |

**Success response (200)**

```json
{ "translated_text": "¡Hola, mundo!" }
```

**Error response (4xx / 5xx)**

```json
{ "error": "Human-readable error message." }
```

### `GET /languages`

Returns the full language map as JSON — useful for building your own client.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12+, Flask 3.x |
| Translation | deep-translator 1.x (Google Translate) |
| Frontend | HTML5, CSS3 (glassmorphism), Vanilla JS |
| Fonts | Space Grotesk, Inter (Google Fonts) |
| Icons | Bootstrap Icons |
| TTS | Web Speech API (`SpeechSynthesis`) |

---

## 📦 Dependencies

```
flask==3.1.1
deep-translator==1.11.4
```

Install with:

```bash
pip install -r requirements.txt
```

---

## 🎨 Design Highlights

- **Palette:** Deep navy-to-violet gradient background with drifting ambient blobs
- **Glassmorphism card:** Frosted-glass translator card via `backdrop-filter: blur`
- **Typography:** Space Grotesk (display) + Inter (body)
- **Signature element:** Three animated blob circles that slowly drift, giving depth without distraction
- **Accessibility:** Full keyboard navigation, ARIA live regions, reduced-motion support

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [deep-translator](https://github.com/nidhaloff/deep-translator) — the translation library
- [Google Fonts](https://fonts.google.com/) — Space Grotesk & Inter
- [Bootstrap Icons](https://icons.getbootstrap.com/) — icon set
- **CodeAlpha** — for this internship opportunity

---

*Made with ❤️ for the CodeAlpha AI Internship Program*
