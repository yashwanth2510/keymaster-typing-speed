import { TestResult, UserLessonProgress, TestSettings } from '../types';

const STORAGE_KEYS = {
  TEST_HISTORY: 'keymaster_test_history',
  RECENT_HISTORY: 'keymaster_recent_history',
  LESSON_PROGRESS: 'keymaster_lesson_progress',
  SETTINGS: 'keymaster_settings',
  STREAK: 'keymaster_streak',
  ACTIVITY_DAYS: 'keymaster_activity_days',
  HIGH_SCORES: 'keymaster_high_scores',
};

// Memory Cache for instant runtime persistence
const memoryCache: Record<string, any> = {};

// Helper for web cookies
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  } catch (err) {
    console.error('Error reading cookie:', err);
  }
  return null;
}

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = days * 86400;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.error('Error writing cookie:', err);
  }
}

// Unified multi-layered data reader (Memory -> LocalStorage -> Cookie)
function getStoredData<T>(key: string, fallback: T): T {
  // 1. Check memory cache
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }

  // 2. Check localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        memoryCache[key] = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn(`LocalStorage read failed for key ${key}`, err);
    }
  }

  // 3. Check Web Cookie
  const cookieVal = getCookie(key);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      memoryCache[key] = parsed;
      return parsed;
    } catch (err) {
      console.warn(`Cookie read failed for key ${key}`, err);
    }
  }

  return fallback;
}

// Unified multi-layered data writer (Memory + LocalStorage + Cookie)
function saveStoredData<T>(key: string, value: T): void {
  memoryCache[key] = value;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`LocalStorage write failed for key ${key}`, err);
    }
  }

  try {
    const serialized = JSON.stringify(value);
    // Keep individual cookies under 3800 bytes for standard browser compliance
    if (serialized.length < 3800) {
      setCookie(key, serialized);
    }
  } catch (e) {
    console.warn('Cookie serialization failed for key', key, e);
  }
}

export const DEFAULT_SETTINGS: TestSettings = {
  mode: 'time',
  timeLimit: 30,
  wordLimit: 25,
  category: 'General Knowledge',
  difficulty: 'medium',
  soundEnabled: true,
  soundProfile: 'cherry-blue',
  theme: 'dark',
  ambienceEnabled: false,
  ambienceSound: 'forest',
  ambienceVolume: 0.35,
};

export function getSavedSettings(): TestSettings {
  const settings = getStoredData<TestSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

export function saveSettings(settings: TestSettings): void {
  saveStoredData(STORAGE_KEYS.SETTINGS, settings);
}

// Retrieve recent test history from browser cookies
export function getRecentHistoryFromCookies(): TestResult[] {
  const raw = getCookie(STORAGE_KEYS.RECENT_HISTORY) || getCookie(STORAGE_KEYS.TEST_HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        id: item.id || `test_${item.timestamp || Date.now()}`,
        timestamp: Number(item.timestamp) || Date.now(),
        wpm: Number(item.wpm) || 0,
        rawWpm: Number(item.rawWpm ?? item.wpm) || 0,
        accuracy: Number(item.accuracy) || 100,
        correctChars: Number(item.correctChars) || 0,
        incorrectChars: Number(item.incorrectChars) || 0,
        totalKeystrokes: Number(item.totalKeystrokes) || 0,
        timeElapsed: Number(item.timeElapsed) || 30,
        mode: item.mode || 'time',
        modeLabel: item.modeLabel || (item.mode ? `${item.mode}` : '30s Time'),
        errorKeys: item.errorKeys || {},
        wpmHistory: item.wpmHistory || []
      }));
    }
  } catch (err) {
    console.warn('Failed to parse recent test history from cookies', err);
  }
  return [];
}

export function getTestHistory(): TestResult[] {
  // 1. Check memory cache
  const memoryItems = memoryCache[STORAGE_KEYS.TEST_HISTORY];

  // 2. Read from localStorage
  let localItems: TestResult[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localItems = parsed;
      }
    } catch (e) {
      console.warn('LocalStorage test history read error', e);
    }
  }

  // 3. Read from Browser Cookies
  const cookieItems = getRecentHistoryFromCookies();

  // Merge tests by unique id, keeping the newest order
  const map = new Map<string, TestResult>();
  cookieItems.forEach(t => map.set(t.id, t));
  localItems.forEach(t => map.set(t.id, t));
  if (Array.isArray(memoryItems)) {
    memoryItems.forEach(t => map.set(t.id, t));
  }

  const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  memoryCache[STORAGE_KEYS.TEST_HISTORY] = merged;
  return merged;
}

export function saveTestResult(result: TestResult): TestResult[] {
  const history = getTestHistory();
  const updated = [result, ...history.filter(h => h.id !== result.id)].slice(0, 100);
  memoryCache[STORAGE_KEYS.TEST_HISTORY] = updated;

  // 1. Persist full history to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage write failed for test history', err);
    }
  }

  // 2. Persist recent history to Browser Cookies (up to 15 tests, safe size < 3.5KB)
  try {
    const recentTestsForCookie = updated.slice(0, 15).map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      wpm: Math.round(t.wpm),
      rawWpm: Math.round(t.rawWpm),
      accuracy: Math.round(t.accuracy),
      correctChars: t.correctChars,
      incorrectChars: t.incorrectChars,
      totalKeystrokes: t.totalKeystrokes,
      timeElapsed: t.timeElapsed,
      mode: t.mode,
      modeLabel: t.modeLabel,
      errorKeys: t.errorKeys
    }));
    const cookieData = JSON.stringify(recentTestsForCookie);
    setCookie(STORAGE_KEYS.RECENT_HISTORY, cookieData, 365);
    setCookie(STORAGE_KEYS.TEST_HISTORY, cookieData, 365);
  } catch (err) {
    console.warn('Cookie test history write error', err);
  }

  recordDailyActivity();
  return updated;
}

export function getLessonProgress(): Record<string, UserLessonProgress> {
  return getStoredData<Record<string, UserLessonProgress>>(STORAGE_KEYS.LESSON_PROGRESS, {});
}

export function saveLessonProgress(progress: UserLessonProgress): void {
  const current = getLessonProgress();
  const existing = current[progress.lessonId];
  
  const updatedProgress: UserLessonProgress = {
    lessonId: progress.lessonId,
    completed: true,
    stars: Math.max(progress.stars, existing?.stars || 0),
    bestWpm: Math.max(progress.bestWpm, existing?.bestWpm || 0),
    bestAccuracy: Math.max(progress.bestAccuracy, existing?.bestAccuracy || 0)
  };

  current[progress.lessonId] = updatedProgress;
  saveStoredData(STORAGE_KEYS.LESSON_PROGRESS, current);
  setCookie(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(current));
  recordDailyActivity();
}

export function resetLessonProgress(): void {
  saveStoredData(STORAGE_KEYS.LESSON_PROGRESS, {});
  setCookie(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify({}));
}

export interface StreakInfo {
  count: number;
  lastDate: string;
  practicedToday: boolean;
  activeDates: string[];
}

export function getActivityDays(): string[] {
  const stored = getStoredData<string[]>(STORAGE_KEYS.ACTIVITY_DAYS, []);
  return Array.isArray(stored) ? stored : [];
}

// Format a Date as a local (browser timezone) yyyy-mm-dd string so streak days
// match the user's own calendar instead of UTC.
export function toLocalDateStr(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Reconstructs streak automatically from cookies, activity dates, and test history
export function getStreak(): StreakInfo {
  const today = toLocalDateStr(new Date());

  // Last 400 consecutive local calendar days, today first
  const daySequence: string[] = [];
  {
    const cursor = new Date();
    for (let i = 0; i < 400; i++) {
      daySequence.push(toLocalDateStr(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  const yesterday = daySequence[1];

  const dateSet = new Set<string>();

  // 1. Load active dates from cookie and localStorage
  const savedDays = getActivityDays();
  savedDays.forEach(d => {
    if (typeof d === 'string' && d.length === 10) dateSet.add(d);
  });

  // 2. Extract dates from test history (timestamps, converted to local time)
  const history = getTestHistory();
  history.forEach(item => {
    if (item.timestamp) {
      try {
        const d = toLocalDateStr(new Date(item.timestamp));
        if (d) dateSet.add(d);
      } catch {}
    }
  });

  // 3. Extract dates from stored streak info
  const storedStreak = getStoredData<{ count?: number; lastDate?: string } | null>(STORAGE_KEYS.STREAK, null);
  if (storedStreak?.lastDate && typeof storedStreak.lastDate === 'string') {
    dateSet.add(storedStreak.lastDate);
  }

  const sortedDates = Array.from(dateSet).sort();
  const hasToday = dateSet.has(today);
  const hasYesterday = dateSet.has(yesterday);

  let count = 0;
  let lastActiveDate = '';

  if (hasToday || hasYesterday) {
    // Count consecutive active days backwards from today (or yesterday if not
    // practiced yet today — the streak is still alive until the day ends).
    const startIndex = hasToday ? 0 : 1;
    for (let i = startIndex; i < daySequence.length; i++) {
      if (dateSet.has(daySequence[i])) count++;
      else break;
    }
    lastActiveDate = hasToday ? today : yesterday;
  } else if (sortedDates.length > 0) {
    // Neither today nor yesterday
    lastActiveDate = sortedDates[sortedDates.length - 1];
  }

  // If user had a recorded streak count for today or yesterday, don't drop below it
  if (storedStreak?.count && (storedStreak.lastDate === today || storedStreak.lastDate === yesterday)) {
    count = Math.max(count, storedStreak.count);
  }

  const streakInfo: StreakInfo = {
    count,
    lastDate: lastActiveDate || (hasToday ? today : (hasYesterday ? yesterday : '')),
    practicedToday: hasToday,
    activeDates: sortedDates
  };

  // Sync to memory, localStorage and long-lived cookies
  saveStoredData(STORAGE_KEYS.STREAK, streakInfo);
  setCookie(STORAGE_KEYS.STREAK, JSON.stringify(streakInfo));

  return streakInfo;
}

// Records daily activity into cookies and history, updating streak
export function recordDailyActivity(): StreakInfo {
  const today = toLocalDateStr(new Date());
  const days = getActivityDays();
  if (!days.includes(today)) {
    days.push(today);
    // Keep last 120 days
    const trimmed = Array.from(new Set(days)).sort().slice(-120);
    saveStoredData(STORAGE_KEYS.ACTIVITY_DAYS, trimmed);
    setCookie(STORAGE_KEYS.ACTIVITY_DAYS, JSON.stringify(trimmed));
  }
  return getStreak();
}

export function updateStreak(): StreakInfo {
  return recordDailyActivity();
}

export function getWeakKeysFromHistory(): string[] {
  const history = getTestHistory();
  const keyErrorMap: Record<string, number> = {};

  history.forEach(test => {
    if (test.errorKeys) {
      Object.entries(test.errorKeys).forEach(([key, count]) => {
        keyErrorMap[key] = (keyErrorMap[key] || 0) + count;
      });
    }
  });

  return Object.entries(keyErrorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => key);
}

export function getArcadeHighScores(): Record<string, number> {
  return getStoredData<Record<string, number>>(STORAGE_KEYS.HIGH_SCORES, {});
}

export function saveArcadeHighScore(gameId: string, score: number): void {
  const scores = getArcadeHighScores();
  if ((scores[gameId] || 0) < score) {
    scores[gameId] = score;
    saveStoredData(STORAGE_KEYS.HIGH_SCORES, scores);
    setCookie(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
  }
  recordDailyActivity();
}

