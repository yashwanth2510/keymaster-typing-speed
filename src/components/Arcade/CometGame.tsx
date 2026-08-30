import React, { useState, useEffect, useRef } from 'react';
import { Rocket, RotateCcw, Award, Heart } from 'lucide-react';
import { COMMON_WORDS } from '../../lib/data';
import { soundEngine } from '../../lib/sound';
import { saveArcadeHighScore, getArcadeHighScores } from '../../lib/storage';

interface Comet {
  id: string;
  word: string;
  y: number; // percentage 12..88
  x: number; // percentage, starts at 112 and drifts to -12
  speed: number; // percent per second
  bob: number; // vertical bob amplitude in px
  bobSpeed: number;
  type: 'normal' | 'gold' | 'bomb';
}

interface Missile {
  id: string;
  startX: number;
  targetX: number;
  targetY: number;
}

const idSeed = (id: string) =>
  id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const CometGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [typedInput, setTypedInput] = useState('');
  const [comets, setComets] = useState<Comet[]>([]);
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [highScore, setHighScore] = useState(() => getArcadeHighScores()['comet'] || 0);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const cometsRef = useRef(comets);
  cometsRef.current = comets;

  const startGame = () => {
    setScore(0);
    setLives(3);
    setWave(1);
    setComets([]);
    setMissiles([]);
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

      // Spawn comets faster with each wave
      const spawnInterval = Math.max(600, 1800 - currentWave * 140);
      if (now - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = now;
        const word = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
        const roll = Math.random();
        const type: Comet['type'] = roll < 0.15 ? 'bomb' : roll < 0.35 ? 'gold' : 'normal';

        const newComet: Comet = {
          id: `c_${now}_${Math.random()}`,
          word,
          y: 12 + Math.random() * 76,
          x: 112,
          speed: 9 + currentWave * 2 + Math.random() * 4,
          bob: 3 + Math.random() * 6,
          bobSpeed: 0.6 + Math.random() * 0.8,
          type
        };
        setComets((prev) => (prev.length >= 8 ? prev : [...prev, newComet]));
      }

      // Move comets leftward
      setComets((prev) => {
        if (prev.length === 0) return prev;
        const next: Comet[] = [];
        let lostLife = false;

        for (const c of prev) {
          const nextX = c.x - c.speed * delta;
          if (nextX <= -12) {
            lostLife = true;
            soundEngine.playExplosion();
          } else {
            next.push({ ...c, x: nextX });
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

      // Bump wave every 100 pts
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
      saveArcadeHighScore('comet', score);
      if (score > highScore) setHighScore(score);
    }
  }, [gameState, score, highScore]);

  const shootComet = (c: Comet) => {
    const missileId = `s_${Date.now()}_${Math.random()}`;
    setMissiles((prev) => [...prev, { id: missileId, startX: 6, targetX: c.x, targetY: c.y }]);
    setTimeout(() => setMissiles((prev) => prev.filter((m) => m.id !== missileId)), 350);

    if (c.type === 'bomb') {
      setComets([]);
      setScore((s) => s + 50);
    } else if (c.type === 'gold') {
      setScore((s) => s + 25);
    } else {
      setScore((s) => s + 10);
    }
    setComets((prev) => prev.filter((x) => x.id !== c.id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setTypedInput(val);
    soundEngine.playKeyPress();

    const matched = cometsRef.current.find((c) => c.word.toLowerCase() === val);
    if (matched) {
      soundEngine.playExplosion();
      shootComet(matched);
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
        <span className="text-sm font-bold text-[#2C2825]">Solar Drift Comet Rush</span>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>High Score: {highScore}</span>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div id="comet-game-canvas" className="relative w-full h-[520px] bg-gradient-to-b from-[#2C2A40] via-[#4A3F5A] to-[#2C2825] border-2 border-[#E5DFD5] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4">
        {/* Star field pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#F3C096_1px,transparent_1px)] [background-size:22px_22px] opacity-15" />

        {/* HUD */}
        {gameState === 'playing' && (
          <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-white/90 border border-[#E5DFD5] rounded-2xl backdrop-blur-md shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#78726A]">Shields:</span>
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
              Sector {wave}
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6 bg-white/80 backdrop-blur-md rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] shadow-sm">
              <Rocket className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-[#2C2825]">Solar Drift</h2>
            <p className="text-xs text-[#78726A] max-w-sm">
              Word-sol comets streak across deep space toward your ship. Type their words to fire missiles and blast them out of the solar system!
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
            {/* Missiles */}
            {missiles.map((m) => (
              <svg key={m.id} className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <line
                  x1={`${m.startX}%`}
                  y1="50%"
                  x2={`${m.targetX}%`}
                  y2={`${m.targetY}%`}
                  stroke="#DA6A45"
                  strokeWidth="3"
                  className="animate-pulse"
                />
                <circle cx={`${m.targetX}%`} cy={`${m.targetY}%`} r="10" fill="none" stroke="#DA6A45" strokeWidth="2" className="animate-ping" />
              </svg>
            ))}

            {/* Player ship at left */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 text-3xl">🚀</div>

            {/* Comets */}
            {comets.map((c) => {
              const isTypedMatch = typedInput && c.word.toLowerCase().startsWith(typedInput);
              const now = performance.now();
              const bobPx = c.bob * Math.sin((now / 1000) * c.bobSpeed + idSeed(c.id));

              let badgeClass = 'bg-white border-[#F3C096] text-[#2C2825] shadow-lg';
              if (c.type === 'bomb') badgeClass = 'bg-rose-50 border-rose-500 text-rose-900 shadow-lg';
              if (c.type === 'gold') badgeClass = 'bg-amber-50 border-amber-500 text-amber-900 shadow-lg';

              return (
                <div
                  key={c.id}
                  style={{
                    left: `${c.x}%`,
                    top: `calc(${c.y}% + ${bobPx}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="absolute flex flex-col items-center gap-0.5 z-10 will-change-transform"
                >
                  <div className={`text-xl drop-shadow-lg opacity-80 ${c.type === 'bomb' ? ' text-rose-300' : c.type === 'gold' ? ' text-amber-300' : ' text-[#F3C096]'}`}>
                    {c.type === 'bomb' ? '☄️' : c.type === 'gold' ? '✨' : '💫'}
                  </div>
                  <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold ${badgeClass} ${isTypedMatch ? 'scale-110 ring-2 ring-[#DA6A45]' : ''}`}>
                    {c.word}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6 bg-white/90 backdrop-blur-md rounded-2xl">
            <h2 className="text-3xl font-extrabold text-rose-600">Ship Overwhelmed!</h2>
            <div className="flex flex-col items-center gap-1 font-mono">
              <span className="text-4xl font-black text-[#2C2825]">{score} Pts</span>
              <span className="text-xs text-[#78726A]">Cleared through Sector {wave}</span>
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
              placeholder="Type word to fire a missile..."
              className="w-full bg-white border-2 border-[#DA6A45] rounded-2xl px-4 py-2.5 text-center font-mono text-sm text-[#2C2825] focus:outline-none shadow-lg shadow-[#DA6A45]/15"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};