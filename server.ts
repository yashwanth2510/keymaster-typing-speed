import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper to initialize Gemini safely
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }

  // Helper to call the OpenAI-compatible OpenRouter endpoint.
  // Used first when an OPENROUTER_API_KEY is set (any provider key, e.g. a free-tier
  // Llama model), falling back to Gemini when the request fails or no key is present.
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || 'meta-llama/llama-3.3-70b-instruct';

  async function generateWithOpenRouter(
    prompt: string,
    config?: { responseMimeType?: string }
  ): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://keymaster-typing-studio.onrender.com',
          'X-Title': 'KeyMaster Typing Studio',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'user', content: prompt }],
          ...(config?.responseMimeType === 'application/json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        lastGeminiError = `[OpenRouter ${res.status}] ${body.slice(0, 200)}`;
        console.warn(`[OpenRouter] ${res.status}:`, body.slice(0, 200));
        return null;
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = json?.choices?.[0]?.message?.content;
      const text = typeof content === 'string' ? content.trim().replace(/^["']|["']$/g, '') : '';
      return text.length > 5 ? text : null;
    } catch (err: any) {
      const errMsg = err?.name === 'AbortError' ? 'timeout' : err?.message || String(err);
      console.warn('[OpenRouter] Error:', errMsg);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // In-memory cache so repeated generations answer instantly instead of re-hitting the API
  const aiCache = new Map<string, { text: string; at: number }>();
  const AI_CACHE_TTL_MS = 30 * 60 * 1000;

  // Last successful generation per prompt. Kept even after the cache TTL expires so
  // that when Gemini is temporarily throttled/unavailable (e.g. 429 quota bursts) we
  // can still return a topic-relevant passage instead of a generic practice sentence.
  const lastGoodText = new Map<string, string>();

  // Diagnostic: most recent Gemini error message (null when AI calls succeed).
  let lastGeminiError: string | null = null;

  function cacheGet(prompt: string): string | null {
    const hit = aiCache.get(prompt);
    if (hit && Date.now() - hit.at < AI_CACHE_TTL_MS) return hit.text;
    if (hit) aiCache.delete(prompt);
    return null;
  }

  function cacheSet(prompt: string, text: string): void {
    if (aiCache.size > 500) aiCache.clear();
    aiCache.set(prompt, { text, at: Date.now() });
    lastGoodText.set(prompt, text);
  }

  // Helper to execute AI requests (OpenRouter first, then Gemini) with graceful fallback.
  // Free-tier keys have tight per-day limits, so we don't waste calls: we make at
  // most one call per provider at a time and stop at the first usable response.
  async function generateWithGeminiFallback(
    prompt: string,
    config?: { responseMimeType?: string; isValid?: (text: string) => boolean }
  ): Promise<string | null> {
    const cached = cacheGet(prompt);
    if (cached) return cached;

    const accepted = (t: string | null): string | null =>
      t && (!config?.isValid || config.isValid(t)) ? t : null;

    // 1. Prefer OpenRouter when its key is configured (e.g. free-tier Llama).
    const openRouterText = accepted(await generateWithOpenRouter(prompt, config));
    if (openRouterText) {
      lastGeminiError = null;
      cacheSet(prompt, openRouterText);
      return openRouterText;
    }

    const ai = getGeminiClient();
    if (!ai) return null;

    // Use current Gemini models (gemini-3.7-flash, gemini-3.6-flash, gemini-2.5-flash)
    // Deprecated models like gemini-2.0-flash are strictly removed.
    const modelsToTry = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
    const PER_MODEL_TIMEOUT_MS = 20000;

    for (const model of modelsToTry) {
      try {
        const text = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config: config?.responseMimeType
              ? { responseMimeType: config.responseMimeType }
              : undefined,
          }).then((response) => {
            const t = response.text?.trim().replace(/^["']|["']$/g, '');
            return accepted(t && t.length > 5 ? t : null);
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), PER_MODEL_TIMEOUT_MS)),
        ]);
        if (text) {
          lastGeminiError = null;
          cacheSet(prompt, text);
          return text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        lastGeminiError = errMsg.slice(0, 300);
        if (
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE')
        ) {
          console.warn(`[Gemini API ${model}] Rate limited or unavailable, continuing...`);
        } else {
          console.warn(`[Gemini API ${model}] Error:`, errMsg);
        }
      }
    }

    return null;
  }

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
      openRouterModel: OPENROUTER_MODEL,
      diagnostics: {
        lastGeminiError,
        aiCacheSize: aiCache.size,
        lastGoodCount: lastGoodText.size
      }
    });
  });

  // API Route: Generate Custom Typing Text
  app.post('/api/generate-text', async (req, res) => {
    const rawCategory = typeof req.body?.category === 'string' ? req.body.category : '';
    const category = rawCategory.trim().replace(/[\r\n]+/g, ' ').slice(0, 80) || 'General Knowledge';
    const difficulty = ['easy', 'medium', 'hard'].includes(req.body?.difficulty) ? req.body.difficulty : 'medium';
    const wordCount = Math.min(Math.max(Number(req.body?.wordCount) || 45, 10), 200);

    const buildPrompt = (extra: string) => `Write a fluent, cohesive, multi-sentence single-paragraph typing practice passage about: "${category}"
Difficulty level: ${difficulty} (easy: simple vocabulary and common words; medium: moderate vocabulary and punctuation; hard: technical jargon, numbers, and symbols).
Target length: MUST be around ${wordCount} words. Do NOT stop after one sentence - develop the idea with several full sentences until you have roughly ${wordCount} words.
Important constraints:
- Return ONLY the clean passage text itself. No quotes, no preamble, no markdown formatting, no titles, no line breaks.
- Ensure proper punctuation and capitalization appropriate for the difficulty level.
- Ensure all characters are standard typable ASCII characters.${extra}`;

    let generatedText = await generateWithGeminiFallback(buildPrompt(''));

    // Some models stop after a single short sentence. If the reply is far too
    // short, push once to expand it into the requested length.
    const minWords = Math.round(wordCount * 0.65);
    if (generatedText && generatedText.split(/\s+/).length < minWords) {
      const expanded = await generateWithGeminiFallback(
        buildPrompt(`\nLONGER REQUIRED: your previous reply was too short. Expand it into a full multi-sentence paragraph of at least ${wordCount} words. Count your output and keep adding sentences until you reach that length.`)
      );
      if (expanded && expanded.split(/\s+/).length >= minWords) {
        generatedText = expanded;
      }
    }

    if (generatedText) {
      return res.json({ text: generatedText, source: 'ai' });
    }

    // Provider throttled/unavailable — reuse the last successful generation for this
    // exact topic if we have one so text stays relevant.
    const staleGood = lastGoodText.get(buildPrompt(''));
    if (staleGood) {
      return res.json({ text: staleGood, source: 'ai' });
    }

    return res.json({ text: getFallbackText(category, difficulty), source: 'built-in' });
  });

  // API Route: Generate Weak-Key Target Drills
  app.post('/api/weak-key-drill', async (req, res) => {
    const { weakKeys = [] } = req.body;

    if (!Array.isArray(weakKeys) || weakKeys.length === 0) {
      return res.json({
        text: "the quick brown fox jumps over the lazy dog as fast as lightning strikes through stormy weather",
        source: "built-in"
      });
    }

    const formattedKeys = weakKeys.slice(0, 5).join(', ');
    const prompt = `Create a typing exercise text that heavily emphasizes these specific target letters/characters: [${formattedKeys}].
The text should be a meaningful sequence of real English words or pseudo-words that forces the typist to repeatedly press the target keys: ${formattedKeys}.
Use varied vocabulary: never repeat the same word more than twice, and mix in short common connecting words to form real sentences.
Total length: MUST be around 25-35 words. Do NOT stop after one sentence - keep producing words and short sentences until you have at least 25 words.
Return ONLY the raw text without commentary or formatting.`;

    let drillText = await generateWithGeminiFallback(prompt, { isValid: isVariedText });

    if (!drillText) {
      const retryPrompt = `${prompt}\nIMPORTANT: Vary your vocabulary. Do not repeat any single word more than twice.`;
      drillText = await generateWithGeminiFallback(retryPrompt, { isValid: isVariedText });
    }

    if (drillText) {
      return res.json({ text: drillText, source: 'ai' });
    }

    const staleGood = lastGoodText.get(prompt) || lastGoodText.get(`${prompt}\nIMPORTANT: Vary your vocabulary. Do not repeat any single word more than twice.`);
    if (staleGood) {
      return res.json({ text: staleGood, source: 'ai' });
    }

    return res.json({ text: generateFallbackWeakKeyDrill(weakKeys), source: 'built-in' });
  });

  // API Route: AI Typing Coach Feedback
  app.post('/api/ai-coaching', async (req, res) => {
    const { wpm, accuracy, errorKeys = [], duration, mode } = req.body;

    const prompt = `You are KeyMaster, an expert touch-typing coach. Analyze the user's latest typing speed test results and provide friendly, concise, actionable feedback.
User Statistics:
- Speed: ${wpm} WPM
- Accuracy: ${accuracy}%
- Mode: ${mode} (${duration} seconds)
- Frequently missed keys: ${errorKeys.length > 0 ? errorKeys.join(', ') : 'None'}

Provide a structured response in JSON format with two fields:
1. "summary": A 1-2 sentence supportive appraisal of their rhythm and speed level.
2. "tips": An array of 3 bullet points with specific ergonomic, finger placement, or practice suggestions based on their errors.

Return strictly valid JSON like: {"summary": "...", "tips": ["...", "...", "..."]}`;

    const rawResponse = await generateWithGeminiFallback(prompt, {
      responseMimeType: 'application/json',
    });

    if (rawResponse) {
      try {
        let responseText = rawResponse.trim();
        if (responseText.startsWith('```json')) {
          responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(responseText);
        if (parsed.summary && Array.isArray(parsed.tips)) {
          return res.json({ advice: parsed, source: 'ai' });
        }
      } catch (err) {
        console.warn('Failed to parse AI coaching JSON response, using built-in advice.');
      }
    }

    const normalizedKeys = Array.isArray(errorKeys)
      ? errorKeys.filter((k: unknown) => typeof k === 'string')
      : [];

    return res.json({
      advice: getStaticAdvice(Number(wpm) || 0, Number(accuracy) || 100, normalizedKeys),
      source: 'built-in'
    });
  });

  // Vite development middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    startSelfKeepAlive();
  });
}

// Render free-tier instances spin down after ~15 min without incoming traffic,
// which surfaces as a slow "Awaking" interstitial on first visit instead of the
// site. GitHub's */10 scheduled cron is unreliable (runs frequently get dropped),
// so the app also keeps itself warm from the inside: a periodic request through
// Render's public load balancer counts as incoming traffic and resets the idle
// timer, so the site is always already awake.
const SELF_KEEP_ALIVE_INTERVAL_MS = 7 * 60 * 1000;
function startSelfKeepAlive() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) return;
  let consecutiveFailures = 0;
  const ping = () => {
    fetch(`${externalUrl}/api/health`)
      .then(() => {
        consecutiveFailures = 0;
      })
      .catch(() => {
        consecutiveFailures += 1;
      });
  };
  // Back off after repeated failures (e.g. deploy restart windows) to avoid a
  // self-inflicted error loop, but keep trying so a healthy instance stays warm.
  setInterval(() => {
    if (consecutiveFailures < 6) ping();
  }, SELF_KEEP_ALIVE_INTERVAL_MS);
}

function getFallbackText(category: string, difficulty: string): string {
  const Fallbacks: Record<string, string[]> = {
    'Technology & Code': [
      "In computer science, clean algorithms optimize performance by reducing algorithmic complexity and ensuring thread-safe data structures in distributed systems.",
      "Frontend development thrives on responsive user interfaces, reactive state management, asynchronous requests, and intuitive visual component design.",
      "const calculateWpm = (chars: number, seconds: number) => Math.round((chars / 5) / (seconds / 60));"
    ],
    'Quotes & Literature': [
      "Not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts in the grand scheme of life.",
      "In the middle of difficulty lies opportunity, where persistence and steady rhythm turn challenges into mastery."
    ],
    'Science & Cosmos': [
      "Light years across interstellar voids, glowing nebulae fuse hydrogen isotopes inside cosmic cradles, forming stellar nurseries across distant galaxies.",
      "Photosynthesis converts solar radiation into biochemical energy inside chloroplast cells, nourishing terrestrial food webs and releasing oxygen.",
      "Quantum mechanics demonstrates that particles exhibit both wave and particle characteristics under precise experimental observation."
    ]
  };

  const pool = Fallbacks[category] || [
    "The art of touch typing relies on muscle memory rather than conscious visual sight. Keeping your hands anchored on the home row keys allows your fingers to flow effortlessly across the keyboard without breaking focus.",
    "Practice makes progress when typing consistently every day. Focus on accuracy before striving for raw speed, because smooth rhythmic keystrokes naturally produce impressive words per minute.",
    "Fingers positioned gracefully on A S D F and J K L semicolon form the foundational posture for rapid typing across all keyboard layouts."
  ];

  // Unknown/custom topics get a fallback that still names the topic so the
  // "AI is busy" practice text feels relevant rather than generic.
  if (!Fallbacks[category]) {
    const intro = [
      `Practice passage on ${category}:`,
      `Typing exercise about ${category}:`,
      `Here is a short practice text about ${category}:`
    ][Math.floor(Math.random() * 3)];
    const body = [
      "Thoughtful practice builds speed, so keep your fingers on the home row and let rhythm guide every gentle keystroke.",
      "Accuracy comes before speed. Nudge your pace gently upward as each word settles into comfortable, reliable muscle memory.",
      "Relax your shoulders and let each character flow naturally, correcting small slips softly until the whole passage feels effortless."
    ][Math.floor(Math.random() * 3)];
    return intro + ' ' + body;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// Rejects AI text that repeats the same word over and over (e.g. a model spamming
// one target-key word like "fizz fizz fizz...") so drills stay varied and readable.
function isVariedText(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
  if (words.length < 5) return false;

  const freq = new Map<string, number>();
  let maxFreq = 0;
  for (const w of words) {
    const n = (freq.get(w) ?? 0) + 1;
    freq.set(w, n);
    if (n > maxFreq) maxFreq = n;
  }
  const uniqueRatio = freq.size / words.length;
  const maxAllowed = Math.max(3, Math.floor(words.length * 0.2));
  return uniqueRatio >= 0.5 && maxFreq <= maxAllowed;
}

function generateFallbackWeakKeyDrill(keys: string[]): string {
  if (!keys || keys.length === 0) {
    return "the quick brown fox jumps over the lazy dog as fast as lightning strikes through stormy weather";
  }

  const cleanKeys = keys.map(k => k.trim().toLowerCase()).filter(Boolean);

  const WORD_BANK = [
    "quick", "fuzzy", "quartz", "jackal", "vexes", "quiet", "zebra", "pixel", "zinc", "boxes",
    "brave", "swift", "rhythm", "sphere", "galaxy", "starlight", "vortex", "cascade", "nexus",
    "crystal", "harmony", "symphony", "keyboard", "practice", "dexterity", "accuracy", "velocity",
    "blitz", "juicy", "oxygen", "wizard", "sphinx", "jockey", "frenzy", "squadron",
    "jigsaw", "zipper", "jolt", "pyramid", "zephyr", "exquisite", "keycap", "home", "row", "finger",
    "quilt", "quiver", "quiz", "quota", "zany", "zippy", "xylophone", "vivid", "vault", "jazz",
    "exact", "external", "extra", "vanish", "voltage", "fizz", "bazaar", "breeze"
  ];

  const matchingWords = WORD_BANK.filter(word =>
    cleanKeys.some(k => word.toLowerCase().includes(k))
  );

  const pool = matchingWords.length >= 8 ? matchingWords : WORD_BANK;

  // Cycle unique words that exercise the target keys to build a ~25 word drill so
  // the practice session has enough length to be useful even without AI.
  const words: string[] = [];
  let i = 0;
  while (words.length < 25) {
    const word = pool[i % pool.length];
    if (!word) break;
    if (!words.includes(word)) words.push(word);
    i += 1;
    if (i > pool.length * 4) break;
  }
  const FILLER = ["steady", "rhythm", "clean", "accuracy", "muscle", "memory", "finger", "motion", "type", "each", "key", "with", "care", "focus", "again", "error", "repair"];
  for (const w of FILLER) {
    if (words.length >= 25) break;
    if (!words.includes(w)) words.push(w);
  }

  return `focus on target keys (${cleanKeys.join(' ')}): ` + words.slice(0, 25).join(' ');
}

function getStaticAdvice(wpm: number, accuracy: number, errorKeys: string[]) {
  let summary = "";
  if (wpm >= 70 && accuracy >= 95) {
    summary = "Outstanding performance! You have fast finger dexterity and exceptional accuracy.";
  } else if (wpm >= 40) {
    summary = "Solid typing rhythm! You maintain a steady pace with consistent finger movement.";
  } else {
    summary = "Good effort! Focus on anchoring your index fingers on the home row F and J keys to build muscle memory.";
  }

  const tips = [];
  if (accuracy < 92) {
    tips.push("Prioritize accuracy over speed. Slowing down slightly eliminates costly backspace corrections.");
  } else {
    tips.push("Your accuracy is solid! Keep pushing your comfort speed on longer multi-syllable words.");
  }

  if (errorKeys.length > 0) {
    tips.push(`Pay extra attention when reaching for keys [${errorKeys.slice(0, 3).join(', ')}]. Practice reaching without moving your wrist.`);
  } else {
    tips.push("Try taking a full typing lesson drill on top and bottom letter rows to polish your reach distance.");
  }

  tips.push("Maintain relaxed posture with flat wrists resting slightly above the desk or keyboard palm rest.");

  return { summary, tips };
}

startServer();
