export type TestMode = 'time' | 'words' | 'quote' | 'code' | 'ai' | 'weak';

export type TimeOption = 15 | 30 | 60 | 120;
export type WordOption = 10 | 25 | 50 | 100;

export type AmbienceSoundOption = 'forest' | 'crickets' | 'stream' | 'rain' | 'waves' | 'fireplace' | 'typing' | 'cafe' | 'off';

export interface TestSettings {
  mode: TestMode;
  timeLimit: TimeOption;
  wordLimit: WordOption;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  soundProfile: 'cherry-blue' | 'cherry-red' | 'tactile' | 'typewriter' | 'pop' | 'silent';
  theme: 'dark' | 'light' | 'cyberpunk' | 'matrix' | 'retro-paper';
  ambienceEnabled: boolean;
  ambienceSound: AmbienceSoundOption;
  ambienceVolume: number; // 0 to 1
}

export interface KeystrokeLog {
  char: string;
  expected: string;
  timestamp: number;
  isCorrect: boolean;
  wpmSnapshot: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  timeElapsed: number;
  mode: TestMode;
  modeLabel: string;
  errorKeys: Record<string, number>; // key -> error count
  wpmHistory: { time: number; wpm: number; rawWpm: number; errors: number }[];
}

export interface LessonStep {
  id: string;
  title: string;
  targetKeys: string[];
  description: string;
  promptText: string;
  fingerGuide: string; // e.g. "Use Left Index for F, Right Index for J"
}

export interface Lesson {
  id: string;
  category: 'Home Row' | 'Top Row' | 'Bottom Row' | 'Numbers & Symbols' | 'Capitals & Shift' | 'Mastery Drills';
  title: string;
  level: number;
  description: string;
  targetKeys: string[];
  steps: LessonStep[];
}

export interface UserLessonProgress {
  lessonId: string;
  completed: boolean;
  stars: number; // 1 to 3
  bestWpm: number;
  bestAccuracy: number;
}

export interface KeyStat {
  key: string;
  totalHits: number;
  errors: number;
  accuracy: number;
}

export interface AICoaching {
  summary: string;
  tips: string[];
}
