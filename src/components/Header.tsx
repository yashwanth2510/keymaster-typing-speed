import React, { useState } from 'react';
import { Keyboard, Zap, BookOpen, Gamepad2, BarChart3, Volume2, VolumeX, Flame, Headphones, Trees, Moon, Volume1, Coffee, CheckCircle2, Droplet, CloudRain, Waves, ExternalLink } from 'lucide-react';
import { TestSettings } from '../types';
import { StreakInfo, toLocalDateStr } from '../lib/storage';
import { getDecryptedPortfolioUrl, openCreatorPortfolio } from '../lib/portfolio';

interface HeaderProps {
  activeTab: number | string; // injected label tab
  setActiveTab: (tab: 'test' | 'tutorials' | 'arcade' | 'stats') => void;
  settings: TestSettings;
  onUpdateSettings: (update: Partial<TestSettings>) => void;
  streakCount: number;
  streakInfo?: StreakInfo;
  onOpenStreak?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onUpdateSettings,
  streakCount,
  streakInfo,
  onOpenStreak
}) => {
  const [showAmbiencePopover, setShowAmbiencePopover] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);

  // Compute last 7 days for the streak activity tracker
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const dateObj = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = toLocalDateStr(dateObj);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabel = dayNames[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const isActive = Boolean(streakInfo?.activeDates?.includes(dateStr)) || (i === 6 && Boolean(streakInfo?.practicedToday));
    return { date: dateStr, dayLabel, dayNum, isActive };
  });

  const portfolioUrl = getDecryptedPortfolioUrl();

  // Show the user's own calendar day/timezone so streak dates are transparent
  const now = new Date();
  const todayDisplay = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  let browserTz = 'Browser timezone';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) browserTz = tz;
  } catch {}

  return (
    <header className="w-full bg-[#FAF8F5]/90 border-b border-[#E5DFD5] backdrop-blur-md sticky top-0 z-50 shadow-[0_2px_12px_0_rgba(60,45,30,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6">
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-3 select-none shrink-0">
          <button
            id="brand-home-btn"
            type="button"
            onClick={() => setActiveTab('test')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DA6A45] to-[#C85A37] flex items-center justify-center text-white shadow-xs hover:shadow-md hover:shadow-[#DA6A45]/20 hover:scale-105 transition-all cursor-pointer border-none"
            title="KeyMaster Speed Test"
            aria-label="KeyMaster Home"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <div className="flex flex-col justify-center">
            <button
              id="brand-home-title"
              type="button"
              onClick={() => setActiveTab('test')}
              className="text-left text-lg font-bold text-[#2C2825] tracking-tight hover:text-[#DA6A45] transition-colors leading-tight cursor-pointer bg-transparent border-none p-0"
            >
              KeyMaster
            </button>
            <a
              id="creator-portfolio-header-link"
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={openCreatorPortfolio}
              className="text-[11px] font-medium text-[#78726A] hover:text-[#DA6A45] transition-colors flex items-center gap-1 mt-0.5 group/creator cursor-pointer"
              title="Visit Yashwanth Tadikonda's Portfolio"
            >
              <span>created by <span className="font-semibold underline decoration-[#DA6A45]/30 group-hover/creator:decoration-[#DA6A45] underline-offset-2">yashwanth tadikonda</span></span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/creator:opacity-100 group-hover/creator:translate-x-0.5 group-hover/creator:-translate-y-0.5 transition-all" />
            </a>
          </div>
        </div>

        {/* Center: Uniform Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            id="nav-tab-test"
            onClick={() => setActiveTab('test')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'test'
                ? 'text-[#2C2825] font-semibold bg-[#F2ECE1]/80 shadow-2xs'
                : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]/50'
            }`}
          >
            <Zap className="w-4 h-4 opacity-70" />
            <span>Speed Test</span>
          </button>

          <button
            id="nav-tab-tutorials"
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tutorials'
                ? 'text-[#2C2825] font-semibold bg-[#F2ECE1]/80 shadow-2xs'
                : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]/50'
            }`}
          >
            <BookOpen className="w-4 h-4 opacity-70" />
            <span>Tutorials</span>
          </button>

          <button
            id="nav-tab-arcade"
            onClick={() => setActiveTab('arcade')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'arcade'
                ? 'text-[#2C2825] font-semibold bg-[#F2ECE1]/80 shadow-2xs'
                : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4 opacity-70" />
            <span>Arcade Games</span>
          </button>

          <button
            id="nav-tab-stats"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'text-[#2C2825] font-semibold bg-[#F2ECE1]/80 shadow-2xs'
                : 'text-[#78726A] hover:text-[#2C2825] hover:bg-[#F2ECE1]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 opacity-70" />
            <span>Stats & Coach</span>
          </button>
        </nav>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Daily Streak Badge & Interactive Popover */}
          <div className="relative">
            <button
              id="streak-badge-btn"
              onClick={() => {
                onOpenStreak?.();
                setShowStreakPopover(!showStreakPopover);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DA6A45]/10 hover:bg-[#DA6A45]/20 border border-[#DA6A45]/25 rounded-full text-[#C85A37] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Daily Practice Streak (Stored via browser cookies & history)"
            >
              <Flame className={`w-3.5 h-3.5 text-[#DA6A45] ${streakCount > 0 ? 'fill-[#DA6A45] animate-pulse' : ''}`} />
              <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
            </button>

            {showStreakPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white/95 border border-[#E5DFD5] rounded-2xl p-4 shadow-xl backdrop-blur-2xl z-50 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 text-[#2C2825]">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#DA6A45] fill-[#DA6A45]" />
                    <span className="text-xs font-extrabold text-[#2C2825]">Daily Practice Streak</span>
                  </div>
                  <button
                    onClick={() => setShowStreakPopover(false)}
                    className="text-[#78726A] hover:text-[#2C2825] text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Streak Stat Display */}
                <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD5]">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-[#2C2825] flex items-center gap-1.5">
                      {streakCount} <span className="text-xs font-semibold text-[#78726A]">consecutive {streakCount === 1 ? 'day' : 'days'}</span>
                    </span>
                    <span className="text-[11px] text-[#78726A] mt-0.5">
                      {streakInfo?.practicedToday
                        ? '✅ Daily practice goal recorded today!'
                        : '⚡ Practice once today to extend your streak!'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#DA6A45]/15 flex items-center justify-center text-[#DA6A45]">
                    <Flame className="w-6 h-6 fill-current" />
                  </div>
                </div>

                {/* 7-Day Activity Calendar Dots */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#78726A] uppercase tracking-wider">
                    Recent 7-Day Activity
                  </span>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {recentDays.map((d) => (
                      <div
                        key={d.date}
                        className={`flex flex-col items-center py-2 px-1 rounded-xl border text-[11px] font-medium transition-all ${
                          d.isActive
                            ? 'bg-[#DA6A45]/15 border-[#DA6A45]/50 text-[#C85A37] font-bold'
                            : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#78726A]'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider">{d.dayLabel}</span>
                        <span className="mt-0.5 font-mono text-xs">{d.dayNum}</span>
                        <div className="mt-1">
                          {d.isActive ? (
                            <CheckCircle2 className="w-3 h-3 text-[#DA6A45]" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D5CBB9]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#78726A]">
                    Today {todayDisplay} · {browserTz}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Buy Me a Coffee */}
          <a
            id="buymeacoffee-header-btn"
            href="https://buymeacoffee.com/yashwanthtadikonda"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border transition-all bg-[#DA6A45]/10 text-[#DA6A45] border-[#DA6A45]/25 hover:bg-[#DA6A45]/20 hover:border-[#DA6A45]/45 hover:-translate-y-0.5"
            title="Buy me a coffee"
            aria-label="Buy me a coffee"
          >
            <span className="coffee-steam coffee-steam-wrap">
              <span className="coffee-steam-wisp" />
              <span className="coffee-steam-wisp" />
              <span className="coffee-steam-wisp" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" x2="6" y1="2" y2="4" />
                <line x1="10" x2="10" y1="2" y2="4" />
                <line x1="14" x2="14" y1="2" y2="4" />
              </svg>
            </span>
          </a>

          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-lg border transition-all ${
              settings.soundEnabled
                ? 'bg-[#F2ECE1] text-[#2C2825] border-[#E5DFD5]'
                : 'bg-white text-[#78726A] border-[#E5DFD5] opacity-60'
            }`}
            title={settings.soundEnabled ? 'Mute Keyboard Sounds' : 'Enable Keyboard Sounds'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Focus Ambience CTA Pill Button */}
          <div className="relative">
            <button
              id="toggle-ambience-btn"
              onClick={() => {
                if (!settings.ambienceEnabled) {
                  onUpdateSettings({ ambienceEnabled: true });
                }
                setShowAmbiencePopover(!showAmbiencePopover);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs border ${
                settings.ambienceEnabled
                  ? 'bg-[#DA6A45] text-white border-[#DA6A45] hover:bg-[#C85A37] shadow-xs shadow-[#DA6A45]/25'
                  : 'bg-[#F2ECE1] text-[#2C2825] border-[#E5DFD5] hover:bg-[#EBE3D5] hover:border-[#DA6A45]/40'
              }`}
            >
              <Headphones className={`w-3.5 h-3.5 ${settings.ambienceEnabled ? 'text-white' : 'text-[#DA6A45]'}`} />
              <span>Ambience</span>
              {settings.ambienceEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Ambience Control Popover */}
            {showAmbiencePopover && (
              <div className="absolute right-0 mt-2 w-72 bg-white/95 border border-[#E5DFD5] rounded-2xl p-4 shadow-xl backdrop-blur-2xl z-50 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD5]">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#DA6A45]" />
                    <span className="text-xs font-extrabold text-[#2C2825]">Focus Background Ambience</span>
                  </div>
                  <button
                    onClick={() => setShowAmbiencePopover(false)}
                    className="text-[#78726A] hover:text-[#2C2825] text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Enable / Disable Switch */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78726A]">Play Focus Sounds</span>
                  <button
                    onClick={() => onUpdateSettings({ ambienceEnabled: !settings.ambienceEnabled })}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      settings.ambienceEnabled ? 'bg-[#DA6A45]' : 'bg-[#E5DFD5]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        settings.ambienceEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Profile Options */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#78726A] uppercase tracking-wider">Nature & Focus Soundscapes</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'forest', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'forest'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Trees className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Forest Birds</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'crickets', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'crickets'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Moon className="w-4 h-4 shrink-0 text-[#DA6A45]" />
                      <span>Night Crickets</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'stream', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'stream'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Droplet className="w-4 h-4 shrink-0 text-cyan-600" />
                      <span>Mountain Stream</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'fireplace', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'fireplace'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Flame className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Cozy Fireplace</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'rain', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'rain'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <CloudRain className="w-4 h-4 shrink-0 text-sky-600" />
                      <span>Soft Rain</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'waves', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'waves'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Waves className="w-4 h-4 shrink-0 text-teal-600" />
                      <span>Ocean Waves</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'typing', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'typing'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Keyboard className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>Typing Clatter</span>
                    </button>

                    <button
                      onClick={() => onUpdateSettings({ ambienceSound: 'cafe', ambienceEnabled: true })}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        settings.ambienceEnabled && settings.ambienceSound === 'cafe'
                          ? 'bg-[#DA6A45]/15 border-[#DA6A45] text-[#DA6A45]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] text-[#2C2825] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Coffee className="w-4 h-4 shrink-0 text-orange-700" />
                      <span>Cozy Cafe</span>
                    </button>
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-[#78726A]">
                    <span className="flex items-center gap-1 font-medium">
                      <Volume1 className="w-3.5 h-3.5" />
                      <span>Ambience Volume</span>
                    </span>
                    <span className="font-mono font-bold text-[#2C2825]">
                      {Math.round((settings.ambienceVolume ?? 0.35) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ambienceVolume ?? 0.35}
                    onChange={(e) => onUpdateSettings({ ambienceVolume: parseFloat(e.target.value) })}
                    className="w-full accent-[#DA6A45] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
