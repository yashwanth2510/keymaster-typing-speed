import React, { useState, useEffect, useRef } from 'react';
import { Blocks, RotateCcw, Award, Heart, Bomb, Sparkles, BrickWall } from 'lucide-react';
import { COMMON_WORDS } from '../../lib/data';
import { soundEngine } from '../../lib/sound';
import { saveArcadeHighScore, getArcadeHighScores } from '../../lib/storage';

interface Brick {
  id: string;
  word: string;
  col: number;
  row: number;
  type: 'normal' | 'gold' | 'bomb';
}

const COLS = 6;
const WAVE_ROWS = (wave: number) => Math.min(3 + wave, 6);
const SINK_START = 9;

export const BrickGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [typedInput, setTypedInput] = useState('');
  const [sink, setSink] = useState(SINK_START);
  const [highScore, setHighScore] = useState(() => getArcadeHighScores()['brick'] || 0);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const bricksRef = useRef(bricks);
  bricksRef.current = bricks;
  const sinkRef = useRef(sink);
  sinkRef.current = sink;

  const buildWave = (w: number): Brick[] => {
    const rows = WAVE_ROWS(w);
    const words = [...COMMON_WORDS].sort(() => Math.random() - 0.5);
    const built: Brick[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        const roll = Math.random();
        const type: Brick['type'] = roll < 0.1 ? 'bomb' : roll < 0.3 ? 'gold' : 'normal';
        built.push({
          id: `b_${w}_${row}_${col}_${Math.random()}`,
          word: words[(row * COLS + col) % words.length],
          row,
          col,
          type
        });
      }
    }
    return built;
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setWave(1);
    setBricks(buildWave(1));
    setTypedInput('');
    setSink(SINK_START);
    setGameState('playing');
    lastTimeRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Game loop: sink the brick wall downward
  useEffect(() => {
    if (gameState !== 'playing') return;

    lastTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const currentWave = waveRef.current;
      const speed = 2.5 + currentWave * 1.3 + (currentWave >= 4 ? (currentWave - 3) * 0.9 : 0);

      const nextSink = sinkRef.current + speed * delta;
      const lowestRow = bricksRef.current.reduce((max, b) => Math.max(max, b.row), 0);
      if (nextSink + lowestRow * 10 >= 88) {
        // Wall reached the typing line
        soundEngine.playExplosion();
        setLives((l) => {
          const updated = l - 1;
          if (updated <= 0) {
            setGameState('gameover');
          } else {
            // Rebuild a fresh (slightly harder) wave
            const nextWave = waveRef.current + 1;
            setWave(nextWave);
            setBricks(buildWave(nextWave));
          }
          return updated;
        });
        setSink(SINK_START);
      } else {
        setSink(nextSink);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Save high score on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      saveArcadeHighScore('brick', score);
      if (score > highScore) setHighScore(score);
    }
  }, [gameState, score, highScore]);

  const smashBrick = (b: Brick) => {
    if (b.type === 'bomb') {
      setBricks([]);
      setScore((s) => s + 50);
    } else if (b.type === 'gold') {
      setScore((s) => s + 25);
    } else {
      setScore((s) => s + 10);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setTypedInput(val);
    soundEngine.playKeyPress();

    const matched = bricksRef.current.find((b) => b.word.toLowerCase() === val);
    if (matched) {
      soundEngine.playExplosion();
      smashBrick(matched);
      setBricks((prev) => prev.filter((x) => x.id !== matched.id));

      const remaining = bricksRef.current.filter((x) => x.id !== matched.id);
      if (remaining.length === 0) {
        // Wall destroyed — advance to the next wave
        const nextWave = waveRef.current + 1;
        setWave(nextWave);
        setBricks(buildWave(nextWave));
        setSink(SINK_START);
        setScore((s) => s + 40);
        soundEngine.playSuccess();
      }
      setTypedInput('');
    }
  };

  const brickLeft = (b: Brick) => b.col * (100 / COLS) + 2;
  const brickWidth = 100 / COLS - 3;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 flex flex-col gap-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between bg-white/80 border border-[#E5DFD5] px-6 py-3 rounded-2xl shadow-2xs backdrop-blur-md">
        <button onClick={onBack} className="text-xs text-[#78726A] hover:text-[#2C2825] font-semibold transition-colors">
          ← Back to Games
        </button>
        <span className="text-sm font-bold text-[#2C2825]">Word Bricks Typing Demolition</span>
        <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>High Score: {highScore} Pts</span>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div id="brick-game-canvas" className="relative w-full h-[520px] bg-gradient-to-b from-[#FAF8F5] via-[#F2ECE1] to-[#E5DFD5] border-2 border-[#E5DFD5] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4">
        {/* Warm brick-dust pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#DA6A45_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        {/* HUD */}
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
              Wall {wave}
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] shadow-sm">
              <Blocks className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-[#2C2825]">Word Bricks</h2>
            <p className="text-xs text-[#78726A] max-w-sm">
              A wall of word-bricks sinks toward you! Type each word to smash it. Clear the whole wall to raise a new, denser one before it reaches your typing line!
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
            {/* Typing line */}
            <div className="absolute left-0 right-0 bottom-3 h-1 bg-[#DA6A45]/30 border-t border-dashed border-[#DA6A45]/40" />

            {/* Bricks */}
            {bricks.map((b) => {
              const isTypedMatch = typedInput && b.word.toLowerCase().startsWith(typedInput);

              let brickClass = 'bg-[#DA6A45] border-[#C85A37] text-white shadow-md';
              if (b.type === 'bomb') brickClass = 'bg-rose-500 border-rose-700 text-white shadow-md';
              if (b.type === 'gold') brickClass = 'bg-amber-500 border-amber-700 text-white shadow-md';

              return (
                <div
                  key={b.id}
                  style={{
                    left: `${brickLeft(b)}%`,
                    top: `calc(${sink + b.row * 10}% - 12px)`,
                    width: `${brickWidth}%`
                  }}
                  className={`absolute flex items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-xs font-mono font-bold transition-transform duration-75 will-change-transform ${brickClass} ${isTypedMatch ? 'scale-105 ring-2 ring-[#2C2825]' : ''}`}
                >
                  {b.type === 'bomb' ? <Bomb className="w-4 h-4 shrink-0" /> : b.type === 'gold' ? <Sparkles className="w-4 h-4 shrink-0" /> : <BrickWall className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{b.word}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center text-center gap-4 p-6 bg-white/90 backdrop-blur-md rounded-2xl">
            <h2 className="text-3xl font-extrabold text-rose-600">The Wall Won!</h2>
            <div className="flex flex-col items-center gap-1 font-mono">
              <span className="text-4xl font-black text-[#2C2825]">{score} Pts</span>
              <span className="text-xs text-[#78726A]">Knocked Down Wall {wave}</span>
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
              placeholder="Type word to smash a brick..."
              className="w-full bg-white border-2 border-[#DA6A45] rounded-2xl px-4 py-2.5 text-center font-mono text-sm text-[#2C2825] focus:outline-none shadow-lg shadow-[#DA6A45]/15"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};