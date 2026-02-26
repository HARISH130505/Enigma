'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, AccessMessage } from '@/components/ui';
import api from '@/lib/api';

interface RoundStatus {
    locked: boolean;
    level1: boolean;
    level2: boolean;
    points: number;
    completed: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Code Compiler Component (embedded in each level)
// ═══════════════════════════════════════════════════════════════
function CodeCompiler({ phaseLabel, onUseOutput }: { phaseLabel: string; onUseOutput?: (output: string) => void }) {
    const [language, setLanguage] = useState<'python' | 'java' | 'javascript'>('python');
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [running, setRunning] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleRun = async () => {
        if (!code.trim()) return;
        setRunning(true);
        setOutput('');
        setError('');

        try {
            const result = await api.runCode(language, code) as {
                success: boolean;
                output: string;
                error: string | null;
            };
            if (result.success) {
                setOutput(result.output || '(no output)');
                if (result.error) setError(result.error);
            } else {
                setError(result.error || 'Execution failed.');
            }
        } catch (err) {
            setError('Compiler service unavailable.');
        } finally {
            setRunning(false);
        }
    };

    const placeholders: Record<string, string> = {
        java: `public class Main {\n    public static void main(String[] args) {\n        // Write your ${phaseLabel} code here\n        System.out.println("Hello World");\n    }\n}`,
        python: `# Write your ${phaseLabel} code here\nprint("Hello World")`,
        javascript: `// Write your ${phaseLabel} code here\nconsole.log("Hello World");`,
    };

    return (
        <div className="mt-4 border border-cyber-border rounded-lg overflow-hidden">
            {/* Toggle bar */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-cyber-darker hover:bg-cyber-dark transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-cyber-green text-sm">⌨</span>
                    <span className="text-cyber-cyan font-mono text-xs font-bold uppercase tracking-wider">
                        Code Runner — {phaseLabel}
                    </span>
                </div>
                <span className="text-cyber-muted text-xs font-mono">
                    {collapsed ? '▶ EXPAND' : '▼ COLLAPSE'}
                </span>
            </button>

            {!collapsed && (
                <div className="p-4 bg-cyber-darker space-y-3">
                    {/* Language selector */}
                    <div className="flex items-center gap-2">
                        {(['python', 'java', 'javascript'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`
                                    px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all
                                    ${language === lang
                                        ? lang === 'python'
                                            ? 'bg-[#3776AB]/20 text-[#3776AB] border border-[#3776AB]'
                                            : lang === 'java'
                                                ? 'bg-[#b07219]/20 text-[#b07219] border border-[#b07219]'
                                                : 'bg-[#F7DF1E]/20 text-[#F7DF1E] border border-[#F7DF1E]'
                                        : 'bg-cyber-dark text-cyber-muted border border-cyber-border hover:border-cyber-cyan/50'
                                    }
                                `}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {/* Code editor */}
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={placeholders[language]}
                        rows={10}
                        className="w-full bg-[#0a0e14] text-[#e0e0e0] font-mono text-sm p-4 rounded border border-cyber-border focus:border-cyber-cyan focus:outline-none resize-y placeholder:text-[#555] caret-white"
                        spellCheck={false}
                    />

                    {/* Run button */}
                    <button
                        onClick={handleRun}
                        disabled={!code.trim() || running}
                        className={`
                            w-full py-2.5 rounded font-mono text-sm font-bold uppercase tracking-wider transition-all
                            ${running
                                ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/50 animate-pulse'
                                : 'bg-cyber-green/20 text-cyber-green border border-cyber-green hover:bg-cyber-green/30 hover:shadow-[0_0_15px_rgba(0,255,100,0.2)]'
                            }
                            disabled:opacity-40 disabled:cursor-not-allowed
                        `}
                    >
                        {running ? '⟳ EXECUTING...' : '▶ RUN CODE'}
                    </button>

                    {/* Output panel */}
                    {(output || error) && (
                        <div className="bg-[#0a0e14] rounded border border-cyber-border p-4 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] text-cyber-muted font-mono uppercase tracking-widest">
                                    CONSOLE OUTPUT:
                                </div>
                                {output && onUseOutput && (
                                    <button
                                        onClick={() => onUseOutput(output.trim())}
                                        className="px-3 py-1 rounded font-mono text-[10px] font-bold uppercase bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan hover:bg-cyber-cyan/30 transition-all"
                                    >
                                        ⬇ USE AS KEY
                                    </button>
                                )}
                            </div>
                            {output && (
                                <pre className="text-cyber-green font-mono text-xs whitespace-pre-wrap break-words">
                                    {output}
                                </pre>
                            )}
                            {error && (
                                <pre className="text-cyber-red font-mono text-xs whitespace-pre-wrap break-words mt-1">
                                    {error}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Level 1: Holy Trinity
// ═══════════════════════════════════════════════════════════════
function HolyTrinityPuzzle({
    onComplete,
    disabled
}: {
    onComplete: (roundComplete: boolean) => void;
    disabled: boolean;
}) {
    const [rowId, setRowId] = useState('');
    const [vowelCheckComplete, setVowelCheckComplete] = useState(false);
    const [lengthMathCheckComplete, setLengthMathCheckComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [systemMap, setSystemMap] = useState<Array<{ rowId: number; folder: string; size: number }>>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!disabled) {
            api.getLevel1Data().then((data: any) => {
                setSystemMap(data.systemMap || []);
                setLoadingData(false);
            }).catch(() => setLoadingData(false));
        }
    }, [disabled]);

    const handleSubmit = async () => {
        if (!rowId) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Level1({
                rowId,
                vowelCheckComplete,
                lengthMathCheckComplete
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
                roundComplete?: boolean;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message}` });
                setTimeout(() => onComplete(response.roundComplete || false), 1500);
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ BREACH KEY 1 ACQUIRED</div>
                <p className="text-cyber-muted text-sm">Holy Trinity rules applied successfully</p>
            </div>
        );
    }

    if (loadingData) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-border text-center">
                <div className="loader mx-auto mb-2" />
                <p className="text-cyber-cyan font-mono text-sm animate-pulse">Loading system map...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyber-cyan">🔍</span>
                    <p className="text-cyber-muted text-sm font-mono">
                        The mole's filtration system is wiped. Debug the provided script below to identify the stolen file from the System Map.
                        Retrieve "The Rules" you must follow to find the ID Number of the matching row.
                    </p>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6 max-h-72 overflow-y-auto">
                    <div className="text-[10px] text-cyber-yellow mb-2 uppercase tracking-widest">system_validator.py [BUGGED]</div>
                    <pre className="text-[11px] leading-relaxed text-cyber-muted"><code className="language-python">{`import sys\nimport os\n\nclass RuleEngine:\n\n    def __init__(self, version = "3.0"\n        self.version = version\n        self.rules = {\n            "a": "Rule:",\n            "b": "• Exactly 3 vowels",\n            "c": "• Exactly 3 characters",\n            "d": "• File size multiple of 3"\n        }\n\n    def validate(self):\n        print("=" * 40\n\n        for key value in self.rules.items():\n            if key != None\n                print(self.rules[key]\n\n        print("=" * 40))\n\ndef boot_sequence():\n    engine = RuleEngine(\n\n    try\n        engine.validate()\n    except Exception as e:\n        print("System Failure:", e\n\nif __name__ == "__main__"\n    boot_sequence()`}</code></pre>
                </div>

                {/* System map table */}
                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6 max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2 text-cyber-muted border-b border-cyber-border pb-2 mb-2 sticky top-0 bg-cyber-darker">
                        <span className="col-span-1">ROW ID</span>
                        <span className="col-span-1">FOLDER</span>
                        <span className="col-span-1">SIZE</span>
                        <span className="col-span-1">ROW ID</span>
                        <span className="col-span-1">FOLDER</span>
                        <span className="col-span-1">SIZE</span>
                    </div>
                    {/* Display in two-column layout */}
                    {Array.from({ length: 25 }).map((_, i) => {
                        const left = systemMap[i];
                        const right = systemMap[i + 25];
                        return (
                            <div key={i} className="grid grid-cols-6 gap-2 py-1 hover:bg-cyber-cyan/5 transition-colors text-xs">
                                {left && (
                                    <>
                                        <span className="text-cyber-muted">{left.rowId}</span>
                                        <span className="text-cyber-text">{left.folder}</span>
                                        <span className="text-cyber-text">{left.size}</span>
                                    </>
                                )}
                                {!left && <><span /><span /><span /></>}
                                {right && (
                                    <>
                                        <span className="text-cyber-muted">{right.rowId}</span>
                                        <span className="text-cyber-text">{right.folder}</span>
                                        <span className="text-cyber-text">{right.size}</span>
                                    </>
                                )}
                                {!right && <><span /><span /><span /></>}
                            </div>
                        );
                    })}
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

                <div className="mb-6">
                    <CodeCompiler phaseLabel="Level 1 — System Map Filter" onUseOutput={(val) => setRowId(val)} />
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Row ID (Breach Key 1)
                    </label>
                    <input
                        type="text"
                        value={rowId}
                        onChange={(e) => setRowId(e.target.value)}
                        placeholder="Enter Row ID"
                        className="input-cyber text-center text-lg w-full"
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
                {submitting ? 'VALIDATING...' : 'UNLOCK BREACH KEY 1'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Level 2: The Hexa Vault
// ═══════════════════════════════════════════════════════════════
function HexaVaultPuzzle({
    onComplete,
    disabled
}: {
    onComplete: (roundComplete: boolean) => void;
    disabled: boolean;
}) {
    const [riddleAnswer, setRiddleAnswer] = useState('');
    const [hexCleaningComplete, setHexCleaningComplete] = useState(false);
    const [hexDecodingComplete, setHexDecodingComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const encryptedString = '$$492068696465207365637265747320696e20636f64652e205768617420616d20493f##';

    const handleSubmit = async () => {
        if (!riddleAnswer) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Level2({
                riddleAnswer,
                hexCleaningComplete,
                hexDecodingComplete
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
                roundComplete?: boolean;
            };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message}` });
                setTimeout(() => onComplete(response.roundComplete || false), 1500);
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ BREACH KEY 2 ACQUIRED</div>
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
                        Decrypt the vault: Strip noise characters → Extract hex digits → Convert hex to ASCII → Solve the riddle
                    </p>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 font-mono text-sm mb-6">
                    <div className="text-cyber-muted text-xs mb-2">ENCRYPTED DATA:</div>
                    <div className="text-cyber-text break-all text-xs leading-relaxed">{encryptedString}</div>
                </div>

                <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={hexCleaningComplete} onChange={() => setHexCleaningComplete(!hexCleaningComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${hexCleaningComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Layer 1: Strip noise characters & extract hex (10 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-cyber-border rounded hover:bg-cyber-cyan/5">
                        <input type="checkbox" checked={hexDecodingComplete} onChange={() => setHexDecodingComplete(!hexDecodingComplete)} className="hidden" />
                        <span className={`w-3 h-3 border ${hexDecodingComplete ? 'bg-cyber-cyan' : ''}`} />
                        <span className="text-xs font-mono text-cyber-muted">Layer 2: Hex to ASCII conversion (10 pts)</span>
                    </label>
                </div>

                <div className="mb-6">
                    <CodeCompiler phaseLabel="Level 2 — Hex Decryption" onUseOutput={(val) => setRiddleAnswer(val.toUpperCase())} />
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Layer 3: Riddle Answer (Breach Key 2)
                    </label>
                    <input
                        type="text"
                        value={riddleAnswer}
                        onChange={(e) => setRiddleAnswer(e.target.value.toUpperCase())}
                        placeholder="Enter Riddle Answer"
                        className="input-cyber text-center text-lg w-full"
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
                {submitting ? 'DECRYPTING...' : 'UNLOCK BREACH KEY 2'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
export default function Round2Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activeLevel, setActiveLevel] = useState<number>(1);
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

    const handleLevelComplete = (levelNum: number, roundComplete: boolean) => {
        if (roundComplete) {
            setShowAccessMessage({ type: 'granted', message: 'Digital Forensics Complete! Enter key to unlock Round 3...' });
            setTimeout(() => {
                router.push('/unlock?next=3');
            }, 2500);
        } else {
            setShowAccessMessage({ type: 'granted', message: `Breach Key ${levelNum} Acquired!` });
            setTimeout(() => {
                setShowAccessMessage(null);
                fetchStatus();
                if (levelNum < 2) {
                    setActiveLevel(levelNum + 1);
                } else {
                    setShowAccessMessage({ type: 'denied', message: 'Complete all levels in this round first!' });
                }
            }, 2000);
        }
    };

    const handleTimerExpire = useCallback(() => {
        router.push('/unlock?next=3');
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cyber-black">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-cyan font-mono animate-pulse">Synchronizing Forensic Data...</p>
                </div>
            </div>
        );
    }

    const levels = [
        { num: 1, title: 'Holy Trinity', complete: status?.level1 },
        { num: 2, title: 'The Hexa Vault', complete: status?.level2 },
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
                        ROUND 2: <span className="text-cyber-text">DIGITAL FORENSICS</span>
                    </h1>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {/* Score Box */}
                    <div className="flex flex-col items-center justify-center px-4 md:px-8 py-3 border-2 border-[#00ffff] rounded bg-[#0a0e14]/80 shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                        <div className="text-[10px] md:text-sm text-[#00ffff] font-orbitron tracking-widest uppercase mb-1 font-bold">TOTAL SCORE</div>
                        <div className="text-2xl md:text-3xl font-digital text-[#00ffff] leading-none">{status?.points || 0}</div>
                    </div>

                    {/* Time Box */}
                    {expiresAt && (
                        <div className="flex flex-col items-center justify-center px-6 md:px-10 py-5 border-2 border-[#00ffff] rounded bg-[#0a0e14]/80 shadow-[0_0_15px_rgba(0,255,255,0.3)] z-10 scale-[1.05]">
                            <div className="text-[10px] md:text-sm text-[#00ffff] font-orbitron tracking-widest uppercase mb-2 font-bold">TIME REMAINING</div>
                            <div className="text-3xl md:text-5xl font-digital text-[#00ffff] leading-none drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
                                <Countdown expiresAt={expiresAt} onExpire={handleTimerExpire} className="text-[#00ffff]" />
                            </div>
                        </div>
                    )}

                    {/* Disconnect Box */}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center justify-center px-4 md:px-8 py-5 border-2 border-[#00ffff] rounded bg-[#0a0e14]/80 text-[#00ffff] hover:bg-[#00ffff]/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all font-orbitron font-bold uppercase tracking-widest md:text-lg shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                    >
                        DISCONNECT
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Side Navigation */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="card-cyber">
                        <h2 className="text-xs font-orbitron font-bold text-cyber-cyan mb-4 uppercase tracking-[0.2em]">Investigation Levels</h2>
                        <div className="space-y-3">
                            {levels.map((level) => (
                                <button
                                    key={level.num}
                                    onClick={() => setActiveLevel(level.num)}
                                    className={`
                                        w-full p-4 rounded-lg border text-left transition-all font-mono text-sm relative group
                                        ${activeLevel === level.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : level.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue/50 text-cyber-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${level.complete ? 'bg-cyber-green' : 'bg-current opacity-30'} group-hover:animate-pulse`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase opacity-50">Level 0{level.num}</span>
                                            <span className="font-bold">{level.title}</span>
                                        </div>
                                    </div>
                                    {level.complete && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card-cyber border-cyber-cyan/30">
                        <h2 className="text-xs font-orbitron font-bold text-cyber-cyan mb-2 uppercase">MISSION LOG</h2>
                        <div className="text-[10px] font-mono text-cyber-muted space-y-1">
                            <p>&gt; Breach Detected: 29m ago</p>
                            <p>&gt; Countermeasures: Active</p>
                            <p>&gt; Progress: {Math.round([status?.level1, status?.level2].filter(Boolean).length / 2 * 100)}%</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9">
                    <div className="card-cyber min-h-[500px]">
                        <div className="flex items-center justify-between mb-8 border-b border-cyber-border pb-4">
                            <h2 className="text-2xl font-orbitron font-bold text-cyber-text flex items-center gap-3">
                                <span className="text-cyber-cyan font-black">0{activeLevel}</span>
                                {levels[activeLevel - 1].title}
                            </h2>
                            {levels[activeLevel - 1].complete && (
                                <span className="bg-cyber-green/20 text-cyber-green text-[10px] px-2 py-1 rounded border border-cyber-green/50 font-bold font-mono">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        {activeLevel === 1 && (
                            <HolyTrinityPuzzle
                                onComplete={(roundComplete) => handleLevelComplete(1, roundComplete)}
                                disabled={status?.level1 || false}
                            />
                        )}

                        {activeLevel === 2 && (
                            <HexaVaultPuzzle
                                onComplete={(roundComplete) => handleLevelComplete(2, roundComplete)}
                                disabled={status?.level2 || false}
                            />
                        )}
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6">
                        <Terminal
                            title="AUDIT_CORE"
                            lines={[
                                { type: 'prompt', text: 'Waiting for keys...' },
                                { type: 'output', text: `KEY_1_STATE: ${status?.level1 ? 'STABLE' : 'LOCKED'}` },
                                { type: 'output', text: `KEY_2_STATE: ${status?.level2 ? 'STABLE' : 'LOCKED'}` },
                                {
                                    type: status?.completed ? 'success' : 'error',
                                    text: status?.completed ? 'ROUND COMPLETE — ADVANCING TO ROUND 3' : 'AWAITING KEY ACQUISITION'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
