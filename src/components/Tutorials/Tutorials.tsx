import React, { useState } from 'react';
import { BookOpen, Star, CheckCircle, ArrowRight, Play, RefreshCw, Trophy, Sparkles, Flame, Award } from 'lucide-react';
import { TUTORIAL_LESSONS } from '../../lib/data';
import { Lesson, UserLessonProgress } from '../../types';
import { Keyboard } from '../Keyboard';
import { VirtualRetroComputer } from '../VirtualRetroComputer';
import { soundEngine } from '../../lib/sound';
import { saveLessonProgress, getLessonProgress } from '../../lib/storage';

export const Tutorials: React.FC = () => {
  const [progressMap, setProgressMap] = useState<Record<string, UserLessonProgress>>(() => getLessonProgress());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Aggregate curriculum statistics
  const progressList = Object.values(progressMap) as UserLessonProgress[];
  const completedLessons = progressList.filter(p => p.completed).length;
  const totalStars = progressList.reduce((acc, p) => acc + (p.stars || 0), 0);
  const maxStars = TUTORIAL_LESSONS.length * 3;

  // Active step state
  const [userInput, setUserInput] = useState('');
  const [keystrokes, setKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [lastErrorKey, setLastErrorKey] = useState('');
  const [stepFinished, setStepFinished] = useState(false);

  const startLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentStepIndex(0);
    resetStep();
  };

  const resetStep = () => {
    setUserInput('');
    setKeystrokes(0);
    setCorrectKeystrokes(0);
    setStartTime(null);
    setLastPressedKey('');
    setLastErrorKey('');
    setStepFinished(false);
  };

  const currentStep = selectedLesson?.steps[currentStepIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (stepFinished || !currentStep) return;

    const val = e.target.value;
    const now = Date.now();

    if (!startTime) setStartTime(now);

    const prevLength = userInput.length;
    setUserInput(val);

    if (val.length > prevLength) {
      const typedChar = val[val.length - 1];
      const expectedChar = currentStep.promptText[val.length - 1];

      setLastPressedKey(typedChar);
      setKeystrokes((k) => k + 1);

      if (typedChar === expectedChar) {
        setCorrectKeystrokes((c) => c + 1);
        setLastErrorKey('');
        soundEngine.playKeyPress(typedChar);
      } else {
        setLastErrorKey(typedChar);
        soundEngine.playError();
      }
    }

    if (val.length >= currentStep.promptText.length) {
      setStepFinished(true);
      soundEngine.playSuccess();
    }
  };

  const handleNextStep = () => {
    if (!selectedLesson) return;
    if (currentStepIndex + 1 < selectedLesson.steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
      resetStep();
    } else {
      // Calculate overall lesson performance and save progress
      const elapsed = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 10;
      const wpm = Math.round((correctKeystrokes / 5) / (elapsed / 60));
      const accuracy = keystrokes > 0 ? Math.round((correctKeystrokes / keystrokes) * 100) : 100;

      let stars = 1;
      if (accuracy >= 90 && wpm >= 20) stars = 2;
      if (accuracy >= 96 && wpm >= 35) stars = 3;

      const progressData: UserLessonProgress = {
        lessonId: selectedLesson.id,
        completed: true,
        stars,
        bestWpm: wpm,
        bestAccuracy: accuracy
      };

      saveLessonProgress(progressData);
      setProgressMap(getLessonProgress());
      setSelectedLesson(null);
    }
  };

  const categories = Array.from(new Set(TUTORIAL_LESSONS.map(l => l.category)));

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 flex flex-col gap-8">
      {/* Active Lesson View */}
      {selectedLesson && currentStep ? (
        <div id="lesson-interactive-view" className="w-full max-w-4xl mx-auto bg-white/85 border border-[#E5DFD5] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_0_rgba(60,45,30,0.08)] backdrop-blur-2xl flex flex-col gap-6 animate-in fade-in">
          {/* Top Step Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DFD5] pb-4">
            <div>
              <div className="flex items-center gap-2 text-[#DA6A45] font-semibold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-[#DA6A45]" />
                <span>{selectedLesson.title} • Step {currentStepIndex + 1} of {selectedLesson.steps.length}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2C2825] mt-1">
                {currentStep.title}
              </h2>
            </div>

            <button
              onClick={() => setSelectedLesson(null)}
              className="px-3.5 py-1.5 bg-[#F2ECE1] hover:bg-[#EBE3D5] text-[#2C2825] border border-[#E5DFD5] rounded-xl text-xs font-semibold backdrop-blur-md transition-all"
            >
              Exit Lesson
            </button>
          </div>

          {/* Finger Guidance Card */}
          <div className="bg-[#FAF8F5] border border-[#DA6A45]/30 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#DA6A45] shrink-0" />
            <div className="text-xs sm:text-sm text-[#2C2825]">
              <span className="font-bold">Finger Posture Rule: </span>
              <span>{currentStep.fingerGuide}</span>
            </div>
          </div>

          {/* Interactive Lesson Text Box */}
          <div className="relative bg-[#FAF8F5]/90 border border-[#E5DFD5] p-6 rounded-2xl min-h-[140px] flex items-center justify-center font-mono text-xl sm:text-2xl leading-relaxed select-none backdrop-blur-md shadow-inner">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-text"
              autoFocus
            />

            <div className="w-full text-center">
              {currentStep.promptText.split('').map((char, index) => {
                const typed = userInput[index];
                let charStyle = 'text-[#A0988E]';

                if (typed !== undefined) {
                  if (typed === char) {
                    charStyle = 'text-[#DA6A45] font-bold bg-[#DA6A45]/15 rounded-xs shadow-2xs';
                  } else {
                    charStyle = 'text-rose-700 font-bold bg-rose-100 rounded-xs underline decoration-rose-500 shadow-2xs';
                  }
                }

                const isCursor = index === userInput.length;

                return (
                  <span key={index} className={`relative transition-all duration-75 ${charStyle}`}>
                    {isCursor && (
                      <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-[#DA6A45] shadow-[0_0_8px_#DA6A45] animate-pulse rounded-full" />
                    )}
                    {char === ' ' ? ' ' : char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Step Completed Overlay / Next Button */}
          {stepFinished ? (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md shadow-2xs">
              <div className="flex items-center gap-3 text-emerald-900">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-sm">Step Completed Flawlessly!</span>
                  <p className="text-xs text-emerald-700">Ready to advance to the next typing drill?</p>
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 backdrop-blur-md"
              >
                <span>{currentStepIndex + 1 < selectedLesson.steps.length ? 'Next Step' : 'Finish Lesson'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs text-[#78726A] font-mono">
              <span>Type the highlighted text above accurately</span>
              <button onClick={resetStep} className="flex items-center gap-1 hover:text-[#2C2825] transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Step</span>
              </button>
            </div>
          )}

          {/* Interactive Keyboard */}
          <Keyboard
            targetKey={currentStep.promptText[userInput.length] || ''}
            pressedKey={lastPressedKey}
            errorKey={lastErrorKey}
            showFingerGuide={true}
          />
        </div>
      ) : (
        /* Lessons Directory Grid */
        <div className="flex flex-col gap-10">
          {/* Header Title */}
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#2C2825] tracking-tight">
              Interactive Touch Typing Curriculum
            </h2>
            <p className="text-[#78726A] text-sm mt-2">
              Master proper row-by-row finger placement across 18 progressive levels from home row foundations to high-speed drills.
            </p>
          </div>

          {/* Full-Width Interactive 3D Workstation Stage */}
          <div className="w-full">
            <VirtualRetroComputer />
          </div>

          {/* Unified Curriculum Progress Banner */}
          <div className="bg-white/85 border border-[#E5DFD5] rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-col gap-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#DA6A45] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#DA6A45]" />
                  <span>Curriculum Academy</span>
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#DA6A45]/10 text-[#DA6A45] border border-[#DA6A45]/20">
                  18 Comprehensive Levels
                </span>
              </div>
              <h3 className="text-lg font-black text-[#2C2825]">
                From Beginner Basics to Pro Touch Typing
              </h3>
              <p className="text-xs text-[#78726A] leading-relaxed">
                Systematically master muscle memory row-by-row: home row anchoring, top & bottom reaches, shifts, numbers, and programming syntax.
              </p>
            </div>

            {/* Progress Bar & Badges */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5DFD5] flex flex-col gap-2.5 min-w-[280px] sm:min-w-[340px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2C2825] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Curriculum Progress</span>
                </span>
                <span className="font-mono font-bold text-[#DA6A45]">
                  {completedLessons} / {TUTORIAL_LESSONS.length} Completed ({Math.round((completedLessons / TUTORIAL_LESSONS.length) * 100)}%)
                </span>
              </div>

              <div className="w-full h-2.5 bg-[#EBE3D5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#DA6A45] to-[#E59866] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, Math.round((completedLessons / TUTORIAL_LESSONS.length) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#78726A] pt-0.5">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-mono font-bold text-[#2C2825]">{totalStars}</span> / {maxStars} Stars
                </span>
                <span className="flex items-center gap-1 text-[#DA6A45] font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-[#DA6A45]" />
                  <span>Daily Streak Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Curriculum Category Sections */}
          <div className="flex flex-col gap-8">
            {categories.map((cat) => {
              const lessonsInCat = TUTORIAL_LESSONS.filter(l => l.category === cat);

              return (
                <div key={cat} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
                    <h3 className="text-sm font-bold text-[#DA6A45] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#DA6A45]" />
                      <span>{cat} Lessons</span>
                    </h3>
                    <span className="text-xs text-[#78726A] font-medium">
                      {lessonsInCat.filter(l => progressMap[l.id]?.completed).length} of {lessonsInCat.length} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessonsInCat.map((lesson) => {
                      const prog = progressMap[lesson.id];
                      const isCompleted = prog?.completed;

                      return (
                        <div
                          key={lesson.id}
                          id={`lesson-card-${lesson.id}`}
                          className="bg-white/80 border border-[#E5DFD5] hover:border-[#DA6A45]/60 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-[#DA6A45]/10 backdrop-blur-xl group hover:bg-white/95"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-[#DA6A45] bg-[#DA6A45]/10 px-2 py-0.5 rounded-lg border border-[#DA6A45]/20 backdrop-blur-md">
                                Level {lesson.level}
                              </span>
                              {isCompleted && (
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= (prog?.stars || 0)
                                          ? 'text-amber-500 fill-amber-500'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-[#2C2825] group-hover:text-[#DA6A45] transition-colors">
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-[#78726A] leading-relaxed">
                              {lesson.description}
                            </p>

                            <div className="flex flex-wrap gap-1 mt-1">
                              {lesson.targetKeys.map((k) => (
                                <span key={k} className="px-1.5 py-0.5 bg-[#F2ECE1] text-[#2C2825] font-mono text-[10px] rounded-md border border-[#E5DFD5] backdrop-blur-md">
                                  {k.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#E5DFD5]">
                            {isCompleted ? (
                              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{prog.bestWpm} WPM ({prog.bestAccuracy}%)</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[#78726A] font-medium">Not started</span>
                            )}

                            <button
                              onClick={() => startLesson(lesson)}
                              className="px-4 py-1.5 bg-[#DA6A45] hover:bg-[#C85A37] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs shadow-[#DA6A45]/20 backdrop-blur-md cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isCompleted ? 'Replay' : 'Start'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
