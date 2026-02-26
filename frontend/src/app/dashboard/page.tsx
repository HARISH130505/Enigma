'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, ProgressTracker, SystemIntegrity, Typewriter } from '@/components/ui';
import api from '@/lib/api';

interface RoundProgress {
    round_number: number;
    evidence_1_complete: boolean;
    evidence_2_complete: boolean;
    evidence_3_complete: boolean;
    evidence_4_complete: boolean;
    escape_code_unlocked: boolean;
    points: number;
    completed_at: string | null;
}

interface GameProgress {
    session: {
        id: string;
        status: string;
        currentRound: number;
        startedAt: string;
        expiresAt: string;
    };
    rounds: RoundProgress[];
}

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<GameProgress | null>(null);
    const [briefing, setBriefing] = useState<{ title: string; briefing: string; objectives: string[] } | null>(null);
    const [showBriefing, setShowBriefing] = useState(false);

    const fetchProgress = useCallback(async () => {
        try {
            const data = await api.getProgress() as unknown as GameProgress;
            setProgress(data);
        } catch {
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        const init = async () => {
            try {
                await api.validateSession();
                await fetchProgress();
                const briefData = await api.getBriefing() as unknown as { title: string; briefing: string; objectives: string[] };
                setBriefing(briefData);
            } catch {
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        init();
        const interval = setInterval(fetchProgress, 10000);
        return () => clearInterval(interval);
    }, [fetchProgress, router]);

    const handleLogout = async () => {
        await api.logout();
        router.push('/');
    };

    const getEvidenceCount = (round: RoundProgress) => {
        let count = 0;
        if (round.evidence_1_complete) count++;
        if (round.evidence_2_complete) count++;
        if (round.evidence_3_complete) count++;
        if (round.evidence_4_complete) count++;
        return count;
    };

    const getRoundStatus = (roundNum: number): 'locked' | 'active' | 'complete' => {
        if (!progress) return 'locked';
        const round = progress.rounds.find(r => r.round_number === roundNum);
        if (round?.completed_at) return 'complete';
        if (progress.session.currentRound >= roundNum) return 'active';
        return 'locked';
    };

    const navigateToRound = (roundNum: number) => {
        const status = getRoundStatus(roundNum);
        if (status === 'locked') return;
        router.push(`/round${roundNum}`);
    };

    const calculateIntegrity = () => {
        if (!progress) return 100;
        const completed = progress.rounds.filter(r => r.completed_at).length;
        return Math.max(20, 100 - (completed * 25));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Loading Mission Data...</p>
                </div>
            </div>
        );
    }

    const rounds = [
        {
            number: 1,
            name: 'ATTACK ON BLACKRIDGE',
            status: getRoundStatus(1),
            evidenceComplete: progress?.rounds.find(r => r.round_number === 1) ? getEvidenceCount(progress.rounds.find(r => r.round_number === 1)!) : 0,
            evidenceTotal: 5
        },
        {
            number: 2,
            name: 'DIGITAL FORENSICS',
            status: getRoundStatus(2),
            evidenceComplete: progress?.rounds.find(r => r.round_number === 2) ? getEvidenceCount(progress.rounds.find(r => r.round_number === 2)!) : 0,
            evidenceTotal: 2
        },
        {
            number: 3,
            name: 'INTERCEPTED TRANSMISSIONS',
            status: getRoundStatus(3),
            evidenceComplete: progress?.rounds.find(r => r.round_number === 3) ? getEvidenceCount(progress.rounds.find(r => r.round_number === 3)!) : 0,
            evidenceTotal: 3
        },
    ];

    const totalPoints = progress?.rounds.reduce((sum, r) => sum + (r.points || 0), 0) || 0;

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 p-4 border-b border-cyber-border/20">

                <div className="text-center lg:text-left">
                    <h1 className="text-3xl font-orbitron font-bold tracking-widest text-cyber-cyan drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                        MISSION DASHBOARD
                    </h1>
                    <p className="text-cyber-muted font-mono text-xs mt-1 uppercase tracking-tighter">
                        Operation: ENIGMA • <span className="text-red-500/80">Classification: TOP SECRET</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">

                    <div className="flex flex-col justify-center items-center btn-neon h-full min-w-[120px] px-6 py-3 font-orbitron text-sm transition-all">
                        <div className="text-[10px] text-cyber-muted font-mono uppercase leading-none mb-2">
                            Total Score
                        </div>
                        <div className="text-2xl font-orbitron font-bold text-cyber-green leading-none">
                            {totalPoints.toLocaleString()}
                        </div>
                    </div>

                    {progress?.session.expiresAt && (
                        <div className="flex flex-col justify-center items-center btn-neon h-full min-w-[120px] px-6 py-3 font-orbitron text-sm transition-all">
                            <div className="text-[10px] text-cyber-muted font-mono uppercase leading-none mb-2">
                                Time Remaining
                            </div>
                            <div className="text-2xl font-orbitron font-bold text-cyber-cyan leading-none">
                                <Countdown expiresAt={progress.session.expiresAt} />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="btn-neon h-full px-6 py-3 font-orbitron text-sm transition-all"
                    >
                        DISCONNECT
                    </button>

                </div>
            </header>

            {/* Game Complete Celebration */}
            {progress?.session.status === 'completed' && (
                <div className="mb-8 p-8 bg-[#0a0e14] border-2 border-[#00ff88] rounded-xl text-center shadow-[0_0_40px_rgba(0,255,136,0.2)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 via-transparent to-[#00ffff]/5" />
                    <div className="relative z-10">
                        <div className="text-5xl mb-4">🏆</div>
                        <h2 className="text-3xl font-orbitron font-black text-[#00ff88] tracking-widest uppercase mb-3 drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">
                            YOU CRACKED THE ENIGMA MACHINE!
                        </h2>
                        <p className="text-[#8b9db8] font-mono text-sm mb-6">All rounds completed. Mission accomplished, Investigator.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            {rounds.map(round => {
                                const roundData = progress.rounds.find(r => r.round_number === round.number);
                                return (
                                    <div key={round.number} className="p-4 bg-[#0d1117] border border-[#00ff88]/30 rounded-lg">
                                        <div className="text-[10px] text-[#00ff88] font-orbitron uppercase tracking-widest mb-1">Round {round.number}</div>
                                        <div className="text-sm text-[#8b9db8] font-mono mb-2">{round.name}</div>
                                        <div className="text-2xl font-orbitron font-bold text-[#00ff88]">{roundData?.points || 0}</div>
                                        <div className="text-[10px] text-[#8b9db8] font-mono">POINTS</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#00ff88]/20">
                            <div className="text-sm text-[#8b9db8] font-mono mb-1">TOTAL SCORE</div>
                            <div className="text-4xl font-orbitron font-black text-[#00ffff] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                                {totalPoints}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Case File */}
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-orbitron font-bold text-cyber-text flex items-center gap-2">
                                <span className="text-cyber-cyan">◆</span> CASE FILE
                            </h2>
                            <button
                                onClick={() => setShowBriefing(!showBriefing)}
                                className="text-cyber-cyan text-sm font-mono hover:underline"
                            >
                                {showBriefing ? 'HIDE BRIEFING' : 'VIEW BRIEFING'}
                            </button>
                        </div>

                        {showBriefing && briefing && (
                            <div className="mt-4 p-4 bg-cyber-dark rounded border border-cyber-border">
                                <h3 className="text-lg font-orbitron text-cyber-cyan mb-3">
                                    {briefing.title}
                                </h3>
                                <div className="text-cyber-muted font-mono text-sm whitespace-pre-line mb-4">
                                    <Typewriter text={briefing.briefing.trim()} speed={5} />
                                </div>
                                <div className="border-t border-cyber-border pt-4">
                                    <h4 className="text-sm font-bold text-cyber-text mb-2">OBJECTIVES:</h4>
                                    <ul className="space-y-1">
                                        {briefing.objectives.map((obj, i) => (
                                            <li key={i} className="text-cyber-muted text-sm font-mono flex items-start gap-2">
                                                <span className="text-cyber-green">▸</span> {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <Terminal
                            title="INCIDENT_LOG"
                            lines={[
                                { type: 'prompt', text: 'Loading incident timeline...' },
                                { type: 'output', text: '[03:47:22] ALERT: System anomaly detected' },
                                { type: 'output', text: '[03:47:45] CRITICAL: Control room offline' },
                                { type: 'error', text: '[03:48:01] EMERGENCY: Technician unresponsive' },
                                { type: 'output', text: '[03:52:17] Investigation team dispatched' },
                                { type: 'success', text: '>>> YOUR MISSION BEGINS NOW <<<' },
                            ]}
                            className="mt-4"
                        />
                    </div>

                    {/* Round Selection */}
                    <div className="card-cyber">
                        <h2 className="text-xl font-orbitron font-bold text-cyber-text mb-6 flex items-center gap-2">
                            <span className="text-cyber-cyan">◆</span> INVESTIGATION PHASES
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {rounds.map((round) => (
                                <button
                                    key={round.number}
                                    onClick={() => navigateToRound(round.number)}
                                    disabled={round.status === 'locked'}
                                    className={`
                    p-6 rounded-lg border-2 text-left transition-all
                    ${round.status === 'complete'
                                            ? 'border-cyber-green bg-cyber-green/5 hover:bg-cyber-green/10'
                                            : round.status === 'active'
                                                ? 'border-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/10 hover:shadow-lg hover:shadow-cyber-cyan/20'
                                                : 'border-cyber-border bg-cyber-dark/50 opacity-50 cursor-not-allowed'}
                  `}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`
                      text-3xl font-orbitron font-black
                      ${round.status === 'complete' ? 'text-cyber-green' :
                                                round.status === 'active' ? 'text-cyber-cyan' : 'text-cyber-muted'}
                    `}>
                                            {round.status === 'complete' ? '✓' : `0${round.number}`}
                                        </span>
                                        <span className={`badge ${round.status === 'complete' ? 'badge-complete' :
                                            round.status === 'active' ? 'badge-active' : 'badge-locked'
                                            }`}>
                                            {round.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className={`font-bold text-sm mb-2 ${round.status === 'locked' ? 'text-cyber-muted' : 'text-cyber-text'
                                        }`}>
                                        {round.name}
                                    </h3>

                                    {round.status !== 'locked' && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                                <span className="text-cyber-muted">PROGRESS</span>
                                                <span className="text-cyber-cyan">{Math.round((round.evidenceComplete / round.evidenceTotal) * 100)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${(round.evidenceComplete / round.evidenceTotal) * 100}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs font-mono">
                                                <span className="text-cyber-muted">SCORE:</span>
                                                <span className="text-cyber-text font-bold">
                                                    {progress?.rounds.find(r => r.round_number === round.number)?.points || 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* System Status */}
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4 flex items-center gap-2">
                            <span className="text-cyber-cyan">◆</span> SYSTEM STATUS
                        </h2>

                        <SystemIntegrity level={calculateIntegrity()} className="mb-6" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-cyber-dark rounded">
                                <span className="text-cyber-muted text-sm font-mono">Session</span>
                                <span className="text-cyber-green text-sm font-mono">ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-cyber-dark rounded">
                                <span className="text-cyber-muted text-sm font-mono">Encryption</span>
                                <span className="text-cyber-green text-sm font-mono">AES-256</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-cyber-dark rounded">
                                <span className="text-cyber-muted text-sm font-mono">Current Phase</span>
                                <span className="text-cyber-cyan text-sm font-mono">
                                    ROUND {progress?.session.currentRound || 1}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4 flex items-center gap-2">
                            <span className="text-cyber-cyan">◆</span> PROGRESS
                        </h2>

                        <ProgressTracker rounds={rounds} />
                    </div>

                    {/* Quick Actions */}
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4 flex items-center gap-2">
                            <span className="text-cyber-cyan">◆</span> QUICK ACCESS
                        </h2>

                        <div className="space-y-2">
                            {rounds.filter(r => r.status === 'active').map(round => (
                                <button
                                    key={round.number}
                                    onClick={() => navigateToRound(round.number)}
                                    className="w-full p-3 bg-cyber-cyan/10 border border-cyber-cyan rounded text-cyber-cyan font-mono text-sm hover:bg-cyber-cyan/20 transition-colors"
                                >
                                    CONTINUE ROUND {round.number} →
                                </button>
                            ))}

                            {progress?.session.status === 'completed' && (
                                <div className="p-4 bg-cyber-green/10 border border-cyber-green rounded text-center">
                                    <div className="text-cyber-green font-orbitron font-bold text-sm">🏆 ENIGMA CRACKED</div>
                                    <p className="text-cyber-green/70 font-mono text-xs mt-1">All rounds completed!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
