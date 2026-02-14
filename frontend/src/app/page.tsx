'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText, Typewriter, Terminal } from '@/components/ui';
import api from '@/lib/api';

const terminalLines = [
  { type: 'prompt' as const, text: 'Establishing secure connection...' },
  { type: 'output' as const, text: '[OK] Connection established' },
  { type: 'output' as const, text: '[OK] Encryption protocols active' },
  { type: 'prompt' as const, text: 'Loading Mission Briefing...' },
  { type: 'success' as const, text: '>>> CLASSIFIED TRANSMISSION INCOMING <<<' },
];

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // Check for existing session
    const token = api.getToken();
    if (token) {
      api.validateSession().then(() => {
        router.push('/dashboard');
      }).catch(() => {
        api.clearToken();
      });
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(teamName, accessCode);
      if (response.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-dark to-cyber-black" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-cyan/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-green/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-block p-4 border-2 border-cyber-cyan/50 rounded-lg bg-cyber-dark/50 backdrop-blur">
              <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto text-cyber-cyan">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="50" y="55" textAnchor="middle" fill="currentColor" fontSize="20" fontFamily="Orbitron">?</text>
              </svg>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-4">
            <GlitchText text="MISSION" className="text-cyber-text" />
            <br />
            <span className="text-cyber-cyan">ENIGMA</span>
          </h1>

          <p className="text-cyber-muted font-mono text-sm md:text-base tracking-wider">
            <Typewriter
              text="CLASSIFIED • TOP SECRET • EYES ONLY"
              speed={30}
              onComplete={() => setIntroComplete(true)}
            />
          </p>
        </div>

        {/* Terminal intro */}
        {introComplete && !showLogin && (
          <div className="mb-8 animate-fadeIn">
            <Terminal
              lines={terminalLines}
              title="SECURE_CHANNEL"
              animate
            />

            <div className="text-center mt-8">
              <button
                onClick={() => setShowLogin(true)}
                className="btn-neon text-lg"
              >
                INITIATE MISSION
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        {showLogin && (
          <div className="card-cyber animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-orbitron font-bold text-cyber-cyan">
                TEAM AUTHENTICATION
              </h2>
              <p className="text-cyber-muted text-sm mt-2">
                Enter your team credentials to access the mission
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-cyber-muted text-sm font-mono mb-2">
                  TEAM IDENTIFIER
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input-cyber"
                  placeholder="Enter team name..."
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-cyber-muted text-sm font-mono mb-2">
                  ACCESS CODE
                </label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="input-cyber"
                  placeholder="Enter access code..."
                  required
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="p-3 bg-cyber-red/10 border border-cyber-red rounded text-cyber-red text-sm font-mono">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="loader w-5 h-5" />
                    AUTHENTICATING...
                  </>
                ) : (
                  'ACCESS MISSION'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-cyber-border text-center">
              <button
                onClick={() => setShowLogin(false)}
                className="text-cyber-muted hover:text-cyber-cyan text-sm font-mono transition-colors"
              >
                ← Back to Terminal
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-cyber-muted text-xs font-mono">
          <p>SECURE CONNECTION • AES-256 ENCRYPTED</p>
          <p className="mt-1 opacity-50">v1.0.0 | Mission Control</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
