'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText, Typewriter } from '@/components/ui';
import api from '@/lib/api';

export default function FinalePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [animationPhase, setAnimationPhase] = useState(0);
    const [stats, setStats] = useState<{
        totalPoints: number;
        rounds: Array<{ round_number: number; points: number }>;
    } | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const progress = await api.getProgress() as {
                    session: { status: string; total_points: number };
                    rounds: Array<{ round_number: number; points: number }>;
                };
                if (progress.session.status !== 'completed') {
                    router.push('/dashboard');
                    return;
                }

                setStats({
                    totalPoints: progress.session.total_points || 0,
                    rounds: progress.rounds.sort((a, b) => a.round_number - b.round_number)
                });

                setLoading(false);

                // Start animation sequence
                const phases = [0, 1, 2, 3, 4, 5];
                for (let i = 0; i < phases.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 2000));
                    setAnimationPhase(i + 1);
                }
            } catch {
                router.push('/');
            }
        };
        init();
    }, [router]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Processing final report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-dark to-cyber-black" />

            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          w-[800px] h-[800px] rounded-full border-2 border-cyber-cyan/20
          transition-all duration-1000
          ${animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `} />
                <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          w-[600px] h-[600px] rounded-full border-2 border-cyber-green/30
          transition-all duration-1000 delay-300
          ${animationPhase >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `} />
                <div className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          w-[400px] h-[400px] rounded-full border-2 border-cyber-cyan/40
          transition-all duration-1000 delay-500
          ${animationPhase >= 3 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `} />
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center max-w-3xl mx-auto">
                {/* Status badge */}
                <div className={`
          mb-8 transition-all duration-500
          ${animationPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
                    <div className="inline-block px-6 py-2 bg-cyber-green/20 border-2 border-cyber-green rounded-full">
                        <span className="text-cyber-green font-orbitron font-bold tracking-widest">
                            CASE SOLVED
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div className={`
          mb-8 transition-all duration-500 delay-300
          ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
                    <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-4">
                        <GlitchText text="MISSION" className="text-cyber-text" />
                        <br />
                        <span className="text-cyber-green">COMPLETE</span>
                    </h1>
                </div>

                {/* Story reveal */}
                <div className={`
          card-cyber mb-8 text-left transition-all duration-500 delay-500
          ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-orbitron text-cyber-cyan">THE TRUTH REVEALED</h2>
                    </div>

                    <div className="space-y-4 font-mono text-sm text-cyber-muted leading-relaxed">
                        <p>
                            <Typewriter
                                text="The investigation has concluded. The evidence points to a conspiracy that runs deeper than anyone suspected."
                                speed={20}
                            />
                        </p>

                        {animationPhase >= 4 && (
                            <div className="p-4 bg-cyber-darker rounded border border-cyber-border mt-4">
                                <p className="text-cyber-text mb-2">
                                    <strong>Subject:</strong> Senior Technician Marcus Webb
                                </p>
                                <p className="text-cyber-text mb-2">
                                    <strong>Finding:</strong> The system failure was not accidental. Webb discovered an
                                    unauthorized access point in the monitoring system—an insider threat operating from
                                    within the organization.
                                </p>
                                <p className="text-cyber-text">
                                    <strong>Conclusion:</strong> Webb was silenced to prevent exposure of the data leak
                                    operation. The <span className="text-cyber-cyan">manual override</span> was triggered
                                    remotely, creating a cascade failure that masked the true nature of the attack.
                                </p>
                            </div>
                        )}

                        {animationPhase >= 5 && (
                            <p className="text-cyber-green text-center text-lg mt-6">
                                Your investigation has exposed the cover-up. The truth will not remain silent.
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats card */}
                {animationPhase >= 5 && stats && (
                    <div className="card-cyber mb-12 transform scale-110 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                        <h3 className="text-xl font-orbitron text-cyber-cyan mb-6 tracking-[0.2em]">FINAL AUDIT REPORT</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="text-center p-6 bg-cyber-darker rounded-lg border border-cyber-green/50">
                                <div className="text-xs text-cyber-muted font-mono mb-2 uppercase tracking-widest">Cumulative Score</div>
                                <div className="text-6xl font-orbitron font-bold text-cyber-green animate-pulse">
                                    {stats.totalPoints}
                                </div>
                                <div className="text-[10px] text-cyber-muted font-mono mt-2">Maximum Efficiency Reached</div>
                            </div>

                            <div className="space-y-4">
                                {stats.rounds.map((round) => (
                                    <div key={round.round_number} className="flex justify-between items-center p-3 border-b border-cyber-border/50">
                                        <div className="text-left">
                                            <div className="text-[10px] text-cyber-muted font-mono uppercase">Round {round.round_number}</div>
                                            <div className="text-sm font-mono text-cyber-text">
                                                {round.round_number === 1 ? 'TECH ESCAPE ROOM' :
                                                    round.round_number === 2 ? 'THE CHALLENGE DUO' :
                                                        'THE HEXA VAULT'}
                                            </div>
                                        </div>
                                        <div className="text-xl font-orbitron text-cyber-cyan">+{round.points}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* System restoration animation */}
                {animationPhase >= 5 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse" />
                            <span className="text-cyber-green font-mono text-sm">SYSTEM INTEGRITY RESTORED</span>
                        </div>
                        <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-green rounded-full transition-all duration-2000"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {animationPhase >= 5 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="btn-neon"
                        >
                            VIEW DASHBOARD
                        </button>
                        <button
                            onClick={() => {
                                api.logout();
                                router.push('/');
                            }}
                            className="btn-neon danger"
                        >
                            END SESSION
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className={`
          mt-12 transition-all duration-500
          ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}
        `}>
                    <p className="text-cyber-muted text-xs font-mono">
                        MISSION ENIGMA • CLASSIFIED INVESTIGATION • CASE #7X-DELTA
                    </p>
                    <p className="text-cyber-muted/50 text-xs font-mono mt-1">
                        This transmission will self-destruct... eventually.
                    </p>
                </div>
            </div>
        </div>
    );
}
