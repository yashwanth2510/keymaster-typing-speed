import React, { useState } from 'react';
import { Timer, FileText, Quote, Code, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { TestMode, TimeOption, WordOption, TestSettings } from '../../types';

interface TestControlsProps {
  settings: TestSettings;
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void;
  onRestart: () => void;
  onGenerateAIText: (topic: string) => void;
  isLoadingAIText: boolean;
  weakKeysList: string[];
}

export const TestControls: React.FC<TestControlsProps> = ({
  settings,
  onUpdateSettings,
  onRestart,
  onGenerateAIText,
  isLoadingAIText,
  weakKeysList
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    onGenerateAIText(customTopic.trim());
    setShowAIPrompt(false);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 select-none">
      {/* Mode & Config Pills Container */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white/80 p-2 sm:p-2.5 rounded-2xl border border-[#E5DFD5] shadow-[0_4px_20px_0_rgba(60,45,30,0.05)] backdrop-blur-xl">
        {/* Mode Selector */}
        <div className="flex items-center bg-[#F2ECE1]/80 p-1 rounded-xl border border-[#E5DFD5] backdrop-blur-md">
          <button
            id="mode-time"
            onClick={() => onUpdateSettings({ mode: 'time' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mode === 'time'
                ? 'bg-[#DA6A45] text-white shadow-xs'
                : 'text-[#2C2825] hover:text-[#2C2825] hover:bg-white/80'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Time</span>
          </button>

          <button
            id="mode-words"
            onClick={() => onUpdateSettings({ mode: 'words' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mode === 'words'
                ? 'bg-[#DA6A45] text-white shadow-xs'
                : 'text-[#2C2825] hover:text-[#2C2825] hover:bg-white/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Words</span>
          </button>

          <button
            id="mode-quote"
            onClick={() => onUpdateSettings({ mode: 'quote' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mode === 'quote'
                ? 'bg-[#DA6A45] text-white shadow-xs'
                : 'text-[#2C2825] hover:text-[#2C2825] hover:bg-white/80'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Quotes</span>
          </button>

          <button
            id="mode-code"
            onClick={() => onUpdateSettings({ mode: 'code' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mode === 'code'
                ? 'bg-[#DA6A45] text-white shadow-xs'
                : 'text-[#2C2825] hover:text-[#2C2825] hover:bg-white/80'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            id="mode-ai"
            onClick={() => {
              onUpdateSettings({ mode: 'ai' });
              setShowAIPrompt(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mode === 'ai'
                ? 'bg-[#DA6A45] text-white shadow-xs font-bold'
                : 'text-[#2C2825] hover:text-[#DA6A45] hover:bg-white/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Topic</span>
          </button>

          {weakKeysList.length > 0 && (
            <button
              id="mode-weak"
              onClick={() => onUpdateSettings({ mode: 'weak' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                settings.mode === 'weak'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Weak Keys ({weakKeysList.length})</span>
            </button>
          )}
        </div>

        {/* Separator Divider */}
        <div className="w-px h-6 bg-[#E5DFD5] hidden sm:block" />

        {/* Options dependent on Mode */}
        {settings.mode === 'time' && (
          <div className="flex items-center gap-1">
            {[15, 30, 60, 120].map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSettings({ timeLimit: t as TimeOption })}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  settings.timeLimit === t
                    ? 'bg-[#DA6A45]/15 text-[#DA6A45] border border-[#DA6A45]/30 shadow-2xs'
                    : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        )}

        {settings.mode === 'words' && (
          <div className="flex items-center gap-1">
            {[10, 25, 50, 100].map((w) => (
              <button
                key={w}
                onClick={() => onUpdateSettings({ wordLimit: w as WordOption })}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  settings.wordLimit === w
                    ? 'bg-[#DA6A45]/15 text-[#DA6A45] border border-[#DA6A45]/30 shadow-2xs'
                    : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Restart Button */}
        <button
          id="restart-test-btn"
          onClick={onRestart}
          className="p-2 rounded-xl bg-[#F2ECE1] hover:bg-[#EBE3D5] text-[#2C2825] border border-[#E5DFD5] transition-all hover:rotate-180 duration-300 backdrop-blur-md"
          title="Restart Test (Esc)"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* AI Custom Prompt Modal/Drawer */}
      {showAIPrompt && (
        <form onSubmit={handleAISubmit} className="w-full max-w-md bg-white/95 border border-[#DA6A45]/30 rounded-2xl p-4 shadow-xl backdrop-blur-2xl flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
            <div className="flex items-center gap-2 text-[#2C2825] font-extrabold text-sm">
              <Sparkles className="w-4 h-4 text-[#DA6A45]" />
              <span>Generate Custom AI Practice Text</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAIPrompt(false)}
              className="text-[#78726A] hover:text-[#2C2825] text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-[#78726A] leading-relaxed">
            Enter any topic (e.g., "Cyberpunk Neo-Tokyo", "Cybersecurity Basics", "Astronomy") to generate practice text with AI!
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Space Exploration, Physics..."
              className="flex-1 bg-[#FAF8F5] border border-[#E5DFD5] rounded-xl px-3 py-2 text-sm text-[#2C2825] placeholder:text-[#A0988E] focus:outline-none focus:border-[#DA6A45] backdrop-blur-md font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoadingAIText || !customTopic.trim()}
              className="px-4 py-2 bg-[#DA6A45] hover:bg-[#C85A37] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0"
            >
              {isLoadingAIText ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
