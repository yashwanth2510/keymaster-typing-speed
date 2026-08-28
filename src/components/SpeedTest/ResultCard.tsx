import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Share2, Award, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestResult, AICoaching } from '../../types';

interface ResultCardProps {
  result: TestResult;
  onRestart: () => void;
  onPracticeWeakKeys: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onRestart,
  onPracticeWeakKeys
}) => {
  const [aiCoaching, setAiCoaching] = useState<AICoaching | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trigger confetti on render if high performance
  React.useEffect(() => {
    if (result.wpm >= 60 && result.accuracy >= 95) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result]);

  const handleFetchAICoaching = async () => {
    setIsLoadingCoach(true);
    try {
      const errorKeysList = Object.keys(result.errorKeys || {});
      const res = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: result.wpm,
          accuracy: result.accuracy,
          errorKeys: errorKeysList,
          duration: result.timeElapsed,
          mode: result.mode
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

  const handleCopyResult = () => {
    const text = `🏆 KeyMaster Typing Result!\n⚡ Speed: ${result.wpm} WPM (Raw: ${result.rawWpm})\n🎯 Accuracy: ${result.accuracy}%\n⏱️ Time: ${result.timeElapsed}s\nMode: ${result.modeLabel}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorKeysEntries = Object.entries(result.errorKeys || {}).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <div id="test-result-card" className="w-full max-w-4xl bg-white/85 border border-[#E5DFD5] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_0_rgba(60,45,30,0.08)] backdrop-blur-2xl flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DFD5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#DA6A45] font-semibold text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Test Completed • {result.modeLabel}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C2825] tracking-tight mt-1">
            Typing Speed Summary
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyResult}
            className="flex items-center gap-2 px-4 py-2 bg-[#F2ECE1] hover:bg-[#EBE3D5] text-[#2C2825] border border-[#E5DFD5] rounded-xl text-xs font-semibold transition-all backdrop-blur-md"
          >
            <Share2 className="w-4 h-4 text-[#DA6A45]" />
            <span>{copied ? 'Copied!' : 'Share Result'}</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-2 bg-[#DA6A45] hover:bg-[#C85A37] text-white border border-[#DA6A45]/40 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#DA6A45]/20 backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* WPM Card */}
        <div className="bg-white/80 border border-[#DA6A45]/30 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-md shadow-2xs">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#DA6A45]" />
          <span className="text-4xl sm:text-5xl font-black text-[#DA6A45] font-mono tracking-tight">
            {result.wpm}
          </span>
          <span className="text-xs font-bold text-[#2C2825] uppercase tracking-widest mt-1">
            WPM
          </span>
          <span className="text-[11px] text-[#78726A] mt-0.5">Raw: {result.rawWpm}</span>
        </div>

        {/* Accuracy Card */}
        <div className="bg-white/80 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-md shadow-2xs">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <span className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono tracking-tight">
            {result.accuracy}%
          </span>
          <span className="text-xs font-bold text-[#2C2825] uppercase tracking-widest mt-1">
            Accuracy
          </span>
          <span className="text-[11px] text-[#78726A] mt-0.5">
            {result.correctChars} / {result.totalKeystrokes} Keys
          </span>
        </div>

        {/* Time Card */}
        <div className="bg-white/80 border border-amber-200 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-md shadow-2xs">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <span className="text-4xl sm:text-5xl font-black text-amber-700 font-mono tracking-tight">
            {result.timeElapsed}s
          </span>
          <span className="text-xs font-bold text-[#2C2825] uppercase tracking-widest mt-1">
            Time Taken
          </span>
          <span className="text-[11px] text-[#78726A] mt-0.5">Duration</span>
        </div>

        {/* Errors Card */}
        <div className="bg-white/80 border border-rose-200 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden backdrop-blur-md shadow-2xs">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
          <span className="text-4xl sm:text-5xl font-black text-rose-600 font-mono tracking-tight">
            {result.incorrectChars}
          </span>
          <span className="text-xs font-bold text-[#2C2825] uppercase tracking-widest mt-1">
            Errors
          </span>
          <span className="text-[11px] text-[#78726A] mt-0.5">Mistakes</span>
        </div>
      </div>

      {/* WPM Progression Chart */}
      {result.wpmHistory && result.wpmHistory.length > 1 && (
        <div className="bg-white/80 border border-[#E5DFD5] p-5 rounded-2xl flex flex-col gap-3 backdrop-blur-md shadow-2xs">
          <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#DA6A45]" />
            <span>Speed Consistency Curve (WPM vs Time)</span>
          </h3>
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.wpmHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(218,106,69,0.12)" />
                <XAxis dataKey="time" stroke="#78726A" tickFormatter={(t) => `${t}s`} />
                <YAxis stroke="#78726A" domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#E5DFD5', borderRadius: '12px', backdropFilter: 'blur(12px)', boxShadow: '0 4px 12px rgba(60,45,30,0.08)' }}
                  labelStyle={{ color: '#2C2825', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value} WPM`, 'Speed']}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="#DA6A45"
                  strokeWidth={3}
                  dot={{ fill: '#DA6A45', r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="rawWpm"
                  stroke="#A0988E"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Problematic Keys Section */}
      {errorKeysEntries.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/80 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-sm font-bold text-[#2C2825]">Mistyped Keys Detected:</span>
              <div className="flex items-center gap-2 mt-1">
                {errorKeysEntries.slice(0, 6).map(([key, count]) => (
                  <span key={key} className="px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-mono text-xs font-bold backdrop-blur-md">
                    '{key === ' ' ? 'SPACE' : key.toUpperCase()}' ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onPracticeWeakKeys}
            className="px-4 py-2 bg-[#DA6A45] hover:bg-[#C85A37] text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            Practice Weak Keys
          </button>
        </div>
      )}

      {/* AI Coach Feedback Panel */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#F2ECE1] border border-[#DA6A45]/30 p-6 rounded-2xl flex flex-col gap-4 backdrop-blur-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#DA6A45]" />
            <h3 className="text-base font-bold text-[#2C2825]">AI Typing Coach Analysis</h3>
          </div>

          {!aiCoaching && (
            <button
              onClick={handleFetchAICoaching}
              disabled={isLoadingCoach}
              className="px-4 py-2 bg-[#DA6A45] hover:bg-[#C85A37] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 backdrop-blur-md"
            >
              {isLoadingCoach ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Technique...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Key Master Advice</span>
                </>
              )}
            </button>
          )}
        </div>

        {aiCoaching && (
          <div className="flex flex-col gap-3 text-sm text-[#2C2825] animate-in fade-in">
            <p className="font-semibold text-[#2C2825] bg-white/90 p-3 rounded-xl border border-[#E5DFD5] shadow-2xs">
              "{aiCoaching.summary}"
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#DA6A45] uppercase tracking-wider">Recommendations:</span>
              <ul className="space-y-1.5">
                {aiCoaching.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#2C2825]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
