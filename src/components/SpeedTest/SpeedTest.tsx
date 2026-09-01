import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestControls } from './TestControls';
import { ResultCard } from './ResultCard';
import { Keyboard } from '../Keyboard';
import { TestSettings, TestResult } from '../../types';
import { COMMON_WORDS, QUOTES, CODE_SNIPPETS, STORY_PASSAGES } from '../../lib/data';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { soundEngine } from '../../lib/sound';
import { saveTestResult } from '../../lib/storage';

interface SpeedTestProps {
  settings: TestSettings;
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void;
  weakKeysList: string[];
}

export const SpeedTest: React.FC<SpeedTestProps> = ({
  settings,
  onUpdateSettings,
  weakKeysList
}) => {
  const [targetText, setTargetText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
  const [errorKeysMap, setErrorKeysMap] = useState<Record<string, number>>({});
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; rawWpm: number; errors: number }[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [lastErrorKey, setLastErrorKey] = useState('');

  // Generator status machine shared by the AI-topic and weak-key drill flows.
  // idle = instant passage only (no request / nothing to report),
  // loading = request in flight, generated = AI text swapped in,
  // fallback = request failed/too slow and the instant passage is being shown.
  type GenStatus = 'idle' | 'loading' | 'generated' | 'fallback';
  const [aiStatus, setAiStatus] = useState<GenStatus>('idle');
  const [aiError, setAiError] = useState('');
  // Tracks where the shown topic passage came from: AI (real Gemini) or a
  // curated built-in sample. Topics never hit the API key (it is reserved for
  // weak drills), so we label the chip honestly instead of claiming AI.
  const [aiSource, setAiSource] = useState<'ai' | 'built-in' | null>(null);
  const [weakStatus, setWeakStatus] = useState<GenStatus>('idle');
  const [weakError, setWeakError] = useState('');
  // Derived loading flag keeps the TestControls Generate button and the
  // close-on-finish logic working unchanged for both generators.
  const isLoadingAIText = aiStatus === 'loading' || weakStatus === 'loading';

  const hiddenInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const userInputRef = useRef(userInput);
  userInputRef.current = userInput;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const currentReqId = useRef(0);

  // Remembers the custom AI topic so restarts (Esc / Try Again) and wiki/re-entry
  // into AI mode keep generating text about the same topic instead of a hardcoded one.
  const aiTopicRef = useRef(settings.category);
  // True once the user has submitted a topic through the AI prompt. A submitted topic
  // always gets generated (even the literal "General Knowledge"), while an untouched
  // default topic produces no background request until the user actually picks one.
  const aiTopicExplicitRef = useRef(false);

  const weakKeysJoined = weakKeysList.join(',');

  // Normalize AI text so every character is typeable on a standard keyboard:
  // typographic quotes/dashes/marks become their ASCII equivalents and any
  // stray non-ASCII character is dropped (otherwise the passage could contain
  // characters the typist literally cannot produce).
  const normalizeText = (text: string) =>
    text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Helper to build instant fallback weak key passage
  const getWeakKeysFallback = (keys: string[]) => {
    if (!keys || keys.length === 0) {
      return "crazy fuzzy quartz jackal vexes quiet zebra while quick pixel zinc boxes zip through extra icy zone";
    }
    const lowerKeys = keys.map(k => k.toLowerCase());
    const matchingWords = COMMON_WORDS.filter(word =>
      lowerKeys.some(k => word.toLowerCase().includes(k))
    );
    if (matchingWords.length >= 10) {
      const shuffled = [...matchingWords].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 25).join(' ');
    }
    return "crazy fuzzy quartz jackal vexes quiet zebra while quick pixel zinc boxes zip through extra icy zone";
  };

  // Generate target text based on mode. An explicit AI topic can be passed so a
  // freshly submitted topic is used on the very first attempt.
  const generateText = useCallback(async (explicitTopic?: string) => {
    const reqId = ++currentReqId.current;

    // Clear any stale generator status/errors from a previous mode or attempt.
    setAiStatus('idle');
    setAiError('');
    setAiSource(null);
    setWeakStatus('idle');
    setWeakError('');

    setIsActive(false);
    setIsFinished(false);
    setUserInput('');
    setStartTime(null);
    setKeystrokes(0);
    setCorrectKeystrokes(0);
    setErrorKeysMap({});
    setWpmHistory([]);
    setTestResult(null);
    setTimeLeft(settings.timeLimit);

    if (settings.mode === 'words') {
      const shuffled = [...COMMON_WORDS].sort(() => Math.random() - 0.5);
      setTargetText(shuffled.slice(0, settings.wordLimit).join(' '));
    } else if (settings.mode === 'quote') {
      const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setTargetText(q.text);
    } else if (settings.mode === 'code') {
      const snippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      // Keep the real multi-line code (newlines + indentation) intact so the
      // passage is typed as actual code, not flattened into one line.
      setTargetText(snippet.text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
    } else if (settings.mode === 'weak') {
      // Instant weak-key passage so there is no layout jump while the AI drill loads.
      setTargetText(getWeakKeysFallback(weakKeysList));

      if (weakKeysList.length > 0) {
        setWeakStatus('loading');
        setWeakError('');
        const genTimer = setTimeout(() => {
          if (currentReqId.current === reqId) {
            setWeakStatus('fallback');
            setWeakError('took too long');
          }
        }, 28000);
        try {
          const res = await fetch('/api/weak-key-drill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weakKeys: weakKeysList })
          });
          const data = await res.json();
          if (currentReqId.current !== reqId) return;

          const cleanDrill = typeof data?.text === 'string'
            ? normalizeText(data.text)
            : '';
          if (data.source === 'ai' && cleanDrill.length > 5) {
            // Only swap if the user hasn't started typing yet.
            if (!isActiveRef.current && userInputRef.current === '') {
              setTargetText(cleanDrill);
              setWeakStatus('generated');
            } else {
              setWeakStatus('idle');
            }
          } else {
            setWeakStatus('fallback');
            setWeakError('AI is busy right now');
          }
        } catch (err) {
          console.error('Failed to fetch weak key drill:', err);
          if (currentReqId.current !== reqId) return;
          setWeakStatus('fallback');
          setWeakError('network error');
        } finally {
          clearTimeout(genTimer);
        }
      }
    } else if (settings.mode === 'ai') {
      // Instant practice passage so the user can start typing immediately while the
      // AI text about their topic is being generated in the background.
      const instant = [...COMMON_WORDS].sort(() => Math.random() - 0.5).slice(0, 35).join(' ');
      setTargetText(instant);

      const topic = (explicitTopic || aiTopicRef.current || settings.category || '').trim();
      const hasCustomTopic = aiTopicExplicitRef.current || (topic && topic !== 'General Knowledge');

      // No custom topic picked yet: the AI topic prompt is open, so skip the
      // background request — nothing meaningful to generate until the user submits.
      if (!hasCustomTopic) {
        setAiStatus('idle');
        setAiError('');
      } else {
        setAiStatus('loading');
        setAiError('');
        const wordCount = 45;
        const genTimer = setTimeout(() => {
          if (currentReqId.current === reqId) {
            setAiStatus('fallback');
            setAiError('took too long');
          }
        }, 28000);
        try {
          const res = await fetch('/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: topic,
              difficulty: settings.difficulty,
              wordCount
            })
          });
          const data = await res.json();
          if (currentReqId.current !== reqId) return;

          const cleanText = typeof data?.text === 'string'
            ? normalizeText(data.text)
            : '';
          // Topic passages intentionally never use the Gemini key (it is reserved
          // for weak drills), so any well-formed response — AI or curated — counts.
          if (cleanText.length > 5) {
            // Only swap if the user hasn't started typing yet.
            if (!isActiveRef.current && userInputRef.current === '') {
              setTargetText(cleanText);
              setAiStatus('generated');
              setAiSource(data.source === 'ai' ? 'ai' : 'built-in');
            } else {
              setAiStatus('idle');
            }
          } else {
            setAiStatus('fallback');
            setAiError('empty response');
          }
        } catch (err) {
          console.error('Failed to generate AI text:', err);
          if (currentReqId.current !== reqId) return;
          setAiStatus('fallback');
          setAiError('network error');
        } finally {
          clearTimeout(genTimer);
        }
      }
    } else {
      // Default time mode — show a real English passage, sized so the timer
      // (not the text) is the limiting factor for the chosen duration.
      const passages = [...STORY_PASSAGES].sort(() => Math.random() - 0.5);
      const passage = passages[0] || '';
      const targetWords = Math.ceil(settings.timeLimit * 1.2);
      const words = passage.split(/\s+/);
      setTargetText(words.slice(0, Math.min(targetWords, words.length)).join(' '));
    }

    // Focus the hidden typing input — but never steal focus from the AI topic
    // prompt (or any other input the user is actively using).
    setTimeout(() => {
      const el = document.activeElement;
      if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) {
        hiddenInputRef.current?.focus();
      }
    }, 100);
  }, [settings.mode, settings.wordLimit, settings.timeLimit, settings.difficulty, weakKeysJoined]);

  // Handle custom AI topic text generation
  const handleGenerateAIText = (topic: string) => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    aiTopicExplicitRef.current = true;
    aiTopicRef.current = trimmedTopic;
    // Persist the topic so reopening the site keeps it (and survives reloads).
    onUpdateSettings({ mode: 'ai', category: trimmedTopic });
    generateText(trimmedTopic);
  };

  const prevSettingsRef = useRef({
    mode: settings.mode,
    wordLimit: settings.wordLimit,
    timeLimit: settings.timeLimit,
    difficulty: settings.difficulty,
    weakKeysJoined
  });

  useEffect(() => {
    const prev = prevSettingsRef.current;
    const modeChanged = prev.mode !== settings.mode;

    prevSettingsRef.current = {
      mode: settings.mode,
      wordLimit: settings.wordLimit,
      timeLimit: settings.timeLimit,
      difficulty: settings.difficulty,
      weakKeysJoined
    };

    // If user is not currently typing, OR if mode explicitly changed, generate text
    if (!isActiveRef.current && userInputRef.current === '') {
      generateText();
    } else if (modeChanged) {
      generateText();
    }
  }, [generateText, settings.mode, settings.wordLimit, settings.timeLimit, settings.difficulty, weakKeysJoined]);

  // Keep state refs updated so timer interval and finishTest don't tear down setInterval on every keystroke
  const stateRefs = useRef({
    correctKeystrokes,
    keystrokes,
    errorKeysMap,
    startTime,
    settings,
    wpmHistory,
    targetText
  });

  useEffect(() => {
    stateRefs.current = {
      correctKeystrokes,
      keystrokes,
      errorKeysMap,
      startTime,
      settings,
      wpmHistory,
      targetText
    };
  });

  // Finish test callback
  const finishTest = useCallback((finalCorrect?: number, finalTotal?: number, finalErrorMap?: Record<string, number>) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setIsFinished(true);

    const {
      startTime: currentStartTime,
      settings: currentSettings,
      correctKeystrokes: refCorrect,
      keystrokes: refTotal,
      errorKeysMap: refErrorMap,
      wpmHistory: currentHistory
    } = stateRefs.current;

    const currentCorrect = finalCorrect !== undefined ? finalCorrect : refCorrect;
    const currentTotal = finalTotal !== undefined ? finalTotal : refTotal;
    const currentErrorMap = finalErrorMap !== undefined ? finalErrorMap : refErrorMap;

    const elapsed = currentStartTime ? Math.max(1, Math.round((Date.now() - currentStartTime) / 1000)) : currentSettings.timeLimit;
    const minutes = elapsed / 60;

    // Calculate WPM: (correct characters / 5) / minutes
    const calculatedWpm = Math.max(0, Math.round((currentCorrect / 5) / minutes));
    const rawCalculatedWpm = Math.max(0, Math.round((currentTotal / 5) / minutes));
    const accuracy = currentTotal > 0 ? Math.round((currentCorrect / currentTotal) * 100) : 100;

    const result: TestResult = {
      id: `test_${Date.now()}`,
      timestamp: Date.now(),
      wpm: calculatedWpm,
      rawWpm: rawCalculatedWpm,
      accuracy,
      correctChars: currentCorrect,
      incorrectChars: Math.max(0, currentTotal - currentCorrect),
      totalKeystrokes: currentTotal,
      timeElapsed: elapsed,
      mode: currentSettings.mode,
      modeLabel: `${currentSettings.mode.toUpperCase()} ${currentSettings.mode === 'time' ? `${currentSettings.timeLimit}s` : ''}`,
      errorKeys: currentErrorMap,
      wpmHistory: currentHistory
    };

    setTestResult(result);
    saveTestResult(result);
    soundEngine.playSuccess();
  }, []);

  const finishTestRef = useRef(finishTest);
  finishTestRef.current = finishTest;

  // Persistent Timer loop for time-based mode and WPM tracking
  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const { startTime: st, settings: currentSettings, correctKeystrokes: cKey, keystrokes: tKey, errorKeysMap: errMap } = stateRefs.current;

      if (!st) return;

      const elapsedSec = Math.floor((now - st) / 1000);

      if (currentSettings.mode === 'time') {
        const remaining = Math.max(0, currentSettings.timeLimit - elapsedSec);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          finishTestRef.current();
          return;
        }
      }

      // Snapshot WPM history
      const minutes = elapsedSec / 60;
      if (minutes > 0) {
        const currentWpm = Math.round((cKey / 5) / minutes);
        const currentRawWpm = Math.round((tKey / 5) / minutes);
        const totalErrors = (Object.values(errMap) as number[]).reduce((a: number, b: number) => a + b, 0);

        setWpmHistory((hist) => [
          ...hist,
          {
            time: elapsedSec,
            wpm: isNaN(currentWpm) ? 0 : currentWpm,
            rawWpm: isNaN(currentRawWpm) ? 0 : currentRawWpm,
            errors: totalErrors
          }
        ]);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // Handle keyboard inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isFinished) return;

    const val = e.target.value;
    const now = Date.now();

    // Start timer on first keystroke
    if (!isActive) {
      setIsActive(true);
      setStartTime(now);
      stateRefs.current.startTime = now;
    }

    const prevLength = userInput.length;
    setUserInput(val);

    let nextKeystrokes = stateRefs.current.keystrokes;
    let nextCorrect = stateRefs.current.correctKeystrokes;
    let nextErrorMap = { ...stateRefs.current.errorKeysMap };

    // If user typed a new character
    if (val.length > prevLength) {
      const typedChar = val[val.length - 1];
      const expectedChar = targetText[val.length - 1];

      setLastPressedKey(typedChar);
      nextKeystrokes = stateRefs.current.keystrokes + 1;
      setKeystrokes(nextKeystrokes);
      stateRefs.current.keystrokes = nextKeystrokes;

      if (typedChar === expectedChar) {
        nextCorrect = stateRefs.current.correctKeystrokes + 1;
        setCorrectKeystrokes(nextCorrect);
        stateRefs.current.correctKeystrokes = nextCorrect;
        setLastErrorKey('');
        soundEngine.playKeyPress(typedChar);
      } else {
        setLastErrorKey(typedChar);
        const errKey = expectedChar ? expectedChar.toLowerCase() : typedChar.toLowerCase();
        nextErrorMap[errKey] = (nextErrorMap[errKey] || 0) + 1;
        setErrorKeysMap(nextErrorMap);
        stateRefs.current.errorKeysMap = nextErrorMap;
        soundEngine.playError();
      }
    }

    // Check if finished entire target text
    if (targetText.length > 0 && val.length >= targetText.length) {
      finishTest(nextCorrect, nextKeystrokes, nextErrorMap);
    }
  };

  // Keyboard shortcut listener (Esc or Tab+Enter to restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        generateText();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateText]);

  // Calculate live WPM
  const currentElapsed = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 1;
  const liveWpm = isActive ? Math.round((correctKeystrokes / 5) / (currentElapsed / 60)) : 0;
  const liveAccuracy = keystrokes > 0 ? Math.round((correctKeystrokes / keystrokes) * 100) : 100;

  const currentTargetChar = targetText[userInput.length] || '';

  const showLoadingPill = isLoadingAIText;
  const showFallbackPill = aiStatus === 'fallback' || weakStatus === 'fallback';
  const fallbackMessage = aiStatus === 'fallback'
    ? `Couldn't load a topic passage${aiError ? ` (${aiError})` : ''}.`
    : `AI drill unavailable${weakError ? ` (${weakError})` : ''}.`;
  const showAIGeneratedChip = aiStatus === 'generated';
  const showWeakGeneratedChip = weakStatus === 'generated';

  return (
    <div className="w-full flex flex-col items-center gap-6 py-4">
      {/* Test Controls Bar */}
      <TestControls
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onRestart={generateText}
        onGenerateAIText={handleGenerateAIText}
        isLoadingAIText={isLoadingAIText}
        weakKeysList={weakKeysList}
      />

      {/* Main Test Area or Result Card */}
      {isFinished && testResult ? (
        <ResultCard
          result={testResult}
          onRestart={generateText}
          onPracticeWeakKeys={() => {
            onUpdateSettings({ mode: 'weak' });
            generateText();
          }}
        />
      ) : (
        <div
          id="typing-test-box"
          onClick={() => hiddenInputRef.current?.focus()}
          className="w-full max-w-4xl bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 sm:p-10 shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] backdrop-blur-2xl flex flex-col gap-6 relative cursor-text group transition-all duration-300 hover:border-[#DA6A45]/40 hover:shadow-lg"
        >
          {/* Hidden Input element — textarea for multi-line code mode so Enter and
              indentation are captured the same way they appear in the passage */}
          {settings.mode === 'code' ? (
            <textarea
              ref={hiddenInputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={userInput}
              onChange={handleInputChange}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              className="absolute opacity-0 pointer-events-none"
              autoFocus
            />
          ) : (
            <input
              ref={hiddenInputRef as unknown as React.RefObject<HTMLInputElement>}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              className="absolute opacity-0 pointer-events-none"
              autoFocus
            />
          )}

          {/* Live Floating HUD Metrics */}
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4 text-xs sm:text-sm font-mono">
            <div className="flex items-center gap-6">
              {settings.mode === 'time' && (
                <div className="flex items-center gap-2 text-[#DA6A45] font-bold bg-[#DA6A45]/10 px-3 py-1 rounded-xl border border-[#DA6A45]/20 backdrop-blur-md">
                  <span className="text-xl sm:text-2xl">{timeLeft}s</span>
                  <span className="text-[#78726A] font-normal">remaining</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#F2ECE1]/80 px-3 py-1 rounded-xl border border-[#E5DFD5] backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-bold text-[#2C2825]">{liveWpm}</span>
                <span className="text-[#78726A]">WPM</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F2ECE1]/80 px-3 py-1 rounded-xl border border-[#E5DFD5] backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-bold text-emerald-700">{liveAccuracy}%</span>
                <span className="text-[#78726A]">Accuracy</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyboard(!showKeyboard);
              }}
              className="text-xs text-[#78726A] hover:text-[#DA6A45] transition-colors px-3 py-1.5 bg-[#F2ECE1] hover:bg-[#EBE3D5] rounded-xl border border-[#E5DFD5] backdrop-blur-md font-medium"
            >
              {showKeyboard ? 'Hide Visual Keyboard' : 'Show Visual Keyboard'}
            </button>
          </div>

          {/* Typing Passage Display */}
          <div className="flex flex-col gap-2">
            {showLoadingPill && (
              <div className="self-center text-[#DA6A45] animate-pulse font-mono text-xs bg-[#DA6A45]/10 rounded-full px-3 py-1 border border-[#DA6A45]/30 backdrop-blur-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preparing a smarter passage — you can start typing now</span>
              </div>
            )}

            {showFallbackPill && !showLoadingPill && (
              <div className="self-center flex items-center gap-2 text-amber-700 font-mono text-xs bg-amber-50 rounded-full px-3 py-1 border border-amber-600/30 backdrop-blur-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {fallbackMessage}{' '}
                  {aiStatus === 'fallback'
                    ? 'Showing instant practice words.'
                    : 'Showing a built-in weak-key drill.'}
                </span>
                <button
                  onClick={() => generateText()}
                  className="underline font-bold hover:text-amber-900 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {showAIGeneratedChip && (
              <div className="self-center flex items-center gap-1.5 text-emerald-700 font-mono text-xs bg-emerald-50 rounded-full px-3 py-1 border border-emerald-600/25 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiSource === 'ai' ? `AI passage — ${aiTopicRef.current}` : `Topic sample — ${aiTopicRef.current || settings.category}`}</span>
              </div>
            )}

            {showWeakGeneratedChip && (
              <div className="self-center flex items-center gap-1.5 text-emerald-700 font-mono text-xs bg-emerald-50 rounded-full px-3 py-1 border border-emerald-600/25 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI drill — targeting {weakKeysList.length} weak key{weakKeysList.length === 1 ? '' : 's'}</span>
              </div>
            )}
            <div className={`relative py-6 px-4 min-h-[170px] text-lg sm:text-2xl font-mono leading-relaxed select-none overflow-hidden bg-[#FAF8F5]/90 rounded-2xl border border-[#E5DFD5] backdrop-blur-md shadow-inner ${settings.mode === 'code' ? 'whitespace-pre-wrap' : ''}`}>
              {targetText.split('').map((char, index) => {
                const typed = userInput[index];
                let charStyle = 'text-[#A0988E]'; // default future text

                if (typed !== undefined) {
                  if (typed === char) {
                    charStyle = 'text-[#DA6A45] font-semibold bg-[#DA6A45]/15 rounded-xs shadow-2xs';
                  } else {
                    charStyle = 'text-rose-700 font-bold bg-rose-100 rounded-xs border-b-2 border-rose-500 shadow-2xs';
                  }
                }

                const isCurrentCursor = index === userInput.length;

                return (
                  <span key={index} className={`relative transition-all duration-75 ${charStyle}`}>
                    {isCurrentCursor && (
                      <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-[#DA6A45] shadow-[0_0_8px_#DA6A45] animate-pulse rounded-full" />
                    )}
                    {char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="flex items-center justify-between text-xs text-[#78726A] font-mono pt-2 border-t border-[#E5DFD5]">
            <span>Press <kbd className="px-2 py-0.5 bg-[#F2ECE1] rounded border border-[#E5DFD5] text-[#2C2825] font-bold backdrop-blur-md">Esc</kbd> to restart instantly</span>
            <span>{userInput.length} / {targetText.length} Characters</span>
          </div>
        </div>
      )}

      {/* Visual On-Screen Keyboard */}
      {showKeyboard && !isFinished && (
        <Keyboard
          targetKey={currentTargetChar}
          pressedKey={lastPressedKey}
          errorKey={lastErrorKey}
          showFingerGuide={true}
        />
      )}
    </div>
  );
};
