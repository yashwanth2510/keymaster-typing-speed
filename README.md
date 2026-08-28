<div align="center">

# ⌨️ KeyMaster — Typing Speed Test & Practice Studio

Test your typing speed, learn touch typing with interactive tutorials and a visual
keyboard, play typing arcade games, and generate custom practice texts with AI.

</div>

## ✨ Features

- **Speed Test** — Measure your Words Per Minute (WPM), accuracy, and error rate
  across word/time/difficulty modes.
- **Touch Typing Tutorials** — Interactive lessons paired with a visual on-screen
  keyboard to learn proper finger placement.
- **Typing Arcade Games** — Fun gamified practice (Meteor, Racer, and more) to keep
  your fingers entertained.
- **AI-Generated Practice Text** — Uses the **Gemini API** to generate custom practice
  passages tailored to your target words and weak keys.
- **Stats Hub** — Track your progress and typing history with charts.
- **Sound & Retro Vibes** — Optional keystroke sounds and a Virtual Retro Computer theme.

## 🛠 Tech Stack

- [React 19](https://react.dev/)+ [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- [Express](https://expressjs.com/) (server) + [Three.js](https://threejs.org/) (3D arcade)
- [google-genai](https://github.com/googleapis/python-genai) for Gemini-powered text generation
- Bundled with [esbuild](https://esbuild.github.io/)

## 🚀 Getting Started

**Prerequisites:** [Node.js](https://nodejs.org/) (v18+) and optionally [Bun](https://bun.sh/).

1. Install dependencies:

   ```sh
   npm install
   ```

2. Set your Gemini API key in a `.env.local` file:

   ```
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

3. Run the app in development:

   ```sh
   npm run dev
   ```

   Open the printed URL (default `http://localhost:3000`) in your browser.

## 📦 Scripts

| Script            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload (`tsx server.ts`) |
| `npm run build`   | Build the client and bundle the server             |
| `npm start`       | Run the bundled production server                  |
| `npm run preview` | Preview the production build                       |
| `npm run lint`    | Type-check the project (`tsc --noEmit`)            |
| `npm run clean`   | Remove build artifacts                             |

## 📁 Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── SpeedTest/      # Typing speed test
│   │   ├── Tutorials/      # Touch typing lessons
│   │   ├── Arcade/         # Typing arcade games (Meteor, Racer)
│   │   └── StatsHub/       # Progress & stats
│   ├── lib/                # Sound, storage, and data helpers
│   ├── App.tsx
│   └── main.tsx
├── server.ts               # Express server + Gemini AI integration
├── index.html
├── vite.config.ts
└── package.json
```

## 🔒 Environment Variables

Create a `.env.local` (it is git-ignored) with:

- `GEMINI_API_KEY` — **Required** for generating AI practice texts.
- `APP_URL` — The URL where the app is hosted (used for self-referential links).

See [`.env.example`](.env.example) for details.

Built with ❤️ for fast typists.
