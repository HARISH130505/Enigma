'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, AccessMessage } from '@/components/ui';
import api from '@/lib/api';

interface RoundStatus {
    locked: boolean;
    phase1: boolean;
    points: number;
    checkpointUnlocked: boolean;
    completed: boolean;
}

function HexaVaultPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [steps, setSteps] = useState({ filtered: false, decoded: false });
    const [keyword, setKeyword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const hexData = "56 4F 49 44"; // VOID

    const handleSubmit = async () => {
        if (!keyword) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound3Phase1({
                filtered: steps.filtered,
                decoded: steps.decoded,
                keyword: keyword
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message} (+${response.pointsEarned} Points)` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message} (-${response.pointsDeducted} Points)` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-xl font-mono mb-2">✓ VAULT DATA DECRYPTED</div>
                <p className="text-cyber-muted text-sm">Key 3 successfully extracted</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-6">
                    Analyze the encrypted hexadecimal data. Filter the noise, decode the characters, and extract the 4-letter keyword.
                </p>

                <div className="bg-cyber-darker rounded border border-cyber-border p-8 mb-6 text-center">
                    <div className="text-xs text-cyber-muted mb-2 font-mono uppercase tracking-widest">Encrypted Stream</div>
                    <div className="text-4xl font-mono text-cyber-cyan tracking-[0.5em] animate-pulse">
                        {hexData}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-cyber-border rounded hover:bg-cyber-cyan/5 transition-colors">
                        <input type="checkbox" checked={steps.filtered} onChange={() => setSteps({ ...steps, filtered: !steps.filtered })} className="hidden" />
                        <span className={`w-4 h-4 border ${steps.filtered ? 'bg-cyber-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted uppercase font-bold tracking-tighter">Filter Noise</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-cyber-border rounded hover:bg-cyber-cyan/5 transition-colors">
                        <input type="checkbox" checked={steps.decoded} onChange={() => setSteps({ ...steps, decoded: !steps.decoded })} className="hidden" />
                        <span className={`w-4 h-4 border ${steps.decoded ? 'bg-cyber-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted uppercase font-bold tracking-tighter">Decode ASCII</span>
                    </label>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-3 mb-6">
                    <div className="text-[10px] text-cyber-muted mb-2 font-mono">ASCII_REF:</div>
                    <div className="grid grid-cols-4 gap-2 font-mono text-[9px] text-cyber-muted">
                        <span className="text-cyber-cyan">56:V</span><span className="text-cyber-cyan">4F:O</span><span className="text-cyber-cyan">49:I</span><span className="text-cyber-cyan">44:D</span>
                        <span>48:H</span><span>41:A</span><span>43:C</span><span>4B:K</span>
                    </div>
                </div>

                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                    placeholder="KEYWORD (4 CHARS)"
                    className="input-cyber text-center text-2xl font-bold tracking-[0.3em]"
                    maxLength={4}
                />
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!keyword || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'PROCESSING...' : 'UNBOLT HEXA VAULT'}
            </button>
        </div>
    );
}

// Final Checkpoint Component
function FinalCheckpointPuzzle({
    onComplete,
    disabled,
    locked
}: {
    onComplete: () => void;
    disabled: boolean;
    locked: boolean;
}) {
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound3Complete(code) as {
                success: boolean;
                message: string;
            };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                setTimeout(onComplete, 2000);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Endpoint validation failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ ACCESS GRANTED</div>
                <p className="text-cyber-muted text-sm">Mole identified. Mission complete.</p>
            </div>
        );
    }

    if (locked) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-border text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-orbitron text-cyber-muted mb-2 uppercase tracking-widest">Master Key Locked</h3>
                <p className="text-cyber-muted text-xs font-mono">
                    Decrypt the vault first to reveal the master key.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🗝️</div>
                    <h3 className="text-xl font-orbitron text-cyber-cyan mb-2">MASTER KEY REQUIRED</h3>
                    <p className="text-cyber-muted text-sm font-mono tracking-tighter">
                        Combine all three keys: (Key1)-(Key2)-(Key3)
                    </p>
                </div>

                <div className="flex gap-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="X-FILE-XXX-XXXX"
                        className="input-cyber flex-1 text-center text-lg tracking-widest"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!code.trim() || submitting}
                        className="btn-neon success"
                    >
                        {submitting ? '...' : 'FINALIZE'}
                    </button>
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm text-center`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Round 3 Page
export default function Round3Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [showAccessMessage, setShowAccessMessage] = useState<{ type: 'granted' | 'denied'; message: string } | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const [statusData, timerData] = await Promise.all([
                api.getRound3Status() as Promise<RoundStatus>,
                api.getTimer() as Promise<{ expiresAt: string }>
            ]);

            if (statusData.locked) {
                router.push('/dashboard');
                return;
            }

            setStatus(statusData);
            setExpiresAt(timerData.expiresAt);
        } catch {
            router.push('/dashboard');
        }
    }, [router]);

    useEffect(() => {
        fetchStatus().finally(() => setLoading(false));
    }, [fetchStatus]);

    const handleStepComplete = (stepNum: number) => {
        setShowAccessMessage({ type: 'granted', message: `Step ${stepNum} Complete` });
        setTimeout(() => {
            setShowAccessMessage(null);
            fetchStatus();
            if (stepNum < 2) {
                setActiveStep(stepNum + 1);
            }
        }, 2000);
    };

    const handleMissionComplete = () => {
        setShowAccessMessage({ type: 'granted', message: 'MISSION COMPLETE!' });
        setTimeout(() => {
            router.push('/finale');
        }, 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Tuning into the signal...</p>
                </div>
            </div>
        );
    }

    const steps = [
        { num: 1, title: 'Hexa Vault Decryption', complete: status?.phase1 },
        { num: 2, title: 'Final Master Key', complete: status?.completed },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8">
            {showAccessMessage && (
                <AccessMessage
                    type={showAccessMessage.type}
                    message={showAccessMessage.message}
                    onComplete={() => setShowAccessMessage(null)}
                />
            )}

            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-cyber-muted hover:text-cyber-cyan text-sm font-mono mb-2 flex items-center gap-2"
                    >
                        ← BACK TO DASHBOARD
                    </button>
                    <h1 className="text-3xl font-orbitron font-bold text-cyber-cyan tracking-tighter uppercase">
                        ROUND 3: <span className="text-cyber-text">THE HEXA VAULT</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center">
                    <div className="text-center px-6 py-3 bg-cyber-dark rounded border border-cyber-border mr-8">
                        <div className="text-xs text-cyber-muted font-mono mb-1">ROUND SCORE</div>
                        <div className="text-2xl font-orbitron font-bold text-cyber-green">{status?.points || 0}</div>
                    </div>

                    {expiresAt && (
                        <div className="text-center px-6 py-3 bg-cyber-dark rounded border border-cyber-border mr-8">
                            <div className="text-xs text-cyber-muted font-mono mb-1">TIME REMAINING</div>
                            <Countdown expiresAt={expiresAt} />
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono font-bold rounded"
                    >
                        DISCONNECT
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Step Tabs */}
                <div className="lg:col-span-1">
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">STEPS</h2>
                        <div className="space-y-2">
                            {steps.map((step) => (
                                <button
                                    key={step.num}
                                    onClick={() => setActiveStep(step.num)}
                                    className={`
                                        w-full p-4 rounded-lg border text-left transition-all font-mono text-sm relative
                                        ${activeStep === step.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : step.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue text-cyber-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${step.complete ? 'bg-cyber-green' : 'bg-current opacity-30'} group-hover:animate-pulse`} />
                                        <span>{step.title}</span>
                                    </div>
                                    {step.complete && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mission Status */}
                    <div className="mt-6 card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">MISSION STATUS</h2>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-muted">Vault State</span>
                                <span className={status?.phase1 ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.phase1 ? 'DECRYPTED' : 'LOCKED'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-muted">Master Key</span>
                                <span className={status?.completed ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.completed ? 'VERIFIED' : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Step Panel */}
                <div className="lg:col-span-3">
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-orbitron font-bold text-cyber-text">
                                STEP {activeStep}: {steps[activeStep - 1].title}
                            </h2>
                            {steps[activeStep - 1].complete && (
                                <span className="badge badge-complete">COMPLETE</span>
                            )}
                        </div>

                        {activeStep === 1 && (
                            <HexaVaultPuzzle
                                onComplete={() => handleStepComplete(1)}
                                disabled={status?.phase1 || false}
                            />
                        )}

                        {activeStep === 2 && (
                            <FinalCheckpointPuzzle
                                onComplete={handleMissionComplete}
                                disabled={status?.completed || false}
                                locked={!status?.phase1}
                            />
                        )}
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6">
                        <Terminal
                            title="SIGNAL_ANALYSIS"
                            lines={[
                                { type: 'prompt', text: 'Initializing vault bypass...' },
                                { type: 'output', text: `[STAGE 1] Hex Decryption: ${status?.phase1 ? 'STABLE' : 'LOCKED'}` },
                                { type: 'output', text: `[STAGE 2] Master Key: ${status?.completed ? 'VERIFIED' : 'AWAITING'}` },
                                {
                                    type: status?.completed ? 'success' : 'output',
                                    text: status?.completed
                                        ? '>>> VAULT BYPASSED - DOWNLOAD ENIGMA_LEAK.PDF <<<'
                                        : '[SECURE] Complete all stages to finalize breach'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
