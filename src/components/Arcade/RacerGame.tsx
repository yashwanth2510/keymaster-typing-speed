import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RefreshCw, Zap, Award, Flag } from 'lucide-react';
import { COMMON_WORDS } from '../../lib/data';
import { soundEngine } from '../../lib/sound';
import { saveArcadeHighScore, getArcadeHighScores } from '../../lib/storage';

interface Racer {
  id: string;
  name: string;
  color: string;
  progress: number; // 0..100
  isPlayer: boolean;
  speed: number; // units per tick for AI
}

export const RacerGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'racing' | 'finished'>('menu');
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [typedInput, setTypedInput] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(() => getArcadeHighScores()['racer'] || 0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRace = () => {
    // Pick 20 words for the drag strip
    const shuffled = [...COMMON_WORDS].sort(() => Math.random() - 0.5).slice(0, 20);
    setTargetWords(shuffled);
    setWordIndex(0);
    setTypedInput('');
    setRank(null);

    const initialRacers: Racer[] = [
      { id: 'player', name: 'YOU (Nitro)', color: 'bg-indigo-500 text-indigo-200', progress: 0, isPlayer: true, speed: 0 },
      { id: 'ai1', name: 'Bot Novice (30 WPM)', color: 'bg-emerald-500 text-emerald-200', progress: 0, isPlayer: false, speed: 0.18 },
      { id: 'ai2', name: 'Bot Pro (50 WPM)', color: 'bg-amber-500 text-amber-200', progress: 0, isPlayer: false, speed: 0.28 },
      { id: 'ai3', name: 'Bot Lightning (75 WPM)', color: 'bg-rose-500 text-rose-200', progress: 0, isPlayer: false, speed: 0.42 }
    ];

    setRacers(initialRacers);
    setGameState('racing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // AI Drivers Loop
  useEffect(() => {
    if (gameState !== 'racing') return;

    timerRef.current = setInterval(() => {
      setRacers((prev) => {
        let finishedCount = 0;
        const updated = prev.map((r) => {
          if (r.isPlayer) return r;
          const nextProg = Math.min(100, r.progress + r.speed);
          if (nextProg >= 100) finishedCount++;
          return { ...r, progress: nextProg };
        });

        return updated;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'racing') return;

    const val = e.target.value.toLowerCase().trim();
    setTypedInput(val);

    const currentWord = targetWords[wordIndex]?.toLowerCase();

    if (val === currentWord) {
      soundEngine.playKeyPress();
      const nextWordIdx = wordIndex + 1;
      setWordIndex(nextWordIdx);
      setTypedInput('');

      // Advance player car
      const newPlayerProg = Math.min(100, (nextWordIdx / targetWords.length) * 100);

      setRacers((prev) =>
        prev.map((r) => (r.isPlayer ? { ...r, progress: newPlayerProg } : r))
      );

      // Check if player crossed finish line
      if (newPlayerProg >= 100) {
        soundEngine.playSuccess();
        setGameState('finished');

        // Calculate final rank
        const playerRank = racers.filter((r) => !r.isPlayer && r.progress >= 100).length + 1;
        setRank(playerRank);

        const score = Math.max(10, (5 - playerRank) * 100);
        saveArcadeHighScore('racer', score);
        if (score > highScore) setHighScore(score);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 flex flex-col gap-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white/80 border border-slate-200/80 px-6 py-3 rounded-2xl shadow-sm backdrop-blur-md">
        <button onClick={onBack} className="text-xs text-slate-600 hover:text-slate-900 font-semibold">
          ← Back to Games
        </button>
        <span className="text-sm font-bold text-indigo-700">Speed Racer Typing Drag</span>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-700 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>High Score: {highScore} Pts</span>
        </div>
      </div>

      {/* Main Race Arena */}
      <div className="w-full bg-gradient-to-b from-[#FAF8F5] via-[#F2ECE1] to-[#E5DFD5] border-2 border-[#E5DFD5] rounded-3xl p-6 shadow-xl flex flex-col gap-6">
        {gameState === 'menu' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] shadow-sm">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-[#2C2825]">Speed Racer Drag</h2>
            <p className="text-xs text-[#78726A] max-w-sm">
              Type words as fast as possible to accelerate your sports car against 3 AI drivers!
            </p>
            <button
              onClick={startRace}
              className="px-8 py-3 bg-[#DA6A45] hover:bg-[#C85A37] text-white font-bold rounded-2xl shadow-lg shadow-[#DA6A45]/25 text-sm transition-all"
            >
              Start Drag Race
            </button>
          </div>
        )}

        {(gameState === 'racing' || gameState === 'finished') && (
          <div className="flex flex-col gap-6">
            {/* Race Tracks View */}
            <div className="flex flex-col gap-3 bg-white/80 p-4 rounded-2xl border border-[#E5DFD5] backdrop-blur-md shadow-2xs">
              {racers.map((racer) => (
                <div key={racer.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-mono text-[#2C2825]">
                    <span className="font-bold">{racer.name}</span>
                    <span className="text-[#78726A]">{Math.round(racer.progress)}%</span>
                  </div>

                  <div className="relative w-full h-8 bg-[#FAF8F5] rounded-xl border border-[#E5DFD5] overflow-hidden flex items-center px-2">
                    {/* Finish Line */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-amber-500/30 border-l border-dashed border-amber-500 flex items-center justify-center text-[10px]">
                      <Flag className="w-3 h-3 text-amber-600" />
                    </div>

                    {/* Vehicle */}
                    <div
                      style={{ left: `${Math.min(racer.progress, 92)}%` }}
                      className={`absolute transition-[left] duration-100 ease-linear px-2 py-0.5 rounded-lg text-xs font-bold font-mono shadow-md ${racer.color}`}
                    >
                      🏎️
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Typing Box */}
            {gameState === 'racing' && (
              <div className="bg-white/90 border border-[#E5DFD5] p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xs">
                <div className="flex items-center gap-2 text-xl sm:text-2xl font-mono font-bold text-[#2C2825]">
                  <span className="text-[#DA6A45]">{targetWords[wordIndex]}</span>
                  <span className="text-[#78726A] text-sm ml-2">({wordIndex + 1} / {targetWords.length})</span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={handleInputChange}
                  placeholder="Type current word to accelerate..."
                  className="w-full max-w-md bg-white border-2 border-[#DA6A45] rounded-xl px-4 py-2 text-center text-sm font-mono text-[#2C2825] focus:outline-none shadow-md"
                  autoFocus
                />
              </div>
            )}

            {/* Finish Overlay */}
            {gameState === 'finished' && (
              <div className="py-8 bg-white/90 border border-[#E5DFD5] rounded-2xl flex flex-col items-center gap-4 text-center shadow-md">
                <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
                <h3 className="text-2xl font-black text-[#2C2825]">
                  Race Finished! You placed #{rank}!
                </h3>
                <button
                  onClick={startRace}
                  className="px-6 py-2.5 bg-[#DA6A45] hover:bg-[#C85A37] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Race Again</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
