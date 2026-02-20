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

// ═══════════════════════════════════════════════════════════════
// Code Compiler Component (embedded in each phase)
// ═══════════════════════════════════════════════════════════════
function CodeCompiler({ phaseLabel, onUseOutput }: { phaseLabel: string; onUseOutput?: (output: string) => void }) {
    const [language, setLanguage] = useState<'javascript' | 'python' | 'java'>('java');
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
                        {(['java', 'python', 'javascript'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`
                                    px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all
                                    ${language === lang
                                        ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan'
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
// Phase 1: The 120-Second Shadow
// ═══════════════════════════════════════════════════════════════
// Hardcoded log arrays for Phase 1
const LOG_A = [
    "08:00:15", "08:12:45", "08:22:10", "08:35:00", "08:45:30",
    "09:10:00", "09:25:15", "09:40:00", "10:05:20", "10:15:00",
    "11:00:00", "11:15:45", "11:30:10", "11:45:00", "12:00:30",
    "13:15:00", "13:30:45", "13:45:10", "14:10:00", "14:25:30"
];

const LOG_B = [
    "08:05:00", "08:15:30", "08:30:00", "08:50:00", "09:05:45",
    "09:30:10", "09:55:00", "10:20:30", "10:45:00", "11:10:15",
    "11:55:00", "12:15:45", "12:45:10", "13:00:00", "14:00:30"
];

const LOG_C = [
    "08:02:30 AM", "08:20:00 AM", "08:32:15 AM", "08:40:45 AM", "09:00:00 AM",
    "10:00:00 AM", "10:30:00 AM", "11:05:00 AM", "12:30:00 PM", "01:05:00 PM",
    "02:00:00 PM", "02:05:00 PM", "02:07:00 PM", "02:15:45 PM", "02:30:00 PM"
];

const CONVERSION_CHALLENGE = "02:07:00 PM";
const SORTED_INDEX_CHALLENGE = 25;

function TimeGapPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [breachKey, setBreachKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async () => {
        if (!breachKey) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Phase1({
                conversionAnswer: '',
                sortedTimestamp: '',
                breachKey: parseInt(breachKey)
            }) as {
                success: boolean;
                message: string;
                pointsEarned?: number;
                pointsDeducted?: number;
                feedback?: string[];
            };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
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
                <p className="text-cyber-muted text-sm">120-second shadow identified successfully</p>
            </div>
        );
    }


    const totalTimestamps = LOG_A.length + LOG_B.length + LOG_C.length;

    return (
        <div className="space-y-6">
            {/* Scenario briefing */}
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-cyber-cyan">🔍</span>
                    <h3 className="text-cyber-cyan font-mono text-sm font-bold uppercase">Mission Brief</h3>
                </div>
                <p className="text-cyber-muted text-xs font-mono leading-relaxed">
                    The mole accessed the system across three servers to hide their tracks.
                    You have <span className="text-cyber-text font-bold">{totalTimestamps} timestamps</span> across 3 server logs.
                    Server C uses AM/PM format. Convert, merge, sort, and find the two consecutive timestamps
                    that are exactly <span className="text-cyber-cyan font-bold">120 seconds</span> apart.
                </p>
            </div>

            {/* Log arrays displayed in code format */}
            <div className="space-y-4">
                <div className="bg-cyber-darker rounded border border-cyber-border p-4 overflow-x-auto">
                    <div className="text-cyber-cyan text-[10px] font-mono mb-2 uppercase tracking-widest">Log A: 24-Hour Format ({LOG_A.length} Entries)</div>
                    <pre className="text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {`String[] logA = {\n    ${LOG_A.map(t => `"${t}"`).join(', ')}\n};`}
                    </pre>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 overflow-x-auto">
                    <div className="text-cyber-cyan text-[10px] font-mono mb-2 uppercase tracking-widest">Log B: 24-Hour Format ({LOG_B.length} Entries)</div>
                    <pre className="text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {`String[] logB = {\n    ${LOG_B.map(t => `"${t}"`).join(', ')}\n};`}
                    </pre>
                </div>

                <div className="bg-cyber-darker rounded border border-cyber-border p-4 overflow-x-auto">
                    <div className="text-cyber-yellow text-[10px] font-mono mb-2 uppercase tracking-widest">Log C: AM/PM Format ({LOG_C.length} Entries)</div>
                    <pre className="text-cyber-yellow font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {`String[] logC = {\n    ${LOG_C.map(t => `"${t}"`).join(', ')}\n};`}
                    </pre>
                </div>
            </div>

            {/* Code Compiler */}
            <CodeCompiler phaseLabel="Phase 1 — Timestamp Analysis" onUseOutput={(val) => setBreachKey(val)} />

            {/* Single key input */}
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-cyber-muted text-[10px] font-mono uppercase tracking-widest">
                        Breach Key 1 — Index of the 120-second gap
                    </label>
                    <span className="text-[10px] text-cyber-cyan font-mono">INDEX #</span>
                </div>
                <p className="text-cyber-muted text-xs font-mono mb-2">
                    Use the compiler above to merge, sort, and find the two consecutive timestamps exactly <span className="text-cyber-cyan font-bold">120 seconds</span> apart.
                    Enter the <span className="text-cyber-red font-bold">index of the second timestamp</span> in that pair.
                </p>
                <input
                    type="number"
                    value={breachKey}
                    onChange={(e) => setBreachKey(e.target.value)}
                    placeholder="Enter index number"
                    className="input-cyber text-center text-lg font-mono"
                />
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={!breachKey || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'ANALYZING...' : 'UNLOCK KEY 1'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Phase 2: Holy Trinity
// ═══════════════════════════════════════════════════════════════
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
    const [systemMap, setSystemMap] = useState<Array<{ rowId: number; folder: string; size: number }>>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!disabled) {
            api.getPhase2Data().then((data: any) => {
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
                        Apply the Rule of Three: Find the folder with exactly <span className="text-cyber-cyan font-bold">2 vowels (O, I)</span>, exactly <span className="text-cyber-cyan font-bold">4 characters long</span>, and file size is a <span className="text-cyber-cyan font-bold">multiple of 3</span>.
                    </p>
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
                    <CodeCompiler phaseLabel="Phase 2 — System Map Filter" onUseOutput={(val) => setRowId(val)} />
                </div>

                <div>
                    <label className="block text-cyber-muted text-[10px] font-mono mb-2 uppercase tracking-widest">
                        Row ID (Breach Key 2)
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
                {submitting ? 'VALIDATING...' : 'UNLOCK KEY 2'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Phase 3: The Hexa Vault
// ═══════════════════════════════════════════════════════════════
function HexaVaultPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [riddleAnswer, setRiddleAnswer] = useState('');
    const [hexCleaningComplete, setHexCleaningComplete] = useState(false);
    const [hexDecodingComplete, setHexDecodingComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const encryptedString = '#4%3@!4^5&*(4)9$4#e%2@0!2^0&*(4)8$4#6%6@1!6^3&*(6)b$2@0!7^4&*(6)8$6@1!7^3&*(2)0$6@1!2^0&*(6)8$6@5!6^1&*(6)4$2@0!6^1&*(6)e$6@4!2^0&*(6)1$2@0!7^4&*(6)1$6@9!6^c$2@0!6^2&*(6)5$7@4!2^0&*(6)e$6@f!2^0&*(6)6$6@f!6^4&*(7)9$3@f';

    const handleSubmit = async () => {
        if (!riddleAnswer) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitRound2Phase3({
                riddleAnswer,
                hexCleaningComplete,
                hexDecodingComplete
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
                    <CodeCompiler phaseLabel="Phase 3 — Hex Decryption" onUseOutput={(val) => setRiddleAnswer(val.toUpperCase())} />
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
                {submitting ? 'DECRYPTING...' : 'UNLOCK KEY 3'}
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Final Challenge: Round 2 Checkpoint
// ═══════════════════════════════════════════════════════════════
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
                    placeholder="KEY1-KEY2-KEY3"
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


// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
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
