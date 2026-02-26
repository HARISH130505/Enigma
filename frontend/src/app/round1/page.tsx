'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, AccessMessage } from '@/components/ui';
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// Round 1 – Attack on BlackRidge Airfield
// ─────────────────────────────────────────────────────────────

interface RoundStatus {
    evidence1: boolean;
    evidence2: boolean;
    evidence3: boolean;
    evidence4: boolean;
    evidence5: boolean;
    points: number;
    completed: boolean;
}

// ───────────────── Storyline Data ─────────────────

const STORYLINES: Record<number, { title: string; text: string }> = {
    1: {
        title: 'War Briefing – Classified',
        text: `Year: 1943. Eastern Front.

For weeks, our division has studied an enemy-controlled airfield believed to dominate the skies over this region. Destroying it would shift the balance of the war.

At 0300 hours, High Command approved a covert AirStrike. The strike coordinates, deployment timings, and confirmation protocol were secured inside our underground command bunker.

Inside this bunker, movement is never random. Every officer entering through the reinforced Entry Gate must pass through internal clearance before advancing deeper. Equipment authorization is verified before operational review. Surveillance confirmation is completed before any signal is transmitted. And beyond the transmission chamber lies only a final emergency exit — a path no one reaches without passing through every prior section.

The bunker's architecture itself enforces order. No chamber can be accessed out of progression. No transmission can originate without prior clearance. And no officer can reach the final corridor without passing through the command and surveillance units first.

Yet at 04:17 hours, a silent alert was triggered.

Internal data breach detected. Unauthorized signal activity logged.

The Signal Chamber registered transmission activity — but the movement logs do not align with standard bunker progression.

Moments later, security recovered a torn fragment of mapping material from the furnace. Burnt at the edges. Partially destroyed.

The markings are incomplete. The location is not immediately identifiable. But command believes this fragment may indicate what information was transmitted to the enemy.

Our AirStrike plan may have been compromised.

The traitor is inside the bunker.

Investigators — your task is to reconstruct what happened inside these walls… and identify the officer responsible.

Security has sealed the bunker. The torn map fragment recovered from the trash box has been handed to you. If this fragment represents the stolen strike location, reconstructing it may reveal what information was leaked to the enemy.

Your investigation begins now.`,
    },
    2: {
        title: 'Command Update – Strike Target Confirmed',
        text: `03:30 Hours – Strategic Briefing

The emergency war meeting was convened inside the Control Room.

Infantry officers arrived first. As per standard protocol, they moved in from the Barracks corridor, passing through the Armory checkpoint before entering the command chamber.

Airfield command representatives joined shortly after. Radar projections were displayed. Strike coordinates for BlackRidge Airfield were reviewed. Every senior officer present heard the finalized route.

Among them…

was the traitor.

The meeting concluded at 03:58 hours.

Most personnel returned the way they came. However, airfield officers were later recorded exiting through the restricted War Archive passage — a route typically used for classified document handling.

04:17 Hours – Security Breach

An unauthorized encrypted transmission was detected.

Source: Signal Chamber.

The broadcast contained partial strike coordinates — enough to compromise the operation.

Minutes before the breach, surveillance logs indicate movement near the Radar Unit, the only surveillance hub directly connected to the Signal Chamber’s transmission grid.

Whoever sent the signal knew the bunker layout.

They were present at the 03:30 briefing.
They understood the strike plan.
They had access from the Barracks and Armory approach.
They passed through Control.
They reached Radar.
They triggered the breach in the Signal Chamber.
And someone exited toward the War Archive routes shortly after.

The timeline is precise.

The traitor was in the room at 03:30.

The betrayal was executed at 04:17.

Now the question remains —

Did he flee…
or is he still inside the bunker?

The bunker's architecture itself enforces order. No chamber can be accessed out of progression.

Reconstruct the correct bunker progression route.`,
    },
    3: {
        title: '04:26 Hours – Intercepted Transmission',
        text: `During a routine frequency sweep, the Signal Division detected a brief outgoing transmission from inside the bunker.

The source was traced to the Signal Chamber.

The message was not sent using official military encryption. Instead, it appears to be encoded using a simple letter-shift cipher — fast, improvised, and meant to avoid immediate detection.

Signal officers managed to intercept the transmission before it fully left range.

High Command believes this message may contain the information the traitor attempted to send about our planned AirStrike.

The contents remain scrambled.

Decrypt the intercepted transmission to determine exactly what was leaked.`,
    },
    4: {
        title: 'Signal Intelligence Log – Restricted',
        text: `The decrypted transmission has confirmed our worst fear.

The message did not originate from outside. It came from within these walls.

After isolating the transmission trace, signal technicians conducted a deeper sweep of the bunker's communication systems — searching for anything the sender might have left behind.

At first, nothing.

Then… buried in the signal residue… they found it.

A fragment of identification data, embedded inside the transmission header. Not a full code. Just a piece.

But enough to prove one thing: The signal was sent using an authorized officer's credentials.

The fragment is not recorded in readable form. It exists only as a raw binary imprint pulled from the system logs — incomplete, corrupted, but genuine.

If we decode it… we may learn whose access was used to send the message.

Investigators — decode the fragment.`,
    },
    5: {
        title: 'Final Command Directive – Traitor Identification',
        text: `All available evidence has now been assembled.

You know the compromised strike location. You understand the bunker's internal route. You have the authentication fragment from the transmission. You have reviewed the personnel access logs. You have reconstructed officer movement during the breach window.

Internal Command Notice – Full Breach Reconstruction:
The decoded fragment has been verified as part of an officer authentication code used during signal transmission. This confirms the breach was not anonymous.

High Command has now released restricted bunker records for investigation. You have been given:
• The full list of officer identification codes
• Signal Chamber access authorizations
• Console authentication logs recorded during the breach window

The AirStrike information was shared first to the Airforce Regiment, then to the Communication Engineers, and 2 Soldiers from the Southern Infantry were present.

Bunker Security Reconstruction – 04:00 to 04:30 Hours:
The personnel logs have reduced the number of possible suspects. Security has released movement records for all officers present between 04:00 and 04:30 hours.

The breach occurred at 04:17 hours. For the transmission to occur, the sender must have followed the bunker's internal route — or bypassed it.

Only one officer can satisfy every condition. To identify the traitor, you must now determine:
• Who had authorization to access the Signal Chamber
• Who could physically reach it following bunker progression
• Who was present at the correct time
• Whose identification code matches the recovered fragment

Name the officer responsible for the breach. Be prepared to justify your conclusion to Command.

This investigation ends now.`,
    },
};

// ───────────────── Storyline Display Component ─────────────────

function StorylineDisplay({ level }: { level: number }) {
    const [expanded, setExpanded] = useState(true);
    const storyline = STORYLINES[level];

    return (
        <div className="mb-6">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-cyber-darker rounded border border-cyber-border hover:border-cyber-orange/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-cyber-orange">📜</span>
                    <span className="font-orbitron text-sm text-cyber-orange tracking-wider">
                        {storyline.title}
                    </span>
                </div>
                <span className="text-cyber-muted text-xs">{expanded ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
            </button>
            {expanded && (
                <div className="mt-2 p-4 bg-cyber-darker/50 rounded border border-cyber-border/30 max-h-80 overflow-y-auto">
                    <div className="text-cyber-text text-sm font-mono leading-relaxed whitespace-pre-line">
                        {storyline.text}
                    </div>
                </div>
            )}
        </div>
    );
}

// ───────────────── Hint Button Component ─────────────────

function HintButton({ level, onPointsChange }: { level: number; onPointsChange: () => void }) {
    const [hint, setHint] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleRequestHint = async () => {
        if (!confirmed) {
            setConfirmed(true);
            return;
        }
        setLoading(true);
        try {
            const response = await api.requestHint(level) as { success: boolean; hint: string };
            if (response.success) {
                setHint(response.hint);
                onPointsChange();
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    if (hint) {
        return (
            <div className="p-3 bg-cyber-orange/10 border border-cyber-orange rounded font-mono text-sm text-cyber-orange">
                <span className="text-xs text-cyber-muted block mb-1">💡 HINT REVEALED (-15 Points):</span>
                {hint}
            </div>
        );
    }

    return (
        <button
            onClick={handleRequestHint}
            disabled={loading}
            className="text-xs font-mono px-3 py-1.5 border border-cyber-orange/50 text-cyber-orange hover:bg-cyber-orange/10 rounded transition-colors"
        >
            {loading ? 'LOADING...' : confirmed ? '⚠️ CONFIRM? (-15 PTS)' : '💡 REQUEST HINT'}
        </button>
    );
}

// ───────────────── Level 1: Jigsaw Puzzle (External Link) ─────────────────

function JigsawPuzzle({
    onComplete,
    disabled,
    onPointsChange,
}: {
    onComplete: () => void;
    disabled: boolean;
    onPointsChange: () => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleMarkCompleted = async () => {
        setSubmitting(true);
        setMessage(null);
        try {
            const response = await api.submitEvidence1(true) as { success: boolean; message: string; pointsEarned?: number };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                onPointsChange();
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch {
            setMessage({ type: 'error', text: 'Validation failed. Try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ MAP RECONSTRUCTED</div>
                <p className="text-cyber-muted text-sm">Strike coordinates recovered from the torn fragment</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StorylineDisplay level={1} />
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    A torn map fragment was recovered from the furnace. Reconstruct it to reveal the compromised strike location.
                </p>

                {/* External puzzle link */}
                <div className="text-center p-6 bg-cyber-darker rounded border border-cyber-cyan/30 mb-4">
                    <p className="text-cyber-text text-sm font-mono mb-4">
                        Click the button below to open the jigsaw puzzle. Reconstruct the map fragment to identify the target.
                    </p>
                    <a
                        href="https://puzzel.org/en/jigsaw/play?p=-OmDvPAFTJeNTOz155DB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-3 bg-cyber-cyan/20 border-2 border-cyber-cyan text-cyber-cyan font-orbitron font-bold text-sm tracking-wider rounded hover:bg-cyber-cyan/30 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300"
                    >
                        🧩 OPEN MAP FRAGMENT PUZZLE
                    </a>
                </div>

                <div className="p-3 bg-cyber-orange/10 border border-cyber-orange/30 rounded">
                    <p className="text-cyber-orange text-xs font-mono text-center">
                        ⚠ After completing the puzzle, verify with your mentor, then click <strong>MARK AS COMPLETED</strong> below.
                    </p>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleMarkCompleted}
                    disabled={submitting}
                    className="btn-neon flex-1"
                >
                    {submitting ? 'VERIFYING...' : '✓ MARK AS COMPLETED'}
                </button>
                <HintButton level={1} onPointsChange={onPointsChange} />
            </div>
        </div>
    );
}

// ───────────────── Level 2: Bunker Sequence (Drag & Drop) ─────────────────

function BunkerSequencePuzzle({
    onComplete,
    disabled,
    onPointsChange,
}: {
    onComplete: () => void;
    disabled: boolean;
    onPointsChange: () => void;
}) {
    const allItems = [
        { id: 'barracks', label: 'Barracks', icon: '🏠' },
        { id: 'armory', label: 'Armory', icon: '🔫' },
        { id: 'control-room', label: 'Control Room', icon: '🎛️' },
        { id: 'radar-unit', label: 'Radar Unit', icon: '📡' },
        { id: 'signal-room', label: 'Signal Room', icon: '📻' },
        { id: 'war-archive', label: 'War Archive', icon: '📁' },
        { id: 'escape-tunnel', label: 'Escape Tunnel', icon: '🚪' },
    ];

    // Shuffle initially
    const [items, setItems] = useState(() => {
        const shuffled = [...allItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    });
    const [dropZone, setDropZone] = useState<string[]>([]);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDrop = () => {
        if (draggedItem && !dropZone.includes(draggedItem)) {
            setDropZone([...dropZone, draggedItem]);
            setItems(items.filter(i => i.id !== draggedItem));
        }
        setDraggedItem(null);
    };

    const handleRemove = (id: string) => {
        const item = allItems.find(i => i.id === id);
        if (item) {
            setItems([...items, item]);
            setDropZone(dropZone.filter(i => i !== id));
        }
    };

    const getItemLabel = (id: string) => {
        return allItems.find(i => i.id === id)?.label || id;
    };

    const getItemIcon = (id: string) => {
        return allItems.find(i => i.id === id)?.icon || '';
    };

    const handleSubmit = async () => {
        if (dropZone.length !== 7) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence2(dropZone) as { success: boolean; message: string; pointsEarned?: number; pointsDeducted?: number };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                onPointsChange();
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
                onPointsChange();
            }
        } catch {
            setMessage({ type: 'error', text: 'Validation failed. Try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ BUNKER ROUTE CONFIRMED</div>
                <p className="text-cyber-muted text-sm">Internal progression verified</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StorylineDisplay level={2} />
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    Arrange the bunker chambers in the correct progression order (Entry → Exit).
                </p>

                {/* Available Items */}
                <div className="mb-4">
                    <div className="text-xs text-cyber-muted mb-2">AVAILABLE CHAMBERS:</div>
                    <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item.id)}
                                className={`
                                    draggable px-3 py-2 bg-cyber-darker border border-cyber-border rounded
                                    hover:border-cyber-cyan cursor-grab text-sm font-mono flex items-center gap-2
                                    ${draggedItem === item.id ? 'opacity-50' : ''}
                                `}
                            >
                                <span className="text-cyber-cyan">{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`
                        drop-zone min-h-24 flex flex-wrap gap-2 items-center p-4 border-2 border-dashed
                        ${draggedItem ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'border-cyber-border'}
                        rounded transition-colors
                    `}
                >
                    {dropZone.length === 0 ? (
                        <span className="text-cyber-muted text-sm w-full text-center">Drag chambers here in sequence...</span>
                    ) : (
                        dropZone.map((id, index) => (
                            <div key={id} className="flex items-center gap-1">
                                <div
                                    className="px-3 py-1 bg-cyber-cyan/20 border border-cyber-cyan rounded text-xs font-mono cursor-pointer hover:bg-cyber-red/20 hover:border-cyber-red flex items-center gap-1"
                                    onClick={() => handleRemove(id)}
                                >
                                    <span>{getItemIcon(id)}</span>
                                    {getItemLabel(id)}
                                </div>
                                {index < dropZone.length - 1 && (
                                    <span className="text-cyber-cyan">→</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={dropZone.length !== 7 || submitting}
                    className="btn-neon flex-1"
                >
                    {submitting ? 'VALIDATING...' : 'VERIFY BUNKER ROUTE'}
                </button>
                <HintButton level={2} onPointsChange={onPointsChange} />
            </div>
        </div>
    );
}

// ───────────────── Level 3: Caesar Cipher Decryption ─────────────────

function CaesarCipherPuzzle({
    onComplete,
    disabled,
    onPointsChange,
}: {
    onComplete: () => void;
    disabled: boolean;
    onPointsChange: () => void;
}) {
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const encryptedText = 'ERPELQJ KDV EHHQ SODQQHG RQ EODFN ULGJH DLUILHOG';

    const handleSubmit = async () => {
        if (!answer.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence3(answer) as { success: boolean; message: string; pointsEarned?: number; pointsDeducted?: number };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                onPointsChange();
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
                onPointsChange();
            }
        } catch {
            setMessage({ type: 'error', text: 'Decryption analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ TRANSMISSION DECRYPTED</div>
                <p className="text-cyber-muted text-sm">Bombing has been planned on Black Ridge Airfield</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StorylineDisplay level={3} />
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    The intercepted transmission uses a simple letter-shift cipher. Decrypt the message below:
                </p>

                {/* Encrypted message display */}
                <div className="bg-cyber-darker rounded border border-cyber-orange/30 p-4 mb-4">
                    <div className="text-xs text-cyber-muted mb-2 font-mono">INTERCEPTED TRANSMISSION:</div>
                    <div className="text-cyber-orange font-mono text-lg tracking-wider text-center font-bold">
                        {encryptedText}
                    </div>
                </div>

                {/* Answer input */}
                <div className="space-y-2">
                    <label className="text-xs text-cyber-muted font-mono">DECRYPTED MESSAGE:</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter the decrypted message..."
                        className="input-cyber w-full h-20 resize-none"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitting}
                    className="btn-neon flex-1"
                >
                    {submitting ? 'DECRYPTING...' : 'SUBMIT DECRYPTION'}
                </button>
                <HintButton level={3} onPointsChange={onPointsChange} />
            </div>
        </div>
    );
}

// ───────────────── Level 4: Binary Decoding ─────────────────

function BinaryDecodePuzzle({
    onComplete,
    disabled,
    onPointsChange,
}: {
    onComplete: () => void;
    disabled: boolean;
    onPointsChange: () => void;
}) {
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const binaryString = '1110010111111';

    const handleSubmit = async () => {
        if (!answer.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence4(answer) as { success: boolean; message: string; pointsEarned?: number; pointsDeducted?: number };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                onPointsChange();
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
                onPointsChange();
            }
        } catch {
            setMessage({ type: 'error', text: 'Binary analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ FRAGMENT DECODED</div>
                <p className="text-cyber-muted text-sm">Authentication code fragment: 7359</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StorylineDisplay level={4} />
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    A binary imprint was recovered from the transmission header. Decode the fragment to reveal the authentication code.
                </p>

                {/* Binary display */}
                <div className="bg-cyber-darker rounded border border-cyber-cyan/30 p-4 mb-4">
                    <div className="text-xs text-cyber-muted mb-2 font-mono">BINARY FRAGMENT:</div>
                    <div className="text-cyber-cyan font-mono text-3xl tracking-[0.3em] text-center font-bold">
                        {binaryString}
                    </div>
                </div>

                {/* Answer input */}
                <div className="space-y-2">
                    <label className="text-xs text-cyber-muted font-mono">DECODED VALUE:</label>
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter the decoded number..."
                        className="input-cyber w-full text-center text-lg tracking-widest"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitting}
                    className="btn-neon flex-1"
                >
                    {submitting ? 'DECODING...' : 'SUBMIT DECODED VALUE'}
                </button>
                <HintButton level={4} onPointsChange={onPointsChange} />
            </div>
        </div>
    );
}

// ───────────────── Level 5: Traitor Identification ─────────────────

function TraitorIdentificationPuzzle({
    onComplete,
    disabled,
    onPointsChange,
}: {
    onComplete: () => void;
    disabled: boolean;
    onPointsChange: () => void;
}) {
    const [selectedRegiment, setSelectedRegiment] = useState<string | null>(null);
    const [traitorId, setTraitorId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const regiments = [
        { id: 'airforce regiment', label: 'Airforce Regiment', icon: '✈️' },
        { id: 'communication field', label: 'Communication Field', icon: '📡' },
        { id: 'southern infantry', label: 'Southern Infantry', icon: '🎖️' },
    ];

    const handleSubmit = async () => {
        if (!selectedRegiment || !traitorId.trim()) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence5(selectedRegiment, traitorId) as {
                success: boolean;
                message: string;
                roundComplete?: boolean;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                onPointsChange();
                setTimeout(onComplete, 2000);
            } else {
                setMessage({ type: 'error', text: response.message });
                onPointsChange();
            }
        } catch {
            setMessage({ type: 'error', text: 'Identification analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                <div className="text-4xl mb-4">🎖️</div>
                <div className="text-cyber-green text-xl font-orbitron font-bold mb-2 tracking-widest uppercase">TRAITOR IDENTIFIED</div>
                <p className="text-cyber-green/70 text-sm font-mono tracking-tighter">
                    Investigation complete. Round 1 cleared.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StorylineDisplay level={5} />
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">

                {/* Q1: Regiment Selection */}
                <div className="mb-6">
                    <div className="bg-cyber-darker rounded border border-cyber-border p-3 mb-4 font-mono text-xs">
                        <div className="text-cyber-muted mb-2 border-b border-cyber-border pb-1">INTELLIGENCE BRIEF:</div>
                        <p className="text-cyber-text py-1">
                            The AirStrike information was shared first to the <span className="text-cyber-cyan">Airforce Regiment</span>,
                            then to the <span className="text-cyber-cyan">Communication Engineers</span>, and
                            <span className="text-cyber-cyan"> 2 Soldiers from the Southern Infantry</span> were present.
                        </p>
                    </div>

                    <p className="text-cyber-muted text-sm font-mono mb-3">
                        QUESTION 1: Based on the evidence, which regiment does the traitor belong to?
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {regiments.map(reg => (
                            <button
                                key={reg.id}
                                onClick={() => setSelectedRegiment(reg.id)}
                                className={`
                                    p-4 rounded border text-left transition-all duration-300 font-mono text-sm flex items-center gap-3
                                    ${selectedRegiment === reg.id
                                        ? 'border-cyber-cyan bg-[rgba(0,255,255,0.2)] text-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                                        : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 text-cyber-muted'}
                                `}
                            >
                                <span className="text-2xl">{reg.icon}</span>
                                <span>{reg.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Q2: Traitor ID */}
                <div>
                    <p className="text-cyber-muted text-sm font-mono mb-3">
                        QUESTION 2: Enter the Traitor&apos;s ID.
                    </p>
                    <p className="text-cyber-red text-xs font-mono mb-3">
                        ⚠ WARNING: If incorrect, you are accusing an innocent officer.
                    </p>
                    <input
                        type="text"
                        value={traitorId}
                        onChange={(e) => setTraitorId(e.target.value.toUpperCase())}
                        placeholder="ENTER TRAITOR ID (e.g. XX-0000000)"
                        className="input-cyber w-full text-center text-lg tracking-widest"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!selectedRegiment || !traitorId.trim() || submitting}
                    className="btn-neon flex-1"
                >
                    {submitting ? 'IDENTIFYING...' : '🎯 IDENTIFY TRAITOR'}
                </button>
                <HintButton level={5} onPointsChange={onPointsChange} />
            </div>
        </div>
    );
}

// ───────────────── Main Round 1 Page ─────────────────

export default function Round1Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activeLevel, setActiveLevel] = useState<number>(1);
    const [showAccessMessage, setShowAccessMessage] = useState<{ type: 'granted' | 'denied'; message: string } | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            console.log('Fetching Round 1 status...');
            const [statusData, timerData] = await Promise.all([
                api.getRound1Status() as Promise<RoundStatus>,
                api.getTimer() as Promise<{ expiresAt: string }>
            ]);
            console.log('Round 1 status received:', statusData);
            setStatus(statusData);
            setExpiresAt(timerData.expiresAt);
        } catch (error) {
            console.error('Failed to fetch Round 1 status:', error);
            router.push('/dashboard');
        }
    }, [router]);

    useEffect(() => {
        fetchStatus().finally(() => setLoading(false));
    }, [fetchStatus]);

    const handleLevelComplete = (levelNum: number) => {
        console.log(`Level ${levelNum} completed, refreshing status...`);
        setShowAccessMessage({ type: 'granted', message: `Level ${levelNum} Verified` });

        fetchStatus();

        setTimeout(() => {
            setShowAccessMessage(null);
            fetchStatus();
            if (levelNum < 5) {
                setActiveLevel(levelNum + 1);
            } else {
                // Level 5 = round complete, redirect to unlock page for Round 2
                setShowAccessMessage({ type: 'granted', message: 'Round 1 Complete! Enter key to unlock Round 2...' });
                setTimeout(() => {
                    router.push('/unlock?next=2');
                }, 2500);
            }
        }, 2000);
    };

    const handleTimerExpire = useCallback(() => {
        router.push('/unlock?next=2');
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Loading Intelligence...</p>
                </div>
            </div>
        );
    }

    const levels = [
        { num: 1, title: 'Torn Map Fragment', complete: status?.evidence1 },
        { num: 2, title: 'Bunker Mapping', complete: status?.evidence2 },
        { num: 3, title: 'Cipher Decryption', complete: status?.evidence3 },
        { num: 4, title: 'Binary Decoding', complete: status?.evidence4 },
        { num: 5, title: 'Traitor Identification', complete: status?.evidence5 },
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
                    <h1 className="text-3xl font-orbitron font-bold text-cyber-cyan">
                        ROUND 1: ATTACK ON BLACKRIDGE AIRFIELD
                    </h1>
                    <p className="text-cyber-muted text-sm font-mono mt-1">Year: 1943 · Eastern Front · Classified</p>
                </div>

                <div className="flex flex-wrap items-center">
                    <div className="text-center px-6 py-3 bg-cyber-dark rounded border border-cyber-border mr-8">
                        <div className="text-xs text-cyber-muted font-mono mb-1">ROUND SCORE</div>
                        <div className="text-2xl font-orbitron font-bold text-cyber-green">{status?.points || 0}</div>
                    </div>

                    {expiresAt && (
                        <div className="text-center px-6 py-3 bg-cyber-dark rounded border border-cyber-border mr-8">
                            <div className="text-xs text-cyber-muted font-mono mb-1">TIME REMAINING</div>
                            <Countdown expiresAt={expiresAt} onExpire={handleTimerExpire} />
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
                {/* Level Tabs */}
                <div className="lg:col-span-1">
                    <div className="card-cyber sticky top-4">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">INVESTIGATION</h2>
                        <div className="space-y-2">
                            {levels.map((lv) => (
                                <button
                                    key={lv.num}
                                    onClick={() => setActiveLevel(lv.num)}
                                    className={`
                                        w-full p-3 rounded-lg border text-left transition-all font-mono text-sm
                                        ${activeLevel === lv.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : lv.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue text-cyber-muted'}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${lv.complete ? 'border-cyber-green bg-cyber-green/20' : 'border-current'
                                            }`}>
                                            {lv.complete ? '✓' : lv.num}
                                        </span>
                                        <span>{lv.title}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Scoring Info */}
                        <div className="mt-4 p-3 bg-cyber-darker rounded border border-cyber-border">
                            <div className="text-xs text-cyber-muted font-mono space-y-1">
                                <div className="text-cyber-green">✓ Correct: +25 pts</div>
                                <div className="text-cyber-red">✗ Wrong: -10 pts</div>
                                <div className="text-cyber-orange">💡 Hint: -15 pts</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Level Panel */}
                <div className="lg:col-span-3">
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-orbitron font-bold text-cyber-text">
                                LEVEL {activeLevel}: {levels[activeLevel - 1].title}
                            </h2>
                            {levels[activeLevel - 1].complete && (
                                <span className="badge badge-complete">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            {activeLevel === 1 && (
                                <JigsawPuzzle
                                    onComplete={() => handleLevelComplete(1)}
                                    disabled={status?.evidence1 || false}
                                    onPointsChange={fetchStatus}
                                />
                            )}

                            {activeLevel === 2 && (
                                <BunkerSequencePuzzle
                                    onComplete={() => handleLevelComplete(2)}
                                    disabled={status?.evidence2 || false}
                                    onPointsChange={fetchStatus}
                                />
                            )}

                            {activeLevel === 3 && (
                                <CaesarCipherPuzzle
                                    onComplete={() => handleLevelComplete(3)}
                                    disabled={status?.evidence3 || false}
                                    onPointsChange={fetchStatus}
                                />
                            )}

                            {activeLevel === 4 && (
                                <BinaryDecodePuzzle
                                    onComplete={() => handleLevelComplete(4)}
                                    disabled={status?.evidence4 || false}
                                    onPointsChange={fetchStatus}
                                />
                            )}

                            {activeLevel === 5 && (
                                <TraitorIdentificationPuzzle
                                    onComplete={() => handleLevelComplete(5)}
                                    disabled={status?.evidence5 || false}
                                    onPointsChange={fetchStatus}
                                />
                            )}
                        </div>
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6">
                        <Terminal
                            title="INVESTIGATION_LOG"
                            lines={[
                                { type: 'prompt', text: 'Initializing investigation protocol...' },
                                { type: 'output', text: `[LEVEL 1] Torn Map Fragment: ${status?.evidence1 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[LEVEL 2] Bunker Mapping: ${status?.evidence2 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[LEVEL 3] Cipher Decryption: ${status?.evidence3 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[LEVEL 4] Binary Decoding: ${status?.evidence4 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[LEVEL 5] Traitor Identification: ${status?.evidence5 ? 'VERIFIED' : 'PENDING'}` },
                                {
                                    type: status?.completed ? 'success' : 'output',
                                    text: status?.completed
                                        ? '>>> INVESTIGATION COMPLETE – TRAITOR IDENTIFIED <<<'
                                        : '[IN PROGRESS] Complete all 5 levels to close the investigation'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
