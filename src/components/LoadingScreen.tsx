import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard as KeyboardIcon } from 'lucide-react';
import { soundEngine } from '../lib/sound';

interface LoadingScreenProps {
  onFinished?: () => void;
}

// Mini keyboard rows to represent physical key presses during the load animation
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const TARGET_PHRASE = 'KEYMASTER';

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinished }) => {
  const [typedText, setTypedText] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initializing switches...');
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const totalChars = TARGET_PHRASE.length;

    // Sequence timing for character typing
    const timer = setInterval(() => {
      if (index < totalChars) {
        const currentChar = TARGET_PHRASE[index];
        setTypedText(prev => prev + currentChar);
        setActiveKey(currentChar);
        
        // Play key press sound
        soundEngine.playKeyPress(currentChar);

        // Update progress & dynamic status text
        const currentProgress = Math.round(((index + 1) / totalChars) * 85);
        setProgress(currentProgress);

        if (index === 2) setStatusMessage('Calibrating touch sensors...');
        if (index === 5) setStatusMessage('Loading Key Master themes & soundscapes...');

        // Briefly release key press highlight
        setTimeout(() => setActiveKey(null), 120);

        index++;
      } else {
        clearInterval(timer);
        
        // Final completion stage
        setActiveKey('SPACE');
        soundEngine.playKeyPress(' ');
        setTimeout(() => setActiveKey(null), 150);

        setProgress(100);
        setStatusMessage('Engine Ready!');
        setIsDone(true);

        // Delay before fading out
        setTimeout(() => {
          if (onFinished) onFinished();
        }, 400);
      }
    }, 180); // ~180ms per character typing rhythm

    return () => clearInterval(timer);
  }, [onFinished]);

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-[#2C2825] overflow-hidden select-none"
      >
        {/* Ambient Warm Glowing Background Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#DA6A45]/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-[#F3C096]/20 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#DA6A45]/10 rounded-full blur-[100px]" />
        </div>

        {/* Central Glass Card */}
        <div className="relative z-10 w-full max-w-md bg-white/90 border border-[#E5DFD5] rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(60,45,30,0.12)] backdrop-blur-2xl flex flex-col items-center gap-6 text-center overflow-hidden">
          {/* Top Decorative Warm Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#DA6A45] via-[#C85A37] to-[#F3C096]" />

          {/* Logo Badge Header */}
          <div className="flex items-center gap-2 bg-[#DA6A45]/10 px-4 py-1.5 rounded-2xl border border-[#DA6A45]/20">
            <KeyboardIcon className="w-4 h-4 text-[#DA6A45]" />
            <span className="text-xs font-bold text-[#DA6A45] tracking-widest uppercase">
              KeyMaster Loading
            </span>
          </div>

          {/* Real-time Typing Display Box */}
          <div className="w-full bg-[#FAF8F5] border border-[#E5DFD5] rounded-2xl p-5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <span className="text-3xl sm:text-4xl font-mono font-black text-[#DA6A45] tracking-widest min-h-[2.5rem] flex items-center">
              {typedText}
              <span className="w-3 h-7 bg-[#DA6A45] inline-block ml-1 rounded-xs animate-pulse" />
            </span>
          </div>

          {/* Miniature Interactive Keyboard Visual */}
          <div className="w-full bg-[#F2ECE1]/70 p-3 rounded-2xl border border-[#E5DFD5] flex flex-col gap-1.5 items-center">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1 justify-center w-full">
                {row.map(keyChar => {
                  const isActive = activeKey === keyChar;
                  return (
                    <div
                      key={keyChar}
                      className={`w-6 sm:w-7 h-7 sm:h-8 rounded-lg text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center transition-all duration-100 border ${
                        isActive
                          ? 'bg-[#DA6A45] text-white border-[#DA6A45] scale-110 shadow-lg shadow-[#DA6A45]/40 ring-2 ring-[#DA6A45]/30'
                          : typedText.includes(keyChar)
                          ? 'bg-white text-[#DA6A45] border-[#DA6A45]/30 font-extrabold'
                          : 'bg-white/80 text-[#78726A] border-[#E5DFD5]'
                      }`}
                    >
                      {keyChar}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Spacebar */}
            <div
              className={`w-28 sm:w-36 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-100 border ${
                activeKey === 'SPACE'
                  ? 'bg-[#DA6A45] text-white border-[#DA6A45] scale-105 shadow-md shadow-[#DA6A45]/30'
                  : 'bg-white/80 text-[#78726A] border-[#E5DFD5]'
              }`}
            >
              SPACE
            </div>
          </div>

          {/* Progress Bar (no text above) */}
          <div className="w-full flex flex-col gap-2.5">
            <div className="w-full h-2.5 bg-[#E5DFD5] rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-[#DA6A45] to-[#C85A37] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.15 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
