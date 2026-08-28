import React from 'react';

interface KeyboardProps {
  targetKey?: string;
  pressedKey?: string;
  errorKey?: string;
  showFingerGuide?: boolean;
  highlightKeys?: string[];
  keyAccuracyMap?: Record<string, number>; // key -> accuracy percentage 0..100
}

interface KeyConfig {
  key: string;
  display?: string;
  width?: string;
  finger: 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';
}

const KEYBOARD_ROWS: KeyConfig[][] = [
  // Row 1: Numbers & Symbols
  [
    { key: '`', display: '`', finger: 'left-pinky' },
    { key: '1', finger: 'left-pinky' },
    { key: '2', finger: 'left-ring' },
    { key: '3', finger: 'left-middle' },
    { key: '4', finger: 'left-index' },
    { key: '5', finger: 'left-index' },
    { key: '6', finger: 'right-index' },
    { key: '7', finger: 'right-index' },
    { key: '8', finger: 'right-middle' },
    { key: '9', finger: 'right-ring' },
    { key: '0', finger: 'right-pinky' },
    { key: '-', finger: 'right-pinky' },
    { key: '=', finger: 'right-pinky' },
    { key: 'Backspace', display: '⌫', width: 'w-16', finger: 'right-pinky' }
  ],
  // Row 2: Top Row
  [
    { key: 'Tab', display: 'Tab', width: 'w-14', finger: 'left-pinky' },
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '[', finger: 'right-pinky' },
    { key: ']', finger: 'right-pinky' },
    { key: '\\', finger: 'right-pinky' }
  ],
  // Row 3: Home Row
  [
    { key: 'CapsLock', display: 'Caps', width: 'w-16', finger: 'left-pinky' },
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: ';', finger: 'right-pinky' },
    { key: "'", finger: 'right-pinky' },
    { key: 'Enter', display: 'Enter ↵', width: 'w-20', finger: 'right-pinky' }
  ],
  // Row 4: Bottom Row
  [
    { key: 'Shift', display: 'Shift ⇧', width: 'w-20', finger: 'left-pinky' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', finger: 'right-middle' },
    { key: '.', finger: 'right-ring' },
    { key: '/', finger: 'right-pinky' },
    { key: 'ShiftRight', display: 'Shift ⇧', width: 'w-24', finger: 'right-pinky' }
  ],
  // Row 5: Space
  [
    { key: 'Control', display: 'Ctrl', width: 'w-14', finger: 'left-pinky' },
    { key: 'Alt', display: 'Alt', width: 'w-12', finger: 'thumb' },
    { key: ' ', display: 'Space Bar', width: 'flex-1 max-w-sm', finger: 'thumb' },
    { key: 'AltRight', display: 'Alt', width: 'w-12', finger: 'thumb' },
    { key: 'ControlRight', display: 'Ctrl', width: 'w-14', finger: 'right-pinky' }
  ]
];

const FINGER_COLOR_MAP: Record<KeyConfig['finger'], string> = {
  'left-pinky': 'border-rose-200 text-rose-700 hover:bg-rose-50',
  'left-ring': 'border-blue-200 text-blue-700 hover:bg-blue-50',
  'left-middle': 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  'left-index': 'border-[#DA6A45]/30 text-[#DA6A45] hover:bg-[#DA6A45]/10',
  'right-index': 'border-[#DA6A45]/30 text-[#DA6A45] hover:bg-[#DA6A45]/10',
  'right-middle': 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  'right-ring': 'border-blue-200 text-blue-700 hover:bg-blue-50',
  'right-pinky': 'border-rose-200 text-rose-700 hover:bg-rose-50',
  'thumb': 'border-stone-200 text-stone-700 hover:bg-stone-50'
};

const FINGER_LABELS: Record<KeyConfig['finger'], string> = {
  'left-pinky': 'Left Pinky',
  'left-ring': 'Left Ring',
  'left-middle': 'Left Middle',
  'left-index': 'Left Index',
  'right-index': 'Right Index',
  'right-middle': 'Right Middle',
  'right-ring': 'Right Ring',
  'right-pinky': 'Right Pinky',
  'thumb': 'Thumbs'
};

export const Keyboard: React.FC<KeyboardProps> = ({
  targetKey = '',
  pressedKey = '',
  errorKey = '',
  showFingerGuide = true,
  highlightKeys = [],
  keyAccuracyMap
}) => {
  const normTarget = targetKey === ' ' ? ' ' : targetKey.toLowerCase();
  const normPressed = pressedKey === ' ' ? ' ' : pressedKey.toLowerCase();
  const normError = errorKey === ' ' ? ' ' : errorKey.toLowerCase();

  // Find finger for active target key
  const targetFinger = KEYBOARD_ROWS.flatMap(r => r).find(
    k => k.key.toLowerCase() === normTarget
  )?.finger;

  return (
    <div id="visual-keyboard" className="w-full flex flex-col items-center gap-3 select-none">
      {/* Keyboard Canvas Container */}
      <div className="w-full max-w-4xl bg-white/80 border border-[#E5DFD5] p-3 sm:p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] backdrop-blur-2xl">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 w-full">
              {row.map((item) => {
                const kLower = item.key.toLowerCase();
                const isTarget = normTarget === kLower || highlightKeys.map(k => k.toLowerCase()).includes(kLower);
                const isPressed = normPressed === kLower;
                const isError = normError === kLower;
                const isHomeAnchor = item.key === 'f' || item.key === 'j';

                // Heatmap accuracy styling if provided
                let accuracyBg = '';
                if (keyAccuracyMap && keyAccuracyMap[kLower] !== undefined) {
                  const acc = keyAccuracyMap[kLower];
                  if (acc >= 95) accuracyBg = 'bg-emerald-100 border-emerald-300 text-emerald-800 backdrop-blur-md';
                  else if (acc >= 80) accuracyBg = 'bg-amber-100 border-amber-300 text-amber-800 backdrop-blur-md';
                  else accuracyBg = 'bg-rose-100 border-rose-300 text-rose-800 backdrop-blur-md';
                }

                // Determine active status classes
                let statusClasses = FINGER_COLOR_MAP[item.finger];
                if (isError) {
                  statusClasses = 'bg-rose-600 text-white border-rose-400 scale-95 shadow-md shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse backdrop-blur-md';
                } else if (isPressed) {
                  statusClasses = 'bg-amber-500 text-white font-bold border-amber-300 scale-95 shadow-md shadow-amber-500/30 ring-2 ring-amber-300 backdrop-blur-md';
                } else if (isTarget) {
                  statusClasses = 'bg-[#DA6A45] text-white border-[#DA6A45] font-bold shadow-md shadow-[#DA6A45]/30 ring-2 ring-[#DA6A45] animate-bounce backdrop-blur-md';
                } else if (accuracyBg) {
                  statusClasses = accuracyBg;
                } else {
                  statusClasses += ' bg-white/95 text-[#2C2825] border-[#E5DFD5] hover:bg-[#F2ECE1] backdrop-blur-md';
                }

                return (
                  <div
                    key={item.key}
                    id={`key-${item.key.toLowerCase().replace(/[^a-z0-9]/g, 'code')}`}
                    className={`
                      relative flex items-center justify-center h-10 sm:h-12 rounded-xl border text-xs sm:text-sm transition-all duration-100 font-mono shadow-xs
                      ${item.width || 'w-8 sm:w-11'}
                      ${statusClasses}
                    `}
                  >
                    <span>{item.display || item.key.toUpperCase()}</span>

                    {/* F & J Tactile Bumps */}
                    {isHomeAnchor && (
                      <span className="absolute bottom-1 w-2 sm:w-2.5 h-0.5 bg-slate-400 rounded-full" />
                    )}

                    {/* Key accuracy badge if heatmap active */}
                    {keyAccuracyMap && keyAccuracyMap[kLower] !== undefined && (
                      <span className="absolute -top-1.5 -right-1 text-[9px] px-1 bg-white text-slate-800 rounded-full border border-slate-300 font-sans backdrop-blur-md shadow-xs">
                        {Math.round(keyAccuracyMap[kLower])}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Target Finger Guidance Bar */}
      {showFingerGuide && targetKey && (
        <div className="flex items-center gap-3 text-xs sm:text-sm px-4 py-2 bg-white/80 border border-[#E5DFD5] rounded-2xl text-[#2C2825] shadow-xs backdrop-blur-xl">
          <span className="text-[#78726A] font-medium">Next Finger:</span>
          <span className="font-semibold text-[#DA6A45] bg-[#DA6A45]/10 px-2.5 py-0.5 rounded-lg border border-[#DA6A45]/20 backdrop-blur-md">
            {targetFinger ? FINGER_LABELS[targetFinger] : 'Any'}
          </span>
          <span className="text-[#78726A]">Target Key:</span>
          <kbd className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-mono rounded-lg font-bold backdrop-blur-md shadow-2xs">
            {targetKey === ' ' ? 'SPACE' : targetKey.toUpperCase()}
          </kbd>
        </div>
      )}
    </div>
  );
};
