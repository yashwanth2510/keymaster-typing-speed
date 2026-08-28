import React, { useState } from 'react';
import { BarChart3, Trophy, Target, AlertTriangle, Clock, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getTestHistory, getWeakKeysFromHistory } from '../../lib/storage';
import { Keyboard } from '../Keyboard';
import { AICoaching } from '../../types';

interface StatsHubProps {
  onPracticeWeakKeys: () => void;
}

export const StatsHub: React.FC<StatsHubProps> = ({ onPracticeWeakKeys }) => {
  const history = getTestHistory();
  const weakKeysList = getWeakKeysFromHistory();

  const [aiCoaching, setAiCoaching] = useState<AICoaching | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);

  // Calculate high-level aggregates
  const totalTests = history.length;
  const bestWpm = history.length > 0 ? Math.max(...history.map((h) => h.wpm)) : 0;
  const avgWpm = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.wpm, 0) / history.length) : 0;
  const avgAccuracy = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / history.length) : 0;

  // Compute key-by-key accuracy map across all tests
  const keyErrorCounts: Record<string, number> = {};
  history.forEach((t) => {
    if (t.errorKeys) {
      Object.entries(t.errorKeys).forEach(([key, count]) => {
        keyErrorCounts[key] = (keyErrorCounts[key] || 0) + count;
      });
    }
  });

  const keyAccuracyMap: Record<string, number> = {};
  Object.keys(keyErrorCounts).forEach((k) => {
    const errs = keyErrorCounts[k];
    const estimatedHits = errs * 5 + 10;
    const acc = Math.max(40, 100 - (errs / estimatedHits) * 100);
    keyAccuracyMap[k.toLowerCase()] = Math.round(acc);
  });

  const handleFetchAICoaching = async () => {
    setIsLoadingCoach(true);
    try {
      const res = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: avgWpm || 40,
          accuracy: avgAccuracy || 95,
          errorKeys: weakKeysList,
          duration: 30,
          mode: 'history-aggregate'
        })
      });
      const data = await res.json();
      if (data.advice) {
        setAiCoaching(data.advice);
      }
    } catch (err) {
      console.error('Failed to load AI coaching:', err);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C2825] tracking-tight">
          Performance Analytics & AI Coach
        </h2>
        <p className="text-[#78726A] text-sm mt-2">
          Track your typing speed progression, view key accuracy heatmaps, and receive personalized coaching from Key Master.
        </p>
      </div>

      {/* Aggregated KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 border border-[#E5DFD5] p-5 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-xl shadow-2xs">
          <Trophy className="w-5 h-5 text-amber-500 mb-1" />
          <span className="text-3xl font-extrabold text-[#2C2825] font-mono">{bestWpm}</span>
          <span className="text-xs text-[#78726A] font-semibold uppercase tracking-wider mt-1">Best Speed</span>
        </div>

        <div className="bg-white/80 border border-[#E5DFD5] p-5 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-xl shadow-2xs">
          <BarChart3 className="w-5 h-5 text-[#DA6A45] mb-1" />
          <span className="text-3xl font-extrabold text-[#DA6A45] font-mono">{avgWpm}</span>
          <span className="text-xs text-[#78726A] font-semibold uppercase tracking-wider mt-1">Average WPM</span>
        </div>

        <div className="bg-white/80 border border-[#E5DFD5] p-5 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-xl shadow-2xs">
          <Target className="w-5 h-5 text-emerald-600 mb-1" />
          <span className="text-3xl font-extrabold text-emerald-700 font-mono">{avgAccuracy}%</span>
          <span className="text-xs text-[#78726A] font-semibold uppercase tracking-wider mt-1">Avg Accuracy</span>
        </div>

        <div className="bg-white/80 border border-[#E5DFD5] p-5 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-xl shadow-2xs">
          <Clock className="w-5 h-5 text-amber-700 mb-1" />
          <span className="text-3xl font-extrabold text-[#2C2825] font-mono">{totalTests}</span>
          <span className="text-xs text-[#78726A] font-semibold uppercase tracking-wider mt-1">Tests Taken</span>
        </div>
      </div>

      {/* Weak Keys Practice Banner */}
      {weakKeysList.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/80 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-[#2C2825]">Most Mistyped Keys Detected</h3>
              <p className="text-xs text-[#78726A] mt-0.5">
                Targeted practice on these keys will rapidly boost your raw speed and accuracy.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {weakKeysList.map((k) => (
                  <span key={k} className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-mono text-xs font-bold rounded-lg backdrop-blur-md">
                    '{k === ' ' ? 'SPACE' : k.toUpperCase()}'
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onPracticeWeakKeys}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            Practice Weak Keys Drill
          </button>
        </div>
      )}

      {/* Keyboard Accuracy Heatmap */}
      <div className="bg-white/80 border border-[#E5DFD5] p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-xl shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#2C2825] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#DA6A45]" />
            <span>Key Accuracy Heatmap</span>
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> 95%+</span>
            <span className="flex items-center gap-1 text-amber-700 font-medium"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> 80-94%</span>
            <span className="flex items-center gap-1 text-rose-700 font-medium"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> &lt;80%</span>
          </div>
        </div>

        <Keyboard keyAccuracyMap={keyAccuracyMap} showFingerGuide={false} />
      </div>

      {/* AI Coach Comprehensive Analysis */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#F2ECE1] border border-[#DA6A45]/30 p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2C2825] font-bold text-lg">
            <Sparkles className="w-5 h-5 text-[#DA6A45]" />
            <span>AI Typing Coach Overall Review</span>
          </div>

          <button
            onClick={handleFetchAICoaching}
            disabled={isLoadingCoach}
            className="px-4 py-2 bg-[#DA6A45] hover:bg-[#C85A37] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 backdrop-blur-md"
          >
            {isLoadingCoach ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing History...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate AI Review</span>
              </>
            )}
          </button>
        </div>

        {aiCoaching ? (
          <div className="flex flex-col gap-3 text-sm text-[#2C2825] animate-in fade-in">
            <p className="font-medium text-[#2C2825] bg-white/90 p-4 rounded-xl border border-[#E5DFD5] shadow-2xs">
              "{aiCoaching.summary}"
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#DA6A45] uppercase tracking-wider">Targeted Growth Strategy:</span>
              <ul className="space-y-2">
                {aiCoaching.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#2C2825] bg-white p-2.5 rounded-xl border border-[#E5DFD5] shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#78726A]">
            Click 'Generate AI Review' to receive an in-depth technique analysis based on your full typing history from Key Master.
          </p>
        )}
      </div>

      {/* History Log Table */}
      <div className="bg-white/80 border border-[#E5DFD5] p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-xl shadow-2xs">
        <h3 className="text-base font-bold text-[#2C2825]">Recent Test Results</h3>
        {history.length === 0 ? (
          <p className="text-xs text-[#78726A] py-4 text-center">No test history recorded yet. Complete a speed test to view results here!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C2825]">
              <thead className="bg-[#FAF8F5] text-[#2C2825] uppercase font-mono border-b border-[#E5DFD5]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">WPM</th>
                  <th className="p-3">Raw</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5] font-mono">
                {history.slice(0, 15).map((test) => (
                  <tr key={test.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="p-3 text-[#78726A]">{new Date(test.timestamp).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-[#DA6A45]">{test.modeLabel}</td>
                    <td className="p-3 font-bold text-[#2C2825]">{test.wpm}</td>
                    <td className="p-3 text-[#78726A]">{test.rawWpm}</td>
                    <td className="p-3 text-emerald-700 font-bold">{test.accuracy}%</td>
                    <td className="p-3 text-[#78726A]">{test.timeElapsed}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
