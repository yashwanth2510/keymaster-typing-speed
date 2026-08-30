import React, { useState, useEffect, useRef } from 'react';
import { Shield, Flame, RotateCcw, Award, Zap, Heart, Meteor, Bomb, Timer } from 'lucide-react';
import { COMMON_WORDS } from '../../lib/data';
import { soundEngine } from '../../lib/sound';
import { saveArcadeHighScore, getArcadeHighScores } from '../../lib/storage';

interface Meteor {
  id: string;
  word: string;
  x: number; // percentage 10..90
  y: number; // percentage 0..100
  speed: number;
  type: 'normal' | 'bomb' | 'shield' | 'slow';
}

export const MeteorGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [typedInput, setTypedInput] = useState('');
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [highScore, setHighScore] = useState(() => getArcadeHighScores()['meteor'] || 0);
  const [lasers, setLasers] = useState<{ id: string; startX: number; targetX: number; targetY: number }[]>([]);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep refs in sync for smooth game loop without re-triggering effect
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const meteorsRef = useRef(meteors);
  meteorsRef.current = meteors;

  const startGame = () => {
    setScore(0);
    setLives(3);
    setWave(1);
    setMeteors([]);
    setTypedInput('');
    setGameState('playing');
    lastSpawnTime.current = Date.now();
    lastTimeRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Optimized Game Loop using Delta-Time and Refs
  useEffect(() => {
    if (gameState !== 'playing') return;

    lastTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // cap max delta at 100ms
      lastTimeRef.current = timestamp;

      const now = Date.now();
      const currentWave = waveRef.current;

      // Spawn meteors periodically based on wave level
      const spawnInterval = Math.max(1000, 2800 - currentWave * 250);
      if (now - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = now;
        const randomWord = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
        const types: Meteor['type'][] = ['normal', 'normal', 'normal', 'bomb', 'shield', 'slow'];
        const mType = Math.random() < 0.25 ? types[Math.floor(Math.random() * types.length)] : 'normal';

        const newMeteor: Meteor = {
          id: `m_${now}_${Math.random()}`,
          word: randomWord,
          x: 10 + Math.random() * 80,
          y: 0,
          speed: 8 + currentWave * 2 + Math.random() * 3, // percent per second
          type: mType
        };
        setMeteors((prev) => [...prev, newMeteor]);
      }

      // Move meteors down based on delta time
      setMeteors((prevMeteors) => {
        if (prevMeteors.length === 0) return prevMeteors;
        const nextMeteors: Meteor[] = [];
        let lostLife = false;

        for (const m of prevMeteors) {
          const nextY = m.y + m.speed * delta;
          if (nextY >= 88) {
            lostLife = true;
            soundEngine.playExplosion();
          } else {
            nextMeteors.push({ ...m, y: nextY });
          }
        }

        if (lostLife) {
          setLives((l) => {
            const updated = l - 1;
            if (updated <= 0) {
              setGameState('gameover');
            }
            return updated;
          });
        }

        return nextMeteors;
      });

      // Update wave only when changed
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

  // Handle Game Over high score save
  useEffect(() => {
    if (gameState === 'gameover') {
      saveArcadeHighScore('meteor', score);
      if (score > highScore) setHighScore(score);
    }
  }, [gameState, score, highScore]);

  // Handle typing target word matching
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setTypedInput(val);

    soundEngine.playKeyPress();

    // Find if typed word matches any active meteor
    const matchedMeteor = meteors.find((m) => m.word.toLowerCase() === val);

    if (matchedMeteor) {
      soundEngine.playExplosion();

      // Add laser beam animation
      const laserId = `l_${Date.now()}`;
      setLasers((prev) => [...prev, { id: laserId, startX: 50, targetX: matchedMeteor.x, targetY: matchedMeteor.y }]);
      setTimeout(() => {
        setLasers((prev) => prev.filter((l) => l.id !== laserId));
      }, 300);

      // Handle power-up effects
      if (matchedMeteor.type === 'bomb') {
        setMeteors([]); // Clear all
        setScore((s) => s + 50);
      } else if (matchedMeteor.type === 'shield') {
        setLives((l) => Math.min(5, l + 1));
        setScore((s) => s + 20);
      } else {
        setScore((s) => s + 10);
      }

      setMeteors((prev) => prev.filter((m) => m.id !== matchedMeteor.id));
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
        <span className="text-sm font-bold text-[#2C2825]">Meteor Storm Word Defense</span>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>High Score: {highScore}</span>
        </div>
      </div>

      {/* Main Game Screen */}
      <div id="meteor-game-canvas" className="relative w-full h-[520px] bg-gradient-to-b from-[#FAF8F5] via-[#F2ECE1] to-[#E5DFD5] border-2 border-[#E5DFD5] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4">
        {/* Warm Radial Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#DA6A45_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        {/* HUD Overlay */}
        {gameState === 'playing' && (
          <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-white/80 border border-[#E5DFD5] rounded-2xl backdrop-blur-md shadow-2xs">
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
              Wave {wave}
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] shadow-sm">
              <Flame className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-[#2C2825]">Meteor Storm</h2>
            <p className="text-xs text-[#78726A] max-w-sm">
              Space meteors are crashing into the planet! Type the words on incoming meteors to blast them before impact!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-[#DA6A45] hover:bg-[#C85A37] text-white font-bold rounded-2xl shadow-lg shadow-[#DA6A45]/25 text-sm transition-all"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Playing Canvas Meteors & Lasers */}
        {gameState === 'playing' && (
          <div className="relative z-10 flex-1 w-full overflow-hidden">
            {/* Lasers */}
            {lasers.map((l) => (
              <svg key={l.id} className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <line
                  x1={`${l.startX}%`}
                  y1="95%"
                  x2={`${l.targetX}%`}
                  y2={`${l.targetY}%`}
                  stroke="#DA6A45"
                  strokeWidth="3"
                  strokeDasharray="4"
                  className="animate-pulse"
                />
              </svg>
            ))}

            {/* Meteors */}
            {meteors.map((m) => {
              const isTypedMatch = typedInput && m.word.toLowerCase().startsWith(typedInput);

              let badgeColor = 'bg-white border-[#DA6A45] text-[#2C2825] shadow-md';
              if (m.type === 'bomb') badgeColor = 'bg-rose-50 border-rose-500 text-rose-900 shadow-md';
              if (m.type === 'shield') badgeColor = 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md';

              return (
                <div
                  key={m.id}
                  style={{
                    transform: `translate3d(-50%, 0, 0)`,
                    left: `${m.x}%`,
                    top: `${m.y}%`
                  }}
                  className="absolute flex flex-col items-center gap-1 z-10 will-change-transform"
                >
                  <div className={`drop-shadow opacity-90 ${m.type === 'bomb' ? 'text-rose-500' : m.type === 'shield' ? 'text-emerald-600' : m.type === 'slow' ? 'text-sky-600' : 'text-[#DA6A45]'}`}>
                    {m.type === 'bomb' ? <Bomb className="w-5 h-5" /> : m.type === 'shield' ? <Shield className="w-5 h-5" /> : m.type === 'slow' ? <Timer className="w-5 h-5" /> : <Meteor className="w-5 h-5" />}
                  </div>
                  <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold ${badgeColor} ${isTypedMatch ? 'scale-110 ring-2 ring-[#DA6A45]' : ''}`}>
                    {m.word}
                  </div>
                  {m.type !== 'normal' && (
                    <span className="text-[9px] uppercase tracking-widest font-sans px-1.5 py-0.2 bg-white border border-[#E5DFD5] rounded text-[#78726A]">
                      {m.type}
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
            <h2 className="text-3xl font-extrabold text-rose-600">Shields Destroyed!</h2>
            <div className="flex flex-col items-center gap-1 font-mono">
              <span className="text-4xl font-black text-[#2C2825]">{score} Pts</span>
              <span className="text-xs text-[#78726A]">Reached Wave {wave}</span>
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

        {/* Bottom Laser Cannon & Input */}
        {gameState === 'playing' && (
          <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={handleInputChange}
              placeholder="Type word to destroy meteor..."
              className="w-full bg-white border-2 border-[#DA6A45] rounded-2xl px-4 py-2.5 text-center font-mono text-sm text-[#2C2825] focus:outline-none shadow-lg shadow-[#DA6A45]/15"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};
