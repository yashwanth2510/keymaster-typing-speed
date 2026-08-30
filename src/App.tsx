import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SpeedTest } from './components/SpeedTest/SpeedTest';
import { Tutorials } from './components/Tutorials/Tutorials';
import { ArcadeHub } from './components/Arcade/ArcadeHub';
import { StatsHub } from './components/StatsHub/StatsHub';
import { LoadingScreen } from './components/LoadingScreen';
import { TestSettings } from './types';
import { getSavedSettings, saveSettings, getStreak, getWeakKeysFromHistory } from './lib/storage';
import { soundEngine } from './lib/sound';
import { getDecryptedPortfolioUrl, openCreatorPortfolio } from './lib/portfolio';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'test' | 'tutorials' | 'arcade' | 'stats'>('test');
  const [settings, setSettings] = useState<TestSettings>(() => getSavedSettings());
  const [streak, setStreak] = useState(() => getStreak());
  const [weakKeysList, setWeakKeysList] = useState<string[]>(() => getWeakKeysFromHistory());

  // Ensure browser tab title is Key Master
  useEffect(() => {
    document.title = 'Key Master';
  }, []);

  // Keep sound engine config synced with user settings
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
    soundEngine.setProfile(settings.soundProfile);
    soundEngine.updateAmbience(
      settings.ambienceEnabled ?? false,
      settings.ambienceSound ?? 'rain',
      settings.ambienceVolume ?? 0.35
    );
  }, [
    settings.soundEnabled,
    settings.soundProfile,
    settings.ambienceEnabled,
    settings.ambienceSound,
    settings.ambienceVolume
  ]);

  const handleUpdateSettings = (newSettings: Partial<TestSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const handlePracticeWeakKeys = () => {
    handleUpdateSettings({ mode: 'weak' });
    setActiveTab('test');
  };

  // Refresh streak & weak keys whenever active tab changes
  useEffect(() => {
    setStreak(getStreak());
    setWeakKeysList(getWeakKeysFromHistory());
  }, [activeTab]);

  return (
    <div id="app-container" className="relative min-h-screen bg-[#FAF8F5] text-[#2C2825] font-sans flex flex-col selection:bg-[#DA6A45] selection:text-white overflow-x-hidden">
      {/* Page Load / Refresh Animated Keyboard Loading Screen */}
      {isLoading && <LoadingScreen onFinished={() => setIsLoading(false)} />}

      {/* Background Glass Ambient Orbs (Key Master Warm Light Theme) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#DA6A45]/12 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-[#F3C096]/25 rounded-full blur-[140px] animate-pulse-slow-reverse" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-[#E59866]/20 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute top-2/3 left-10 w-80 h-80 bg-[#C85A37]/10 rounded-full blur-[110px] animate-pulse-slow-reverse" />
      </div>

      {/* Navbar Header */}
      <div className="relative z-50">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          streakCount={streak.count}
          streakInfo={streak}
          onOpenStreak={() => setStreak(getStreak())}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'test' && (
          <SpeedTest
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            weakKeysList={weakKeysList}
          />
        )}

        {activeTab === 'tutorials' && <Tutorials />}

        {activeTab === 'arcade' && <ArcadeHub />}

        {activeTab === 'stats' && (
          <StatsHub onPracticeWeakKeys={handlePracticeWeakKeys} />
        )}
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 w-full border-t border-[#E5DFD5] bg-[#F7F4EF]/70 backdrop-blur-md py-6 text-center text-xs text-[#78726A] flex flex-col items-center gap-1.5">
        <p>KeyMaster • Master Touch Typing, Speed Tests, Row Tutorials & Arcade Games</p>
        <p className="text-[11px] text-[#78726A]">
          Created by{' '}
          <a
            id="creator-portfolio-footer-link"
            href={getDecryptedPortfolioUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openCreatorPortfolio}
            className="font-semibold text-[#DA6A45] hover:text-[#C85A37] hover:underline underline-offset-2 transition-colors cursor-pointer"
          >
            Yashwanth Tadikonda
          </a>
        </p>
      </footer>
    </div>
  );
}
