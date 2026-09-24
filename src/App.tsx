import React, { useState } from 'react';
import { FlappyBirdGame } from './components/FlappyBirdGame';
import { Gamepad2, ShieldCheck, Zap, Cloud, Music, Award, Keyboard, Code, ExternalLink } from 'lucide-react';
import { STANDALONE_FLAPPY_HTML } from './game/standaloneHtml';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'rules' | 'mechanics'>('game');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(STANDALONE_FLAPPY_HTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {/* 3-Zone Top Bar Contract */}
      <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <a href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse" />
            Flappy Bird Arcade
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <button
              onClick={() => setActiveTab('game')}
              className={`transition-colors hover:text-white ${activeTab === 'game' ? 'text-white' : ''}`}
            >
              Arcade Canvas
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`transition-colors hover:text-white ${activeTab === 'rules' ? 'text-white' : ''}`}
            >
              Physics & Rules
            </button>
            <button
              onClick={() => setActiveTab('mechanics')}
              className={`transition-colors hover:text-white ${activeTab === 'mechanics' ? 'text-white' : ''}`}
            >
              Custom Mechanics
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              Get Standalone HTML
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col items-center">
        {/* Game Tab */}
        {activeTab === 'game' && (
          <div className="w-full flex flex-col items-center">
            {/* Header Kicker */}
            <div className="text-center mb-6 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Classic Flappy Bird Simulation
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Crafted with pure HTML5 Canvas, zero external assets, procedural Web Audio, and precision collision physics.
              </p>
            </div>

            {/* Canvas Game Module */}
            <FlappyBirdGame />
          </div>
        )}

        {/* Physics & Rules Tab */}
        {activeTab === 'rules' && (
          <div className="w-full max-w-3xl flex flex-col gap-8 py-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Physics & Collision Mechanics</h2>
              <p className="text-sm text-zinc-400">
                Detailed breakdown of the mathematical parameters powering the constant gravity, jump impulse, and bounding-box detection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Kinematic Gravity & Impulse</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Gravity applies a continuous downward acceleration of <code className="text-amber-300 bg-zinc-800 px-1 py-0.5 rounded">0.38 px/frame²</code>. Flapping applies an instantaneous upward impulse velocity of <code className="text-amber-300 bg-zinc-800 px-1 py-0.5 rounded">-6.8 px/frame</code>, with dynamic rotation mapped smoothly to vertical momentum.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Precise Bounding-Box Detection</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Collision logic tests the player's 24x20px bounding box against 4 distinct surface boundaries: the top ceiling (y &le; 0), the sandy ground plane (y &ge; 515), the upper pipe body, and the lower pipe body.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                  <Gamepad2 className="w-4 h-4" />
                  <span>Procedural Obstacle Pipeline</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Pipes spawn every 108 frames on the right margin with a randomized vertical clearance. The gap is locked to a comfortable 142px, guaranteeing the bird always has ample navigation clearance regardless of height.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                  <Award className="w-4 h-4" />
                  <span>Medal & Milestone Tiers</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Scores unlock tiered medals displayed on the Game Over screen: Bronze at 10 points, Silver at 20 points, Gold at 35 points, and Platinum at 50 points, with session and local storage high score tracking.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setActiveTab('game')}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Return to Arcade
              </button>
            </div>
          </div>
        )}

        {/* Custom Mechanics Tab */}
        {activeTab === 'mechanics' && (
          <div className="w-full max-w-3xl flex flex-col gap-8 py-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Custom Game Mechanics</h2>
              <p className="text-sm text-zinc-400">
                Enhancements answering the prompt's question regarding moving clouds, speed scaling, atmosphere cycles, and procedural sound.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-sky-950 border border-sky-800/60 text-sky-400 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-white">Parallax Moving Clouds & Horizon Skyline</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Four multi-scale procedural clouds drift across the sky at differing velocities, creating atmospheric depth. Beneath them, rolling hills and a cityscape with illuminated windows scroll in the background.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-white">Progressive Speed Scaling (Dynamic Difficulty)</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    When enabled in settings, the horizontal scroll speed progressively accelerates as score increases (<code className="text-emerald-300 bg-zinc-800 px-1 py-0.5 rounded">baseSpeed + score * 0.05</code>). Players can toggle this between fixed speed and progressive speed at any time.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-purple-950 border border-purple-800/60 text-purple-400 shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-white">Procedural 8-Bit Web Audio Engine</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Zero MP3 or WAV files are downloaded. The game synthesizes authentic arcade audio using the Web Audio API with tone oscillators: upward triangle frequency sweeps for wing flaps, dual-tone chimes for passing pipes, crunch noise on impact, and pitch slides on falls.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setActiveTab('game')}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Play with Custom Mechanics
              </button>
            </div>
          </div>
        )}

        {/* Global Controls & Tips footer pill */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 border-t border-zinc-800/60 pt-6 max-w-2xl w-full">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
            <span><strong className="text-zinc-300">Spacebar</strong> or <strong className="text-zinc-300">&uarr;</strong> to Jump</span>
          </div>
          <span>·</span>
          <span><strong className="text-zinc-300">Click / Tap</strong> on mobile or canvas</span>
          <span>·</span>
          <span><strong className="text-zinc-300">R</strong> to Restart</span>
        </div>
      </main>

      {/* Standalone Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-zinc-100">Single-File Standalone index.html</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold rounded-lg text-xs transition-colors"
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 overflow-auto flex-1 font-mono text-xs text-zinc-300 leading-relaxed">
              <pre className="whitespace-pre">
                <code>{STANDALONE_FLAPPY_HTML}</code>
              </pre>
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Save as <strong className="text-zinc-200">index.html</strong> to run anywhere without internet or build tools.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
