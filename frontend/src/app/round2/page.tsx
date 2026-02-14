'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, AccessMessage } from '@/components/ui';
import api from '@/lib/api';

interface RoundStatus {
    locked: boolean;
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
    points: number;
    checkpointUnlocked: boolean;
    completed: boolean;
}

// Phase 1: The 120-Second Shadow
function TimeGapPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [indicesSum, setIndicesSum] = useState('');
    const [conversionComplete, setConversionComplete] = useState(false);
    const [sortingComplete, setSortingComplete] = useState(false);
    const [gapIdentified, setGapIdentified] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sample timestamps (in reality, there would be 150+ timestamps)
    const timestamps = [
        '09:41:00', '09:42:15', '09:43:00', '09:44:02', '09:44:50',
        '09:45:00', '09:46:12', '09:47:00', '09:48:30', '09:50:30'
    ];

    const handleSubmit = async () => {
        if (!indicesSum) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Phase1({
                indicesSum: parseInt(indicesSum),
                conversionComplete,
                sortingComplete,
                gapIdentified
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message}` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message}` });
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ KEY 1 ACQUIRED</div>
                <p className="text-cyber-muted text-sm">120-second gap identified successfully</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyber-cyan">🔍</span>
                    <p className="text-cyber-muted text-sm font-mono">
                        Find two consecutive timestamps exactly 120 seconds apart. Convert AM/PM to 24-hour, sort chronologically, and identify the gap.
                    </p>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6">
                    <div className="grid grid-cols-2 gap-2 text-cyber-muted border-b border-cyber-border pb-2 mb-2">
                        <span>INDEX</span>
                        <span>TIMESTAMP</span>
                    </div>
                    {timestamps.map((time, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2 py-1 hover:bg-cyber-cyan/5 transition-colors">
                            <span className="text-cyber-muted">[{idx}]</span>
                            <span className="text-cyber-text">{time}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={conversionComplete} onChange={() => setConversionComplete(!conversionComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${conversionComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">AM/PM to 24-hour conversion (10 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={sortingComplete} onChange={() => setSortingComplete(!sortingComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${sortingComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Chronological sorting (10 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={gapIdentified} onChange={() => setGapIdentified(!gapIdentified)} className="hidden" />
                        <span className={`w-3 h-3 border ${gapIdentified ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">120-second gap identified (10 pts)</span>
                    </label>
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Sum of Indices (Second Timestamp)
                    </label>
                    <input
                        type="number"
                        value={indicesSum}
                        onChange={(e) => setIndicesSum(e.target.value)}
                        placeholder="Enter index sum"
                        className="input-cyber text-center text-lg"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!indicesSum || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'VALIDATING...' : 'UNLOCK KEY 1'}
            </button>
        </div>
    );
}

// Phase 2: Holy Trinity
function HolyTrinityPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [rowId, setRowId] = useState('');
    const [vowelCheckComplete, setVowelCheckComplete] = useState(false);
    const [lengthMathCheckComplete, setLengthMathCheckComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sample System Map data (50 rows in reality)
    const systemMap = [
        { id: 'ROW-10', folder: 'DATA', size: 120 },
        { id: 'ROW-15', folder: 'LOG', size: 99 },
        { id: 'ROW-23', folder: 'TMP', size: 45 },
        { id: 'ROW-42', folder: 'COIN', size: 180 },
        { id: 'ROW-55', folder: 'SYS', size: 333 },
    ];

    const handleSubmit = async () => {
        if (!rowId) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Phase2({
                rowId,
                vowelCheckComplete,
                lengthMathCheckComplete
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message}` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message}` });
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ KEY 2 ACQUIRED</div>
                <p className="text-cyber-muted text-sm">Holy Trinity rules applied successfully</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyber-cyan">🔍</span>
                    <p className="text-cyber-muted text-sm font-mono">
                        Apply the Rule of Three: Find the folder with exactly 2 vowels (O, I), exactly 4 characters long, and file size multiple of 3.
                    </p>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6">
                    <div className="grid grid-cols-3 gap-2 text-cyber-muted border-b border-cyber-border pb-2 mb-2">
                        <span>ROW ID</span>
                        <span>FOLDER</span>
                        <span>SIZE</span>
                    </div>
                    {systemMap.map((row) => (
                        <div key={row.id} className="grid grid-cols-3 gap-2 py-1 hover:bg-cyber-cyan/5 transition-colors">
                            <span className="text-cyber-muted">{row.id}</span>
                            <span className="text-cyber-text">{row.folder}</span>
                            <span className="text-cyber-text">{row.size}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={vowelCheckComplete} onChange={() => setVowelCheckComplete(!vowelCheckComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${vowelCheckComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Vowel count logic (exactly 2: O, I) (10 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={lengthMathCheckComplete} onChange={() => setLengthMathCheckComplete(!lengthMathCheckComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${lengthMathCheckComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Length (4 chars) + Math (÷3) rules (10 pts)</span>
                    </label>
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Row ID
                    </label>
                    <input
                        type="text"
                        value={rowId}
                        onChange={(e) => setRowId(e.target.value.toUpperCase())}
                        placeholder="ROW-XX"
                        className="input-cyber text-center text-lg"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!rowId || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'VALIDATING...' : 'UNLOCK KEY 2'}
            </button>
        </div>
    );
}

// Phase 3: The Hexa Vault
function HexaVaultPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [riddleAnswer, setRiddleAnswer] = useState('');
    const [base64CleaningComplete, setBase64CleaningComplete] = useState(false);
    const [hexConversionComplete, setHexConversionComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Sample encoded string (in reality, this would be the actual Base64 string with symbols)
    const encodedString = "#!@VEhFIE1PUkUgWU9VIFRBS0UsIFRIRSBNT1JFIFlPVSBMRUFWRSBCRUhJTkQu";

    const handleSubmit = async () => {
        if (!riddleAnswer) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Phase3({
                riddleAnswer,
                base64CleaningComplete,
                hexConversionComplete
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message}` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message}` });
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ KEY 3 ACQUIRED</div>
                <p className="text-cyber-muted text-sm">Hexa Vault decrypted successfully</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyber-cyan">🔐</span>
                    <p className="text-cyber-muted text-sm font-mono">
                        Decrypt the vault: Clean Base64 → Decode to Hex → Convert to ASCII → Solve the riddle
                    </p>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6">
                    <div className="text-cyber-muted text-xs mb-2">ENCRYPTED DATA:</div>
                    <div className="text-cyber-text break-all">{encodedString}</div>
                </div>

                <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={base64CleaningComplete} onChange={() => setBase64CleaningComplete(!base64CleaningComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${base64CleaningComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Layer 1: Base64 cleaning (10 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={hexConversionComplete} onChange={() => setHexConversionComplete(!hexConversionComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${hexConversionComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Layer 2: Hex to ASCII (10 pts)</span>
                    </label>
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Layer 3: Riddle Answer (15 pts)
                    </label>
                    <input
                        type="text"
                        value={riddleAnswer}
                        onChange={(e) => setRiddleAnswer(e.target.value.toUpperCase())}
                        placeholder="What has a head and a tail but no body?"
                        className="input-cyber text-center text-lg"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!riddleAnswer || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'DECRYPTING...' : 'UNLOCK KEY 3'}
            </button>
        </div>
    );
}

// Final Challenge: Round 2 Checkpoint
function FinalChallenge({
    unlocked,
    onComplete
}: {
    unlocked: boolean;
    onComplete: () => void;
}) {
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Checkpoint(code) as { success: boolean; message: string };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Validation failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!unlocked) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-border opacity-50">
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-orbitron text-cyber-muted mb-2 uppercase">Checkpoint Locked</h3>
                    <p className="text-cyber-muted text-xs font-mono">Complete all 3 phases to unlock Round 3</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-cyan animate-glow shadow-[0_0_30px_rgba(0,255,255,0.15)] relative overflow-hidden">
            <div className="text-center mb-8">
                <div className="text-4xl mb-4">🔓</div>
                <h3 className="text-2xl font-orbitron text-cyber-cyan mb-2">AUDIT TOKEN</h3>
                <p className="text-cyber-muted text-sm font-mono tracking-tighter">Combine all three keys (KEY1-KEY2-KEY3)</p>
            </div>

            <div className="space-y-6">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="7-ROW-42-COIN"
                    className="input-cyber text-center text-xl tracking-[0.2em] font-bold"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!code.trim() || submitting}
                    className="btn-neon w-full success"
                >
                    {submitting ? 'VERIFYING...' : 'PROCEED TO ROUND 3'}
                </button>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm text-center`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

// Main Page
export default function Round2Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<number>(1);
    const [showAccessMessage, setShowAccessMessage] = useState<{ type: 'granted' | 'denied'; message: string } | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const [statusData, timerData] = await Promise.all([
                api.getRound2Status() as Promise<RoundStatus>,
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

    const handlePhaseComplete = (phaseNum: number) => {
        setShowAccessMessage({ type: 'granted', message: `Key ${phaseNum} Acquired!` });
        setTimeout(() => {
            setShowAccessMessage(null);
            fetchStatus();
            if (phaseNum < 3) {
                setActivePhase(phaseNum + 1);
            }
        }, 2000);
    };

    const handleAllComplete = () => {
        setShowAccessMessage({ type: 'granted', message: 'Mischief Triathlon Complete! Proceeding to Round 3...' });
        setTimeout(() => {
            router.push('/round3');
        }, 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cyber-black">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-cyan font-mono animate-pulse">Synchronizing Triathlon Data...</p>
                </div>
            </div>
        );
    }

    const phases = [
        { num: 1, title: '120-Second Shadow', complete: status?.phase1 },
        { num: 2, title: 'Holy Trinity', complete: status?.phase2 },
        { num: 3, title: 'Hexa Vault', complete: status?.phase3 },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8 bg-cyber-black bg-grid">
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
                        className="text-cyber-muted hover:text-cyber-cyan text-xs font-mono mb-2 flex items-center gap-2 transition-colors"
                    >
                        &lt; RETURN TO COMMAND CENTER
                    </button>
                    <h1 className="text-4xl font-orbitron font-black text-cyber-cyan tracking-tighter">
                        ROUND 2: <span className="text-cyber-text">THE MISCHIEF TRIATHLON</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Side Navigation */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="card-cyber">
                        <h2 className="text-xs font-orbitron font-bold text-cyber-cyan mb-4 uppercase tracking-[0.2em]">Triathlon Phases</h2>
                        <div className="space-y-3">
                            {phases.map((phase) => (
                                <button
                                    key={phase.num}
                                    onClick={() => setActivePhase(phase.num)}
                                    className={`
                                        w-full p-4 rounded-lg border text-left transition-all font-mono text-sm relative group
                                        ${activePhase === phase.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : phase.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue/50 text-cyber-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${phase.complete ? 'bg-cyber-green' : 'bg-current opacity-30'} group-hover:animate-pulse`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase opacity-50">Phase 0{phase.num}</span>
                                            <span className="font-bold">{phase.title}</span>
                                        </div>
                                    </div>
                                    {phase.complete && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card-cyber border-cyber-cyan/30">
                        <h2 className="text-xs font-orbitron font-bold text-cyber-cyan mb-2 uppercase">MISSION LOG</h2>
                        <div className="text-[10px] font-mono text-cyber-muted space-y-1">
                            <p>&gt; Breach Detected: 29m ago</p>
                            <p>&gt; Countermeasures: Active</p>
                            <p>&gt; Progress: {Math.round([status?.phase1, status?.phase2, status?.phase3].filter(Boolean).length / 3 * 100)}%</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-6">
                    <div className="card-cyber min-h-[500px]">
                        <div className="flex items-center justify-between mb-8 border-b border-cyber-border pb-4">
                            <h2 className="text-2xl font-orbitron font-bold text-cyber-text flex items-center gap-3">
                                <span className="text-cyber-cyan font-black">0{activePhase}</span>
                                {phases[activePhase - 1].title}
                            </h2>
                            {phases[activePhase - 1].complete && (
                                <span className="bg-cyber-green/20 text-cyber-green text-[10px] px-2 py-1 rounded border border-cyber-green/50 font-bold font-mono">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        {activePhase === 1 && (
                            <TimeGapPuzzle
                                onComplete={() => handlePhaseComplete(1)}
                                disabled={status?.phase1 || false}
                            />
                        )}

                        {activePhase === 2 && (
                            <HolyTrinityPuzzle
                                onComplete={() => handlePhaseComplete(2)}
                                disabled={status?.phase2 || false}
                            />
                        )}

                        {activePhase === 3 && (
                            <HexaVaultPuzzle
                                onComplete={() => handlePhaseComplete(3)}
                                disabled={status?.phase3 || false}
                            />
                        )}
                    </div>
                </div>

                {/* Final Answer Column */}
                <div className="lg:col-span-3">
                    <FinalChallenge
                        unlocked={status?.checkpointUnlocked || false}
                        onComplete={handleAllComplete}
                    />

                    <div className="mt-6">
                        <Terminal
                            title="AUDIT_CORE"
                            lines={[
                                { type: 'prompt', text: 'Waiting for keys...' },
                                { type: 'output', text: `KEY_1_STATE: ${status?.phase1 ? 'STABLE' : 'LOCKED'}` },
                                { type: 'output', text: `KEY_2_STATE: ${status?.phase2 ? 'STABLE' : 'LOCKED'}` },
                                { type: 'output', text: `KEY_3_STATE: ${status?.phase3 ? 'STABLE' : 'LOCKED'}` },
                                {
                                    type: status?.checkpointUnlocked ? 'success' : 'error',
                                    text: status?.checkpointUnlocked ? 'CHECKPOINT_READY' : 'INSUFFICIENT_DATA'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
