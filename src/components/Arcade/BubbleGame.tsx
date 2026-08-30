import React, { useState, useEffect, useRef } from 'react';
import { Droplet, RotateCcw, Award, Heart } from 'lucide-react';
import { COMMON_WORDS } from '../../lib/data';
import { soundEngine } from '../../lib/sound';
import { saveArcadeHighScore, getArcadeHighScores } from '../../lib/storage';

interface Bubble {
  id: string;
  word: string;
  x: number; // percentage 10..90
  y: number; // percentage, starts at 110 (below canvas) and rises to 0
  speed: number; // percent per second
  sway: number; // horizontal sway amplitude in px
  swaySpeed: number;
  type: 'normal' | 'gold' | 'bomb';
}

interface PopRing {
  id: string;
  x: number;
  y: number;
}

const idSeed = (id: string) =>
  id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const BubbleGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [typedInput, setTypedInput] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [rings, setRings] = useState<PopRing[]>([]);
  const [highScore, setHighScore] = useState(() => getArcadeHighScores()['bubble'] || 0);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const bubblesRef = useRef(bubbles);
  bubblesRef.current = bubbles;

  const startGame = () => {
    setScore(0);
    setLives(3);
    setWave(1);
    setBubbles([]);
    setRings([]);
    setTypedInput('');
    setGameState('playing');
    lastSpawnTime.current = Date.now();
    lastTimeRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Game loop with delta-time
  useEffect(() => {
    if (gameState !== 'playing') return;

    lastTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const now = Date.now();
      const currentWave = waveRef.current;

      // Spawn bubbles faster with each wave
      const spawnInterval = Math.max(650, 1900 - currentWave * 150);
      if (now - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = now;
        const word = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
        const roll = Math.random();
        const type: Bubble['type'] = roll < 0.15 ? 'bomb' : roll < 0.35 ? 'gold' : 'normal';

        const newBubble: Bubble = {
          id: `b_${now}_${Math.random()}`,
          word,
          x: 10 + Math.random() * 80,
          y: 110,
          speed: 5 + currentWave * 1.2 + Math.random() * 3,
          sway: 4 + Math.random() * 8,
          swaySpeed: 0.5 + Math.random() * 0.9,
          type
        };
        setBubbles((prev) => (prev.length >= 9 ? prev : [...prev, newBubble]));
      }

      // Move bubbles upward
      setBubbles((prev) => {
        if (prev.length === 0) return prev;
        const next: Bubble[] = [];
        let lostLife = false;

        for (const b of prev) {
          const nextY = b.y - b.speed * delta;
          if (nextY <= 1) {
            lostLife = true;
            soundEngine.playExplosion();
          } else {
            next.push({ ...b, y: nextY });
          }
        }

        if (lostLife) {
          setLives((l) => {
            const updated = l - 1;
            if (updated <= 0) setGameState('gameover');
            return updated;
          });
        }

        return next;
      });

      const calculatedWave = Math.floor(scoreRef.current / 100) + 1;
      if (calculatedWave !== waveRef.current) {
        setWave(calculatedWave);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  // Save high score on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      saveArcadeHighScore('bubble', score);
      if (score > highScore) setHighScore(score);
    }
  }, [gameState, score, highScore]);

  const popBubble = (b: Bubble) => {
    setRings((prev) => [...prev, { id: `r_${Date.now()}_${Math.random()}`, x: b.x, y: b.y }]);
    setTimeout(() => setRings((prev) => prev.slice(1)), 450);

    if (b.type === 'bomb') {
      setBubbles([]);
      setScore((s) => s + 50);
    } else if (b.type === 'gold') {
      setScore((s) => s + 25);
    } else {
      setScore((s) => s + 10);
    }
    setBubbles((prev) => prev.filter((x) => x.id !== b.id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setTypedInput(val);
    soundEngine.playKeyPress();

    const matched = bubblesRef.current.find((b) => b.word.toLowerCase() === val);
    if (matched) {
      soundEngine.playExplosion();
      popBubble(matched);
      setTypedInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 flex flex-col gap-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between bg-white/80 border border-[#E5DFD5] px-6 py-3 rounded-2xl shadow-2xs backdrop-blur-md">
        <button onClick={onBack} className="text-xs text-[#78726A] hover:text-[#2C2825] font-semibold transition-colors">
          ← Back to Games
        </button>
        <span className="text-sm font-bold text-[#2C2825]">Bubble Pop Word Unravel</span>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>High Score: {highScore}</span>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div id="bubble-game-canvas" className="relative w-full h-[520px] bg-gradient-to-b from-[#E8F4F8] via-[#F2ECE1] to-[#FAF8F5] border-2 border-[#E5DFD5] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4">
        {/* Water ripple pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#7FB2C5_1px,transparent_1px)] [background-size:26px_26px] opacity-10" />

        {/* HUD */}
        {gameState === 'playing' && (
          <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-white/80 border border-[#E5DFD5] rounded-2xl backdrop-blur-md shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#78726A]">Lives:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: lives }).map((_, i) => (
                  <Heart key={i} className="w-4 h-4 text-rose-500 fill-rose-500" />
                ))}
              </div>
            </div>

            <div className="text-center font-mono">
              <span className="text-xl font-extrabold text-[#DA6A45]">{score}</span>
              <span className="text-[10px] text-[#78726A] uppercase ml-1">Pts</span>
            </div>

            <div className="text-xs font-mono text-[#DA6A45] bg-[#DA6A45]/10 border border-[#DA6A45]/20 px-3 py-1 rounded-full">
              Depth {wave}
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#7FB2C5]/10 border border-[#7FB2C5]/30 flex items-center justify-center text-[#7FB2C5] shadow-sm">
              <Droplet className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-[#2C2825]">Bubble Pop</h2>
            <p className="text-xs text-[#78726A] max-w-sm">
              Words float up from the deep like bubbles. Type each word to pop the bubble before it escapes to the surface!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-[#DA6A45] hover:bg-[#C85A37] text-white font-bold rounded-2xl shadow-lg shadow-[#DA6A45]/25 text-sm transition-all"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Playing Canvas */}
        {gameState === 'playing' && (
          <div className="relative z-10 flex-1 w-full overflow-hidden">
            {/* Pop rings */}
            {rings.map((ring) => (
              <div
                key={ring.id}
                style={{ left: `${ring.x}%`, top: `${ring.y}%` }}
                className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7FB2C5] animate-ping pointer-events-none z-20"
              />
            ))}

            {/* Bubbles */}
            {bubbles.map((b) => {
              const isTypedMatch = typedInput && b.word.toLowerCase().startsWith(typedInput);
              const now = performance.now();
              const swayPx = b.sway * Math.sin((now / 1000) * b.swaySpeed + idSeed(b.id));

              let bubbleClass = 'border-[#7FB2C5] bg-white text-[#2C2825] shadow-md';
              if (b.type === 'bomb') bubbleClass = 'border-rose-500 bg-rose-50 text-rose-900 shadow-md';
              if (b.type === 'gold') bubbleClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md';

              return (
                <div
                  key={b.id}
                  style={{
                    left: `calc(${b.x}% + ${swayPx}px)`,
                    top: `${b.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute flex flex-col items-center gap-0.5 z-10 will-change-transform"
                >
                  <div className={`px-3 py-1.5 rounded-2xl border-2 text-xs font-mono font-bold ${bubbleClass} ${isTypedMatch ? 'scale-110 ring-2 ring-[#DA6A45]' : ''}`}>
                    {b.word}
                  </div>
                  {b.type !== 'normal' && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-white border border-[#E5DFD5] rounded text-[#78726A]">
                      {b.type === 'bomb' ? 'BOOM' : '+25'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6 bg-white/90 backdrop-blur-md rounded-2xl">
            <h2 className="text-3xl font-extrabold text-rose-600">The Bubbles Escaped!</h2>
            <div className="flex flex-col items-center gap-1 font-mono">
              <span className="text-4xl font-black text-[#2C2825]">{score} Pts</span>
              <span className="text-xs text-[#78726A]">Reached Depth {wave}</span>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-[#DA6A45] hover:bg-[#C85A37] text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}

        {/* Bottom Input */}
        {gameState === 'playing' && (
          <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={handleInputChange}
              placeholder="Type word to pop the bubble..."
              className="w-full bg-white border-2 border-[#7FB2C5] rounded-2xl px-4 py-2.5 text-center font-mono text-sm text-[#2C2825] focus:outline-none shadow-lg"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};