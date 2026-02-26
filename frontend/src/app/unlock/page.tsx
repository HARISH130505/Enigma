'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Terminal, Typewriter } from '@/components/ui';
import api from '@/lib/api';

const ROUND_INFO: Record<number, { name: string; description: string }> = {
    2: {
        name: 'DIGITAL FORENSICS',
        description: 'The mole has hidden critical system data. Retrieve the two Breach Keys.',
    },
    3: {
        name: 'THE INTERCEPTED TRANSMISSIONS',
        description: 'A secret military bunker intercepts urgent enemy transmissions. Decode the Morse code signals.',
    },
};

function UnlockContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetRound = parseInt(searchParams.get('next') || '2');
    const roundInfo = ROUND_INFO[targetRound];

    const [key, setKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                await api.validateSession();
            } catch {
                router.push('/');
                return;
            }
            setLoading(false);
        };
        checkSession();
    }, [router]);

    const handleSubmit = async () => {
        if (!key.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.unlockRound(targetRound, key) as {
                success: boolean;
                message: string;
                nextRound?: number;
                alreadyUnlocked?: boolean;
            };

            if (response.success) {
                setMessage({ type: 'success', text: `ACCESS GRANTED — Round ${targetRound} Unlocked!` });
                setUnlocked(true);
                setTimeout(() => {
                    router.push(`/round${targetRound}`);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Key validation failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050a0f]">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Validating session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050a0f] p-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ffff]/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔐</div>
                    <h1 className="text-3xl font-orbitron font-black text-[#00ffff] tracking-tighter mb-2">
                        ROUND {targetRound} LOCKED
                    </h1>
                    {roundInfo && (
                        <p className="text-[#00ffff]/70 font-mono text-sm uppercase tracking-wider">
                            {roundInfo.name}
                        </p>
                    )}
                </div>

                {/* Card */}
                <div className="bg-[#0a0e14] border-2 border-[#00ffff]/30 rounded-xl p-8 shadow-[0_0_40px_rgba(0,255,255,0.1)]">
                    {/* Narrative */}
                    <div className="mb-6 p-4 bg-[#0d1117] rounded-lg border border-[#00ffff]/10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-red-500 animate-pulse text-sm">●</span>
                            <span className="text-red-400 font-orbitron text-[10px] uppercase tracking-widest font-bold">
                                Secure Access Required
                            </span>
                        </div>
                        <p className="text-[#8b9db8] font-mono text-xs leading-relaxed">
                            Round {targetRound - 1} complete. To proceed to the next mission phase,
                            enter the encryption key provided to your team.
                            This key unlocks access to <span className="text-[#00ffff] font-bold">{roundInfo?.name}</span>.
                        </p>
                    </div>

                    {/* Key Input */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[#8b9db8] text-[10px] font-mono uppercase tracking-widest mb-2">
                                Encryption Key
                            </label>
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value.toUpperCase())}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter key to unlock..."
                                disabled={unlocked}
                                className="w-full bg-[#0d1117] text-[#e0e0e0] font-mono text-lg p-4 rounded-lg border-2 border-[#00ffff]/30 focus:border-[#00ffff] focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] text-center tracking-[0.3em] placeholder:text-[#333] placeholder:tracking-normal transition-all"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!key.trim() || submitting || unlocked}
                            className={`
                                w-full py-4 rounded-lg font-orbitron font-bold text-sm uppercase tracking-widest transition-all
                                ${unlocked
                                    ? 'bg-[#00ff88]/20 text-[#00ff88] border-2 border-[#00ff88]'
                                    : 'bg-[#00ffff]/10 text-[#00ffff] border-2 border-[#00ffff] hover:bg-[#00ffff]/20 hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]'
                                }
                                disabled:opacity-40 disabled:cursor-not-allowed
                            `}
                        >
                            {unlocked ? '✓ ACCESS GRANTED' : submitting ? 'VALIDATING...' : 'SUBMIT KEY'}
                        </button>

                        {message && (
                            <div className={`p-4 rounded-lg border-2 font-mono text-sm text-center ${message.type === 'success'
                                ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                                : 'bg-red-500/10 border-red-500 text-red-400'
                                }`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Terminal */}
                <div className="mt-6">
                    <Terminal
                        title="ACCESS_CONTROL"
                        lines={[
                            { type: 'prompt', text: `Awaiting Round ${targetRound} access key...` },
                            { type: 'output', text: `Target: ${roundInfo?.name || 'UNKNOWN'}` },
                            { type: 'output', text: `Security Level: CLASSIFIED` },
                            {
                                type: unlocked ? 'success' : 'error',
                                text: unlocked
                                    ? `>>> KEY ACCEPTED — INITIATING ROUND ${targetRound} <<<`
                                    : 'Waiting for valid encryption key...'
                            },
                        ]}
                    />
                </div>

                {/* Back link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-[#8b9db8] hover:text-[#00ffff] font-mono text-xs transition-colors"
                    >
                        ← Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UnlockPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050a0f]">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Loading...</p>
                </div>
            </div>
        }>
            <UnlockContent />
        </Suspense>
    );
}
