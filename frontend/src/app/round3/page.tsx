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
// Morse Code Reference Table
// ═══════════════════════════════════════════════════════════════
const MORSE_REF: { letter: string; code: string }[] = [
    { letter: 'A', code: '.-' },
    { letter: 'B', code: '-...' },
    { letter: 'C', code: '-.-.' },
    { letter: 'D', code: '-..' },
    { letter: 'E', code: '.' },
    { letter: 'F', code: '..-.' },
    { letter: 'G', code: '--.' },
    { letter: 'H', code: '....' },
    { letter: 'I', code: '..' },
    { letter: 'J', code: '.---' },
    { letter: 'K', code: '-.-' },
    { letter: 'L', code: '.-..' },
    { letter: 'M', code: '--' },
    { letter: 'N', code: '-.' },
    { letter: 'O', code: '---' },
    { letter: 'P', code: '.--.' },
    { letter: 'Q', code: '--.-' },
    { letter: 'R', code: '.-.' },
    { letter: 'S', code: '...' },
    { letter: 'T', code: '-' },
    { letter: 'U', code: '..-' },
    { letter: 'V', code: '...-' },
    { letter: 'W', code: '.--' },
    { letter: 'X', code: '-..-' },
    { letter: 'Y', code: '-.--' },
    { letter: 'Z', code: '--..' },
];

function MorseReferenceTable() {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="border border-cyber-border rounded-lg overflow-hidden">
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-cyber-darker hover:bg-cyber-dark transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-cyber-cyan text-sm">📡</span>
                    <span className="text-cyber-cyan font-mono text-xs font-bold uppercase tracking-wider">
                        Morse Code Reference Table
                    </span>
                </div>
                <span className="text-cyber-muted text-xs font-mono">
                    {collapsed ? '▶ EXPAND' : '▼ COLLAPSE'}
                </span>
            </button>

            {!collapsed && (
                <div className="p-4 bg-cyber-darker">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-3">
                        {MORSE_REF.map(({ letter, code }) => (
                            <div
                                key={letter}
                                className="flex flex-col items-center p-3 rounded border border-cyber-border bg-cyber-dark hover:border-cyber-cyan/50 transition-colors"
                            >
                                <span className="text-cyber-cyan font-mono text-lg font-bold">{letter}</span>
                                <span className="text-cyber-muted font-mono text-sm tracking-wider mt-1">{code}</span>
                            </div>
                        ))}
                        <div className="flex flex-col items-center p-3 rounded border border-cyber-yellow/30 bg-cyber-dark">
                            <span className="text-cyber-yellow font-mono text-sm font-bold">SPACE</span>
                            <span className="text-cyber-yellow font-mono text-sm tracking-wider mt-1">/</span>
                        </div>
                    </div>
                    <p className="text-cyber-muted text-xs font-mono mt-3 text-center">
                        ⚠ TRANSMISSION NOISE: Special characters before Morse patterns are interference — ignore them. Only dots (.) and dashes (-) are signal.
                    </p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Morse Transmission Puzzle Component (reusable for all 3 questions)
// ═══════════════════════════════════════════════════════════════
function MorseTransmissionPuzzle({
    transmissionNumber,
    morseCode,
    decodedRiddle,
    onComplete,
    disabled,
    submitFn,
}: {
    transmissionNumber: number;
    morseCode: string;
    decodedRiddle: string;
    onComplete: () => void;
    disabled: boolean;
    submitFn: (answer: string) => Promise<any>;
}) {
    const [riddleInput, setRiddleInput] = useState('');
    const [riddleVerified, setRiddleVerified] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [riddleMessage, setRiddleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Normalize text for comparison: lowercase, strip punctuation, collapse whitespace
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    const handleVerifyRiddle = () => {
        const input = normalize(riddleInput);
        const expected = normalize(decodedRiddle);
        // Check similarity — allow minor typos by checking if at least 90% of words match
        const inputWords = input.split(' ');
        const expectedWords = expected.split(' ');
        const matchCount = expectedWords.filter(w => inputWords.includes(w)).length;
        const similarity = matchCount / expectedWords.length;

        if (similarity >= 0.85) {
            setRiddleVerified(true);
            setRiddleMessage({ type: 'success', text: '✓ DECODED MESSAGE VERIFIED — Now solve the riddle below.' });
        } else {
            setRiddleMessage({ type: 'error', text: 'DECODE MISMATCH — The decoded message does not match. Re-examine the Morse signal.' });
        }
    };

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await submitFn(answer) as {
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
            setMessage({ type: 'error', text: 'Decryption analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-xl font-mono mb-2">✓ TRANSMISSION {transmissionNumber} DECODED</div>
                <p className="text-cyber-muted text-sm">Signal successfully decrypted and analyzed</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Mission Brief */}
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-cyber-red animate-pulse">●</span>
                    <h3 className="text-cyber-cyan font-mono text-sm font-bold uppercase">
                        Intercepted Transmission #{transmissionNumber}
                    </h3>
                </div>
                <p className="text-cyber-muted text-xs font-mono leading-relaxed">
                    An encoded enemy transmission has been captured. <span className="text-cyber-cyan font-bold">Step 1:</span> Decode the Morse signal below
                    (filter noise characters — only <span className="text-cyber-cyan font-bold">dots (.)</span> and{' '}
                    <span className="text-cyber-cyan font-bold">dashes (-)</span> are valid Morse,{' '}
                    <span className="text-cyber-yellow font-bold">/</span> separates words).
                    Enter the decoded message to verify. <span className="text-cyber-cyan font-bold">Step 2:</span> Solve the riddle and submit the answer.
                </p>
            </div>

            {/* Morse Code Display */}
            <div className="bg-cyber-darker rounded border border-cyber-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] text-cyber-red font-mono uppercase tracking-widest flex items-center gap-2">
                        <span className="animate-pulse">●</span> ENCRYPTED SIGNAL — TRANSMISSION {transmissionNumber}
                    </div>
                    <div className="text-[10px] text-cyber-muted font-mono">
                        FREQ: {(137.5 + transmissionNumber * 12.3).toFixed(1)} MHz
                    </div>
                </div>
                <div className="bg-[#0a0e14] rounded border border-cyber-border p-4 max-h-48 overflow-y-auto">
                    <pre className="text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                        {morseCode}
                    </pre>
                </div>
            </div>

            {/* Morse Reference Table */}
            <MorseReferenceTable />

            {/* STEP 1: Decode the riddle */}
            <div className={`p-4 rounded border ${riddleVerified ? 'bg-cyber-dark border-cyber-green' : 'bg-cyber-dark border-cyber-cyan/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${riddleVerified ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-cyan/20 text-cyber-cyan'}`}>
                        STEP 1
                    </span>
                    <span className="text-cyber-muted font-mono text-xs uppercase tracking-wider">
                        {riddleVerified ? '✓ Decoded Message Verified' : ' Enter the Decoded Message'}
                    </span>
                </div>

                {!riddleVerified ? (
                    <>
                        <p className="text-cyber-muted text-xs font-mono mb-3">
                            Decode the Morse signal above and type the full decoded message here.
                        </p>
                        <textarea
                            value={riddleInput}
                            onChange={(e) => setRiddleInput(e.target.value)}
                            placeholder="Type the decoded message here..."
                            rows={3}
                            className="w-full bg-[#0a0e14] text-cyber-text text-white font-mono text-sm p-3 rounded border border-cyber-border focus:border-cyber-cyan focus:outline-none resize-y placeholder:text-[#555]"
                        />

                        {riddleMessage && (
                            <div className={`mt-3 p-3 rounded border ${riddleMessage.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                                {riddleMessage.text}
                            </div>
                        )}

                        <button
                            onClick={handleVerifyRiddle}
                            disabled={!riddleInput.trim()}
                            className="btn-neon w-full mt-3"
                        >
                            VERIFY DECODED MESSAGE
                        </button>
                    </>
                ) : (
                    <div className="bg-[#0a0e14] rounded border border-cyber-green/30 p-4">
                        <p className="text-cyber-text font-mono text-sm leading-relaxed italic">
                            &quot;{decodedRiddle}&quot;
                        </p>
                    </div>
                )}
            </div>

            {/* STEP 2: Solve the riddle (only visible after Step 1 verified) */}
            <div className={`p-4 rounded border ${riddleVerified ? 'bg-cyber-dark border-cyber-cyan/30' : 'bg-cyber-dark border-cyber-border opacity-40'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${riddleVerified ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-border/20 text-cyber-muted'}`}>
                        STEP 2
                    </span>
                    <span className="text-cyber-muted font-mono text-xs uppercase tracking-wider">
                        {riddleVerified ? 'Enter the Riddle Answer' : '🔒 Decode the message first'}
                    </span>
                </div>

                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                    placeholder={riddleVerified ? 'ENTER THE ANSWER' : 'LOCKED'}
                    className="input-cyber text-center text-lg w-full tracking-widest"
                    disabled={!riddleVerified}
                />
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success' ? 'bg-cyber-green/10 border-cyber-green text-cyber-green' : 'bg-cyber-red/10 border-cyber-red text-cyber-red'} font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={handleSubmitAnswer}
                disabled={!riddleVerified || !answer.trim() || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'DECRYPTING...' : `SUBMIT ANSWER — TRANSMISSION ${transmissionNumber}`}
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Final Checkpoint Component
// ═══════════════════════════════════════════════════════════════
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
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-cyber-green text-xl font-orbitron font-bold mb-2 tracking-widest uppercase">MISSION COMPLETE</div>
                <p className="text-cyber-green/70 text-sm font-mono tracking-tighter">
                    All transmissions decoded. Target location confirmed.
                </p>
            </div>
        );
    }

    if (locked) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-border text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-orbitron text-cyber-muted mb-2 uppercase tracking-widest">Final Checkpoint Locked</h3>
                <p className="text-cyber-muted text-xs font-mono">
                    Decode all three transmissions to unlock the final checkpoint.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🗝️</div>
                    <h3 className="text-xl font-orbitron text-cyber-cyan mb-2">FINAL TRANSMISSION CODE</h3>
                    <p className="text-cyber-muted text-sm font-mono tracking-tighter">
                        Combine all three decoded answers: (ANSWER1)-(ANSWER2)-(ANSWER3)
                    </p>
                </div>

                <div className="flex gap-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ANS1-ANS2-ANS3"
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

// ═══════════════════════════════════════════════════════════════
// Transmission Data (Morse strings + decoded riddles)
// ═══════════════════════════════════════════════════════════════
const TRANSMISSION_DATA = [
    {
        num: 1,
        morse: `@..  ^..-.  /  #-.--  $---  %..-  /  &.--.  *---  !...  ~...  +.  =...  /  =9?-  ^  /  @-.--  #- ---  $..-  /  %--  &.-  *-.--  /  ^.  +.  =.-..  /  ?-  ^  /  @-  #.  $--  %.--.  &-  *  /  !-..  ~  /  =  ^-  @---  #  /  $...  %....  &.-  *.-.  !.  /  ~--  +.  =  /  ?  ^  /  @--  #  /  $--.  %  /  &..  *-  !....  /  ~...  +---  =--  ?  /  ^  @.  #---  $-.  %  /  &.  *  /  !..  ~.-..  +...  =.  /  ?-...  ^..-  @-  #  /  $  %  /  &-  *....  !.  /  ~  +--  =---  ?--  /  ^-  @  #  /  $-.--  %---  &..-  /  *-..  !---  /  ~  +..  =  /  ?  ^-.  @---  #  /  $  %.-..  &---  *-.  !--.  /  ~  +.  =.-.  ?  /  ^  @-  #.-.  $..-  %.-..  &-.--  /  *-...  !.  ~.-..  +---  =-.  --.  /  ?  ^-  @  #  /  $-.--  %---  &..-  /  *  !.--  ~....  +.-  =-  /  ?..  ^..`,
        decodedRiddle: 'If you possess me you may feel tempted to share me with someone else But the moment you do I no longer truly belong to you What am I',
    },
    {
        num: 2,
        morse: `$*@..  / ^*$* ^....  #.-  $...-  (()%#&%.  /  &-.  *---  !  /  ~--  +---  =..-  -  /  $*)e*?-  ^---  /  !@#$^*(@...  #.--.  $.  %.  &.-  *-.-  /  !-  ~.-  @#^*(^&+-.  =-..  /  %&*)%&?-.  ^---  /  %&(^$^(l@.  #.-  !@#$%^$.  %.-.  &...  /  *-  !---  %&($!~#%&(~....  +.  =.-  !@#$%^?.-.  /  ^-  @.  #  /  $**$#!@#$%^$-.-.  %.  &.-  *-.  /  !.  ~.--.  +.  =.-  #$%%^*(&$-  /  ?.  %&*(^&(*^...-  @.  #.-.  -.--  /  @#$%$--  %.  &.-.  *-..  /  %&(&%$&*!-.--  ~---  +..-  /  ?...  ^.-  @-.--  /  #..  $.  % -..-  %^((%&9&..  *...  -  /  $^*()%$^%&(*!---  ~-.  +.-..  =-.--  /  ?--  ^....  @#$%@.  /  #-.--  !@#$%^&(*&^$---  %..-  /  @#$%)(*&^&-.-.  *.-  !.-..  ~.-..  /  @#$%^(*+---  =..-  -  /  @#$%*&^?  ^  /  @#$%@--  #.  /  #$%^)(*&^$  %.--  &....  *.-  -  /  ?.  ^..  @#$%)(*&^@..`,
        decodedRiddle: 'I have no mouth to speak and no ears to hear yet I can repeat every word you say I exist only when you call out to me What am I',
    },
    {
        num: 3,
        morse: `@-  ^....  #.  $---  %-.  &.  /  *.--  !....  ~---  +  /  =-.-.  ?.  ^.-.  @.  #.-  $-  %.  &...  /  *--  !.  /  ~-..  +---  =.  ?...  /  ^...  @---  #  /  $.  %-..  &---  *  /  !..-.  ~---  +.  =.-.  /  ?--.  ^.-.  @---  #..-.  $..  %-  /  &.-  *-.  !..  ~-..  +  /  =.-.  ?.  ^...-  @.  #.-.  /  $-.-  %.  &.  *  /  !..  ~.--.  +...  =  /  ?-  ^....  @.  /  #---  $-.  %.  &.  *  /  !.--  ~....  +---  =  /  ?-  ^.--.  @..-  #.-.  $-.-.  %....  &.-  *...  /.  !--  ~.  +  /  =-.-.  ?.  ^.-.  @.  /  #....  $.-  %...  /  &-.  *---  !  /  ~..  +-.  =-  ?.  ^-.  @-..  #-.  /  $---  %-.  &  /  *.  !...-  ~.  +.-.  /  =..-  ?...  ^..  @-.  --.  /  #--  $  /  %.  &-.  *  /  !--  ~-..  +  /  =-.-.  ?.  ^.-.  @.  #  /  $..-.  %..  &-.  *.-  !.  ~.-..  +.-..  =-.--  /  ?..-  ^...  @.  #...  /  $--  %  /  &.--  *..  !.-..  ~.-..  +  /  =-.  ?.  ^...-  @.  #.-.  /  $-.-  %.  &-.  *---  !.--  /  ~..  +  /  =-.  ?.  ^-.-.  @  /  #-.  $---  %  /  &..  *-  /  !.--  ~....  +.-  =-  /  ?..  ^..`,
        decodedRiddle: 'The one who creates me does so for profit and never keeps me The one who purchases me has no intention of ever using me And the one who finally uses me will never know it What am I',
    },
];

// ═══════════════════════════════════════════════════════════════
// Main Round 3 Page
// ═══════════════════════════════════════════════════════════════
export default function Round3Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState<number>(1);
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

    const handlePhaseComplete = (phaseNum: number) => {
        setShowAccessMessage({ type: 'granted', message: `Transmission ${phaseNum} Decoded!` });
        setTimeout(() => {
            setShowAccessMessage(null);
            fetchStatus();
            if (phaseNum < 3) {
                setActivePhase(phaseNum + 1);
            }
        }, 2000);
    };

    const handleMissionComplete = () => {
        setShowAccessMessage({ type: 'granted', message: 'ALL TRANSMISSIONS DECODED — MISSION COMPLETE!' });
        setTimeout(() => {
            router.push('/finale');
        }, 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Tuning into intercepted frequencies...</p>
                </div>
            </div>
        );
    }

    const submitFns = [
        (a: string) => api.submitRound3Phase1(a),
        (a: string) => api.submitRound3Phase2(a),
        (a: string) => api.submitRound3Phase3(a),
    ];

    const phases = [
        { num: 1, title: 'Transmission 1', complete: status?.phase1 },
        { num: 2, title: 'Transmission 2', complete: status?.phase2 },
        { num: 3, title: 'Transmission 3', complete: status?.phase3 },
        { num: 4, title: 'Final Checkpoint', complete: status?.completed },
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
                        ROUND 3: <span className="text-cyber-text">THE INTERCEPTED TRANSMISSIONS</span>
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
                                <Countdown expiresAt={expiresAt} className="text-[#00ffff]" />
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Phase Tabs */}
                <div className="lg:col-span-1">
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">TRANSMISSIONS</h2>
                        <div className="space-y-2">
                            {phases.map((phase) => (
                                <button
                                    key={phase.num}
                                    onClick={() => setActivePhase(phase.num)}
                                    className={`
                                        w-full p-4 rounded-lg border text-left transition-all font-mono text-sm relative
                                        ${activePhase === phase.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : phase.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue text-cyber-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${phase.complete ? 'bg-cyber-green' : 'bg-current opacity-30'}`} />
                                        <span>{phase.title}</span>
                                    </div>
                                    {phase.complete && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mission Status */}
                    <div className="mt-6 card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">MISSION STATUS</h2>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-muted">Signal 1</span>
                                <span className={status?.phase1 ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.phase1 ? 'DECODED' : 'ENCRYPTED'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-muted">Signal 2</span>
                                <span className={status?.phase2 ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.phase2 ? 'DECODED' : 'ENCRYPTED'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyber-muted">Signal 3</span>
                                <span className={status?.phase3 ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.phase3 ? 'DECODED' : 'ENCRYPTED'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-cyber-border pt-2 mt-2">
                                <span className="text-cyber-muted">Checkpoint</span>
                                <span className={status?.completed ? 'text-cyber-green' : 'text-cyber-muted'}>
                                    {status?.completed ? 'VERIFIED' : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Phase Panel */}
                <div className="lg:col-span-3">
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-orbitron font-bold text-cyber-text">
                                {phases[activePhase - 1].title.toUpperCase()}
                            </h2>
                            {phases[activePhase - 1].complete && (
                                <span className="badge badge-complete">COMPLETE</span>
                            )}
                        </div>

                        {/* Transmission Phases 1-3 */}
                        {activePhase >= 1 && activePhase <= 3 && (
                            <MorseTransmissionPuzzle
                                key={activePhase}
                                transmissionNumber={TRANSMISSION_DATA[activePhase - 1].num}
                                morseCode={TRANSMISSION_DATA[activePhase - 1].morse}
                                decodedRiddle={TRANSMISSION_DATA[activePhase - 1].decodedRiddle}
                                onComplete={() => handlePhaseComplete(activePhase)}
                                disabled={
                                    activePhase === 1 ? (status?.phase1 || false) :
                                        activePhase === 2 ? (status?.phase2 || false) :
                                            (status?.phase3 || false)
                                }
                                submitFn={submitFns[activePhase - 1]}
                            />
                        )}

                        {/* Final Checkpoint */}
                        {activePhase === 4 && (
                            <FinalCheckpointPuzzle
                                onComplete={handleMissionComplete}
                                disabled={status?.completed || false}
                                locked={!status?.checkpointUnlocked}
                            />
                        )}
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6">
                        <Terminal
                            title="SIGNAL_INTERCEPT"
                            lines={[
                                { type: 'prompt', text: 'Initializing signal intercept array...' },
                                { type: 'output', text: `[SIGNAL 1] Transmission: ${status?.phase1 ? 'DECODED' : 'ENCRYPTED'}` },
                                { type: 'output', text: `[SIGNAL 2] Transmission: ${status?.phase2 ? 'DECODED' : 'ENCRYPTED'}` },
                                { type: 'output', text: `[SIGNAL 3] Transmission: ${status?.phase3 ? 'DECODED' : 'ENCRYPTED'}` },
                                {
                                    type: status?.completed ? 'success' : 'output',
                                    text: status?.completed
                                        ? '>>> ALL SIGNALS DECODED — TARGET LOCATION CONFIRMED <<<'
                                        : '[SECURE] Decode all transmissions to identify target location'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
