import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestControls } from './TestControls';
import { ResultCard } from './ResultCard';
import { Keyboard } from '../Keyboard';
import { TestSettings, TestResult } from '../../types';
import { COMMON_WORDS, QUOTES, CODE_SNIPPETS } from '../../lib/data';
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
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
  const [errorKeysMap, setErrorKeysMap] = useState<Record<string, number>>({});
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; rawWpm: number; errors: number }[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [lastErrorKey, setLastErrorKey] = useState('');
  const [isLoadingAIText, setIsLoadingAIText] = useState(false);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const userInputRef = useRef(userInput);
  userInputRef.current = userInput;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const currentReqId = useRef(0);

  const weakKeysJoined = weakKeysList.join(',');

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

  // Generate target text based on mode
  const generateText = useCallback(async () => {
    const reqId = ++currentReqId.current;

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
      setTargetText(snippet.text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim());
    } else if (settings.mode === 'weak') {
      // Instant initial passage so there is no layout jump
      setTargetText(getWeakKeysFallback(weakKeysList));

      if (weakKeysList.length > 0) {
        setIsLoadingAIText(true);
        const slowTimer = setTimeout(() => {
          if (currentReqId.current === reqId) setIsLoadingAIText(false);
        }, 15000);
        try {
          const res = await fetch('/api/weak-key-drill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weakKeys: weakKeysList })
          });
          const data = await res.json();
          // Only update if user hasn't started typing yet and this request is still active
          if (
            currentReqId.current === reqId &&
            !isActiveRef.current &&
            userInputRef.current === '' &&
            data.text
          ) {
            setTargetText(data.text);
          }
        } catch (err) {
          console.error('Failed to fetch weak key drill:', err);
        } finally {
          clearTimeout(slowTimer);
          if (currentReqId.current === reqId) {
            setIsLoadingAIText(false);
          }
        }
      }
    } else if (settings.mode === 'ai') {
      const instant = [...COMMON_WORDS].sort(() => Math.random() - 0.5).slice(0, 35).join(' ');
      setTargetText(instant);
      setIsLoadingAIText(true);
      const slowTimer = setTimeout(() => {
        if (currentReqId.current === reqId) setIsLoadingAIText(false);
      }, 15000);
      try {
        const res = await fetch('/api/generate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'technology',
            difficulty: settings.difficulty,
            wordCount: 45
          })
        });
        const data = await res.json();
        if (
          currentReqId.current === reqId &&
          !isActiveRef.current &&
          userInputRef.current === '' &&
          data.text
        ) {
          setTargetText(data.text);
        }
      } catch (err) {
        console.error('Failed to generate AI text:', err);
      } finally {
        clearTimeout(slowTimer);
        if (currentReqId.current === reqId) {
          setIsLoadingAIText(false);
        }
      }
    } else {
      // Default time mode
      const shuffled = [...COMMON_WORDS].sort(() => Math.random() - 0.5);
      setTargetText(shuffled.slice(0, 70).join(' '));
    }

    // Focus input field
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 100);
  }, [settings.mode, settings.wordLimit, settings.timeLimit, settings.difficulty, weakKeysJoined]);

  // Handle custom AI topic text generation
  const handleGenerateAIText = async (topic: string) => {
    const reqId = ++currentReqId.current;
    setIsLoadingAIText(true);
    const instant = [...COMMON_WORDS].sort(() => Math.random() - 0.5).slice(0, 35).join(' ');
    setTargetText(instant);
    setUserInput('');
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(settings.timeLimit);
    const slowTimer = setTimeout(() => {
      if (currentReqId.current === reqId) setIsLoadingAIText(false);
    }, 15000);
    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topic,
          difficulty: settings.difficulty,
          wordCount: 45
        })
      });
      const data = await res.json();
      if (
        currentReqId.current === reqId &&
        !isActiveRef.current &&
        userInputRef.current === '' &&
        data.text
      ) {
        setTargetText(data.text);
      }
    } catch (err) {
      console.error('Failed to generate AI text:', err);
      if (currentReqId.current === reqId && !isActiveRef.current) {
        setTargetText("Artificial intelligence and machine learning are revolutionizing modern technology.");
      }
    } finally {
      clearTimeout(slowTimer);
      if (currentReqId.current === reqId) {
        setIsLoadingAIText(false);
      }
    }
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          {/* Hidden Input element */}
          <input
            ref={hiddenInputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            className="absolute opacity-0 pointer-events-none"
            autoFocus
          />

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
            {isLoadingAIText && (
              <div className="self-center text-[#DA6A45] animate-pulse font-mono text-xs bg-[#DA6A45]/10 rounded-full px-3 py-1 border border-[#DA6A45]/30 backdrop-blur-md">
                âœ¨ Preparing an AI passage â€” you can start typing now
              </div>
            )}
            <div className="relative py-6 px-4 min-h-[170px] text-lg sm:text-2xl font-mono leading-relaxed select-none overflow-hidden bg-[#FAF8F5]/90 rounded-2xl border border-[#E5DFD5] backdrop-blur-md shadow-inner">
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
                    {char === ' ' ? ' ' : char}
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
