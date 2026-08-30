import React, { useState } from 'react';
import { Gamepad2, Flame, Zap, Droplet, Rocket, Trophy } from 'lucide-react';
import { MeteorGame } from './MeteorGame';
import { RacerGame } from './RacerGame';
import { BubbleGame } from './BubbleGame';
import { CometGame } from './CometGame';
import { getArcadeHighScores } from '../../lib/storage';

export const ArcadeHub: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'meteor' | 'racer' | 'bubble' | 'comet' | null>(null);
  const highScores = getArcadeHighScores();

  if (selectedGame === 'meteor') {
    return <MeteorGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'racer') {
    return <RacerGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'bubble') {
    return <BubbleGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'comet') {
    return <CometGame onBack={() => setSelectedGame(null)} />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#DA6A45]/10 border border-[#DA6A45]/20 rounded-full text-[#DA6A45] text-xs font-semibold mb-3 backdrop-blur-md shadow-2xs">
          <Gamepad2 className="w-4 h-4 text-[#DA6A45]" />
          <span>Typing Practice Arcade</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C2825] tracking-tight">
          Level Up Your Typing Speed
        </h2>
        <p className="text-[#78726A] text-sm mt-2">
          Gamified typing practice designed to build fast reflexes, high-speed accuracy, and muscle memory!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meteor Storm Card */}
        <div
          id="arcade-card-meteor"
          onClick={() => setSelectedGame('meteor')}
          className="bg-white/85 border border-[#E5DFD5] hover:border-[#DA6A45]/60 p-6 rounded-3xl flex flex-col justify-between gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] hover:shadow-xl backdrop-blur-xl group hover:bg-white/95"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] group-hover:scale-110 transition-transform backdrop-blur-md shadow-2xs">
              <Flame className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#2C2825] group-hover:text-[#DA6A45] transition-colors">
                Meteor Storm: Word Invasion
              </h3>
              <p className="text-xs text-[#78726A] mt-1 leading-relaxed">
                Space meteors with words descend towards your planet. Type words to fire laser missiles, collect power-ups, and defend your shields!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD5]">
            <span className="text-xs font-mono text-amber-800 flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>High Score: {highScores['meteor'] || 0} Pts</span>
            </span>

            <span className="text-xs font-bold text-[#DA6A45] group-hover:translate-x-1 transition-transform">
              Play Game →
            </span>
          </div>
        </div>

        {/* Speed Racer Card */}
        <div
          id="arcade-card-racer"
          onClick={() => setSelectedGame('racer')}
          className="bg-white/85 border border-[#E5DFD5] hover:border-[#DA6A45]/60 p-6 rounded-3xl flex flex-col justify-between gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] hover:shadow-xl backdrop-blur-xl group hover:bg-white/95"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] group-hover:scale-110 transition-transform backdrop-blur-md shadow-2xs">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#2C2825] group-hover:text-[#DA6A45] transition-colors">
                Speed Racer: Typing Drag Race
              </h3>
              <p className="text-xs text-[#78726A] mt-1 leading-relaxed">
                Compete against 3 AI drivers on a high-speed drag strip. Type continuous text to fuel your nitro engine and cross the finish line first!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD5]">
            <span className="text-xs font-mono text-amber-800 flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>High Score: {highScores['racer'] || 0} Pts</span>
            </span>

            <span className="text-xs font-bold text-[#DA6A45] group-hover:translate-x-1 transition-transform">
              Play Game →
            </span>
          </div>
        </div>

        {/* Bubble Pop Card */}
        <div
          id="arcade-card-bubble"
          onClick={() => setSelectedGame('bubble')}
          className="bg-white/85 border border-[#E5DFD5] hover:border-[#7FB2C5]/70 p-6 rounded-3xl flex flex-col justify-between gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] hover:shadow-xl backdrop-blur-xl group hover:bg-white/95"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7FB2C5]/10 border border-[#7FB2C5]/30 flex items-center justify-center text-[#7FB2C5] group-hover:scale-110 transition-transform backdrop-blur-md shadow-2xs">
              <Droplet className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#2C2825] group-hover:text-[#7FB2C5] transition-colors">
                Bubble Pop: Word Unravel
              </h3>
              <p className="text-xs text-[#78726A] mt-1 leading-relaxed">
                Words float up from the deep like rising bubbles. Type each word to pop it before it escapes to the surface!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD5]">
            <span className="text-xs font-mono text-amber-800 flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>High Score: {highScores['bubble'] || 0} Pts</span>
            </span>

            <span className="text-xs font-bold text-[#7FB2C5] group-hover:translate-x-1 transition-transform">
              Play Game →
            </span>
          </div>
        </div>

        {/* Solar Drift Card */}
        <div
          id="arcade-card-comet"
          onClick={() => setSelectedGame('comet')}
          className="bg-white/85 border border-[#E5DFD5] hover:border-[#DA6A45]/60 p-6 rounded-3xl flex flex-col justify-between gap-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_32px_0_rgba(60,45,30,0.06)] hover:shadow-xl backdrop-blur-xl group hover:bg-white/95"
        >
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DA6A45]/10 border border-[#DA6A45]/20 flex items-center justify-center text-[#DA6A45] group-hover:scale-110 transition-transform backdrop-blur-md shadow-2xs">
              <Rocket className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#2C2825] group-hover:text-[#DA6A45] transition-colors">
                Solar Drift: Comet Rush
              </h3>
              <p className="text-xs text-[#78726A] mt-1 leading-relaxed">
                Word-bearing comets streak across deep space toward your ship. Type their words to fire missiles and blast them out of the solar system!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD5]">
            <span className="text-xs font-mono text-amber-800 flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>High Score: {highScores['comet'] || 0} Pts</span>
            </span>

            <span className="text-xs font-bold text-[#DA6A45] group-hover:translate-x-1 transition-transform">
              Play Game →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
