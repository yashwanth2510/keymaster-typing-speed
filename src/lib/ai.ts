// Browser-direct AI provider used when there is no backend server (e.g. on GitHub
// Pages). The user's own API key stays in localStorage and is never committed.
// Groq was chosen because it officially allows browser (CORS) calls, is very fast,
// and has a free tier with no credit card.

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const AI_KEY_STORAGE = 'keymaster_ai_key';
const LAST_GOOD_STORAGE = 'keymaster_lastgood';

export const getAiKey = (): string => {
  try {
    return (localStorage.getItem(AI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
};

export const saveAiKey = (key: string): void => {
  const trimmed = key.trim();
  try {
    if (trimmed) {
      localStorage.setItem(AI_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(AI_KEY_STORAGE);
    }
  } catch {
    // storage unavailable (private mode etc.) — degrade silently
  }
};

export const isAiConfigured = (): boolean => getAiKey().length > 0;

function getLastGood(key: string): string | null {
  try {
    const raw = localStorage.getItem(LAST_GOOD_STORAGE);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[key] || null;
  } catch {
    return null;
  }
}

function setLastGood(key: string, text: string): void {
  try {
    const raw = localStorage.getItem(LAST_GOOD_STORAGE);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[key] = text;
    // Trim the map so localStorage never grows unbounded.
    localStorage.setItem(LAST_GOOD_STORAGE, JSON.stringify(map).slice(0, 50000));
  } catch {
    // best effort only
  }
}

// Normalize AI text into typeable ASCII (typographic characters → ASCII).
export const normalizeText = (text: string): string =>
  text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

interface GroqError extends Error {
  status?: number;
}

async function groqChat(messages: { role: 'system' | 'user'; content: string }[], maxTokens = 700): Promise<string> {
  const key = getAiKey();
  if (!key) {
    const err: GroqError = new Error('No AI key configured');
    err.status = 401;
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.8,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const err: GroqError = new Error(
        res.status === 401
          ? 'Groq key is invalid or revoked (401)'
          : res.status === 429
            ? 'Groq rate limit reached (429) — try again in a minute'
            : `Groq request failed (${res.status})`
      );
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Groq returned an empty response');
    }
    return text;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      const e: GroqError = new Error('Groq took too long — try again');
      e.status = 504;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export interface GeneratedPassage {
  text: string;
  source: 'ai' | 'fallback';
  fromCache?: boolean;
}

// Generate a typing passage about a topic via Groq, with the same prompt contract
// as the server so behavior is consistent depending on hosting.
export async function generateAIPassage(opts: {
  topic: string;
  difficulty: string;
  wordCount: number;
  useHeadlessCache?: boolean;
}): Promise<GeneratedPassage> {
  const { topic, difficulty, wordCount } = opts;
  const cacheKey = `topic|${topic.toLowerCase()}`;

  const cached = getLastGood(cacheKey);
  if (cached && cached.length > 5) {
    return { text: cached, source: 'ai', fromCache: true };
  }

  const difficultyLine =
    difficulty === 'easy'
      ? 'simple vocabulary and common words'
      : difficulty === 'hard'
        ? 'technical jargon, numbers, and symbols'
        : 'moderate vocabulary and punctuation';

  const userPrompt = `Generate a readable, cohesive single-paragraph typing practice text.
Category/Topic: "${topic}"
Difficulty level: ${difficulty} (${difficultyLine}).
Target length: Approximately ${wordCount} words.
Important constraints:
- Return ONLY the clean practice text string itself. No quotes, no preamble, no markdown formatting, no titles, no line breaks.
- Ensure proper punctuation and capitalization appropriate for the difficulty level.
- Ensure all characters are standard typable ASCII characters.`;

  const raw = await groqChat([
    { role: 'system', content: 'You write clean, paragraph-length English text for typing practice.' },
    { role: 'user', content: userPrompt }
  ]);

  const text = normalizeText(raw);
  if (text.length < 10) {
    throw new Error('Generated passage was too short');
  }
  setLastGood(cacheKey, text);
  return { text, source: 'ai' };
}

// Weak-key drill via Groq (mirrors the server /api/weak-key-drill contract).
export async function generateWeakDrill(weakKeys: string[]): Promise<GeneratedPassage> {
  const cacheKey = `drill|${weakKeys.join('')}`;

  const cached = getLastGood(cacheKey);
  if (cached && cached.length > 5) {
    return { text: cached, source: 'ai', fromCache: true };
  }

  const formattedKeys = weakKeys.slice(0, 5).join(', ');
  const userPrompt = `Create a typing exercise text that heavily emphasizes these specific target letters/characters: [${formattedKeys}].
The text should be a meaningful sequence of real English words or pseudo-words that forces the typist to repeatedly press the target keys: ${formattedKeys}.
Total length: around 25-35 words.
Return ONLY the raw text without commentary or formatting.`;

  const raw = await groqChat([
    { role: 'system', content: 'You create focused typing drills that repeat specified keys.' },
    { role: 'user', content: userPrompt }
  ]);

  const text = normalizeText(raw);
  if (text.length < 10) {
    throw new Error('Generated drill was too short');
  }
  setLastGood(cacheKey, text);
  return { text, source: 'ai' };
}

export interface CoachingAdvice {
  summary: string;
  tips: string[];
}

// Coaching analysis via Groq. Returns parsed advice or throws (caller falls back).
export async function generateCoaching(info: {
  wpm: number;
  accuracy: number;
  errorKeys: string[];
  duration: number;
  mode: string;
}): Promise<CoachingAdvice> {
  const { wpm, accuracy, errorKeys, duration, mode } = info;

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

  const raw = await groqChat(
    [
      { role: 'system', content: 'You are a professional touch-typing coach.' },
      { role: 'user', content: prompt }
    ],
    500
  );

  let responseText = raw.trim();
  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  const parsed = JSON.parse(responseText);
  if (parsed && typeof parsed.summary === 'string' && Array.isArray(parsed.tips)) {
    return {
      summary: parsed.summary,
      tips: parsed.tips.filter((t: unknown) => typeof t === 'string')
    };
  }
  throw new Error('Coaching response was not in the expected shape');
}

// Offline / no-key / still-nice-to-have fallbacks so the app never shows a blank
// passage even on a static host.
export function getLocalFallbackText(topic: string, difficulty: string): string {
  const body = [
    'Thoughtful practice builds speed, so keep your fingers on the home row and let rhythm guide every gentle keystroke.',
    'Accuracy comes before speed. Nudge your pace gently upward as each word settles into comfortable, reliable muscle memory.',
    'Relax your shoulders and let each character flow naturally, correcting small slips softly until the whole passage feels effortless.'
  ];
  const pool = difficulty === 'easy' ? body[0] : difficulty === 'hard' ? body[2] : body[1];
  return `Practice passage on ${topic}: ${pool}`;
}

export function getLocalWeakDrillFallback(keys: string[]): string {
  if (!keys || keys.length === 0) {
    return 'the quick brown fox jumps over the lazy dog as fast as lightning strikes through stormy weather';
  }
  const bank = [
    'quick', 'fuzzy', 'quartz', 'jackal', 'vexes', 'quiet', 'zebra', 'pixel', 'zinc', 'blitz',
    'juicy', 'wizard', 'sphinx', 'jockey', 'frenzy', 'jigsaw', 'zipper', 'jolt', 'pyramid', 'zephyr',
    'swift', 'vortex', 'cascade', 'nexus', 'dexterity', 'velocity', 'accuracy', 'keyboard', 'finger', 'rhythm'
  ];
  const matches = bank.filter((w) => keys.some((k) => w.toLowerCase().includes(k.toLowerCase())));
  const pool = matches.length >= 5 ? matches : bank;
  const words: string[] = [];
  let i = 0;
  while (words.length < 25) {
    const w = pool[i % pool.length];
    if (!words.includes(w)) words.push(w);
    i += 1;
    if (i > pool.length * 3 && words.length < 10) words.push('steady', 'rhythm', 'clean', 'accuracy');
  }
  return `focus on target keys (${keys.join(' ')}): ${words.slice(0, 25).join(' ')}`;
}