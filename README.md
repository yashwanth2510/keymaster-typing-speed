<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# KeyMaster — Typing Speed Test & Practice Studio

A typing speed test with AI-powered practice passages, weak-key drills, and AI coaching, powered by the Gemini API.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   `Get-Content .env.example | Set-Content .env.local` (or copy manually)
   Then edit `.env.local` and replace `MY_GEMINI_API_KEY`.
3. Run the app:
   `npm run dev`

The app runs at http://localhost:3000.

## Deploy (GitHub repo + Render)

**Important:** GitHub Pages cannot run the AI features. This app needs a Node server
for the `/api/*` Gemini endpoints. Deploy the repo to **Render** (free tier) instead,
which runs a real Node backend. Your code stays on GitHub.

1. Push this folder to a new GitHub repository:
   - `git init`
   - `git add .`
   - `git commit -m "initial commit"`
   - `git branch -M main`
   - `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git`
   - `git push -u origin main`
2. Go to https://render.com and sign up (free).
3. Click **New > Blueprint** and connect your GitHub repo.
   Render detects `render.yaml` automatically and creates the web service.
4. In the Render dashboard, open the service → **Environment**, add:
   - Key: `GEMINI_API_KEY` — value: your Gemini API key
   (get one free at https://aistudio.google.com/apikey)
5. Render builds and deploys automatically. Every future `git push` redeploys.
6. Your app is live at the URL Render gives you (e.g. `https://keymaster-typing-studio.onrender.com`).
   The AI features only work on that Node-hosted URL, not on a static github.io page.

Deploys elsewhere (Railway, Cloud Run, Fly.io) also work the same way — `npm run build`, then
`NODE_ENV=production node dist/server.cjs`, with `GEMINI_API_KEY` set as an environment variable.