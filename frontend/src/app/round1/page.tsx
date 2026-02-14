'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Countdown, AccessMessage } from '@/components/ui';
import api from '@/lib/api';

interface RoundStatus {
    evidence1: boolean;
    evidence2: boolean;
    evidence3: boolean;
    evidence4: boolean;
    escapeCodeUnlocked: boolean;
    points: number;
    completed: boolean;
}

// Drag and Drop System Flow Component
function SystemFlowPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [items, setItems] = useState([
        { id: 'biometric', label: 'Biometric Sensor', icon: 'fingerprint' },
        { id: 'cctv', label: 'CCTV Camera', icon: 'videocam' },
        { id: 'monitoring', label: 'Monitoring Terminal', icon: 'desktop_windows' },
        { id: 'db', label: 'Access Log DB', icon: 'storage' },
        { id: 'server', label: 'Control Server', icon: 'dns' },
    ]);
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
        const item = [
            { id: 'biometric', label: 'Biometric Sensor', icon: 'fingerprint' },
            { id: 'cctv', label: 'CCTV Camera', icon: 'videocam' },
            { id: 'server', label: 'Control Server', icon: 'dns' },
            { id: 'db', label: 'Access Log DB', icon: 'storage' },
            { id: 'monitoring', label: 'Monitoring Terminal', icon: 'desktop_windows' },
        ].find(i => i.id === id);

        if (item) {
            setItems([...items, item]);
            setDropZone(dropZone.filter(i => i !== id));
        }
    };

    const handleSubmit = async () => {
        if (dropZone.length !== 5) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence1(dropZone) as { success: boolean; message: string; pointsEarned?: number };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message} (+${response.pointsEarned} Points)` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Validation failed. Try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const getItemLabel = (id: string) => {
        const labels: Record<string, string> = {
            biometric: 'Entry Biometric Sensor',
            cctv: 'CCTV Camera',
            server: 'Control Server',
            db: 'Access Log Database',
            monitoring: 'Monitoring Terminal',
        };
        return labels[id] || id;
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ FLOW RECONSTRUCTED</div>
                <p className="text-cyber-muted text-sm">System operational sequence verified</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    Arrange the components in the correct operational sequence (Source → Destination).
                </p>

                {/* Available Items */}
                <div className="mb-4">
                    <div className="text-xs text-cyber-muted mb-2">AVAILABLE COMPONENTS:</div>
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
                                {item.icon === 'fingerprint' && <span className="text-cyber-cyan">👆</span>}
                                {item.icon === 'videocam' && <span className="text-cyber-cyan">📷</span>}
                                {item.icon === 'dns' && <span className="text-cyber-cyan">🖥️</span>}
                                {item.icon === 'storage' && <span className="text-cyber-cyan">💾</span>}
                                {item.icon === 'desktop_windows' && <span className="text-cyber-cyan">💻</span>}
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
                        <span className="text-cyber-muted text-sm w-full text-center">Drag components here in sequence...</span>
                    ) : (
                        dropZone.map((id, index) => (
                            <div key={id} className="flex items-center gap-1">
                                <div
                                    className="px-3 py-1 bg-cyber-cyan/20 border border-cyber-cyan rounded text-xs font-mono cursor-pointer hover:bg-cyber-red/20 hover:border-cyber-red"
                                    onClick={() => handleRemove(id)}
                                >
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

            <button
                onClick={handleSubmit}
                disabled={dropZone.length !== 5 || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'VALIDATING...' : 'VERIFY FLOW'}
            </button>
        </div>
    );
}

// Failure Point Selection Component
function FailurePointPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const nodes = [
        { id: 'cctv', label: 'CCTV Camera', icon: 'videocam' },
        { id: 'server', label: 'Control Server', icon: 'dns' },
        { id: 'db', label: 'Access Log DB', icon: 'storage' },
        { id: 'monitoring', label: 'Monitoring Terminal', icon: 'desktop_windows' },
    ];

    const handleSubmit = async () => {
        if (!selectedNode) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence2(selectedNode) as { success: boolean; message: string; pointsEarned?: number; pointsDeducted?: number };
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message} (+${response.pointsEarned} Points)` });
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message} (-${response.pointsDeducted} Points)` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Node analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ LOCATION CONFIRMED</div>
                <p className="text-cyber-muted text-sm">Failure point isolated: Control Server</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    Live feed was visible, but no footage or logs were recorded. Identify the failure point.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nodes.map(node => (
                        <button
                            key={node.id}
                            onClick={() => setSelectedNode(node.id)}
                            className={`
                p-4 rounded border text-left transition-all duration-300 font-mono text-sm flex items-center gap-3
                ${selectedNode === node.id
                                    ? 'border-cyber-cyan bg-[rgba(0,255,255,0.2)] text-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                                    : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 text-cyber-muted'}
              `}
                        >
                            {/* Icon placeholders if needed, currently using text based icons in previous comp, let's just keep text label clean or reuse previous icons logic if mapped */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-cyber-darker border ${selectedNode === node.id ? 'border-cyber-cyan' : 'border-cyber-border'}`}>
                                {node.id === 'cctv' && '📷'}
                                {node.id === 'server' && '🖥️'}
                                {node.id === 'db' && '💾'}
                                {node.id === 'monitoring' && '💻'}
                            </div>
                            <span>{node.label}</span>
                        </button>
                    ))}
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

            <button
                onClick={handleSubmit}
                disabled={!selectedNode || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'ANALYZING...' : 'CONFIRM FAILURE LOCATION'}
            </button>
        </div>
    );
}

// Corrupted Logs Puzzle (Reason Selection)
function CorruptedLogsPuzzle({
    onComplete,
    disabled
}: {
    onComplete: () => void;
    disabled: boolean;
}) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const reasons = [
        { id: 'storage', label: 'Storage Overflow' },
        { id: 'power', label: 'Power Surge' },
        { id: 'datetime', label: 'Date & Time Mismatch' }, // Correct
        { id: 'firmware', label: 'Camera Firmware Bug' },
    ];

    const handleSubmit = async () => {
        if (!selectedReason) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await api.submitEvidence3(selectedReason as any) as { success: boolean; message: string; pointsEarned?: number; pointsDeducted?: number };
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
                <div className="text-cyber-green text-lg font-mono mb-2">✓ CAUSE IDENTIFIED</div>
                <p className="text-cyber-muted text-sm">Corrupted logs attributed to Date & Time mismatch</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    Recovered logs exist, but timestamps don&apos;t align with the murder timeline.
                    Why was the digital evidence corrupted or unreliable?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reasons.map(reason => (
                        <button
                            key={reason.id}
                            onClick={() => setSelectedReason(reason.id)}
                            className={`
                p-4 rounded border text-left transition-all duration-300 font-mono text-sm
                ${selectedReason === reason.id
                                    ? 'border-cyber-cyan bg-[rgba(0,255,255,0.2)] text-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                                    : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 text-cyber-muted'}
              `}
                        >
                            {reason.label}
                        </button>
                    ))}
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

            <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'ANALYZING...' : 'CONFIRM CAUSE'}
            </button>
        </div>
    );
}

// Root Cause Analysis Component
function RootCausePuzzle({
    onComplete,
    onEscapeUnlock,
    disabled
}: {
    onComplete: () => void;
    onEscapeUnlock: () => void;
    disabled: boolean;
}) {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const adminLogs = [
        { time: '01:52 AM', user: 'ADMIN', action: 'Admin login' },
        { time: '01:54 AM', user: 'ADMIN', action: 'Recording Mode Changed' },
        { time: '01:55 AM', user: 'ADMIN', action: 'Admin logout' },
    ];

    const handleSubmit = async () => {
        if (!selectedChoice) return;
        setSubmitting(true);
        setMessage(null);

        try {
            console.log('Submitting Evidence 4:', selectedChoice);
            const response = await api.submitEvidence4(selectedChoice) as {
                success: boolean;
                message: string;
                escapeCodeUnlocked?: boolean;
                pointsEarned?: number;
                pointsDeducted?: number;
            };
            console.log('Evidence 4 response:', response);
            if (response.success) {
                setMessage({ type: 'success', text: `${response.message} (+${response.pointsEarned} Points)` });
                if (response.escapeCodeUnlocked) {
                    console.log('Escape code unlocked, triggering refresh');
                    onEscapeUnlock();
                }
                setTimeout(onComplete, 1500);
            } else {
                setMessage({ type: 'error', text: `${response.message} (-${response.pointsDeducted} Points)` });
            }
        } catch (err) {
            console.error('Evidence 4 submission error:', err);
            setMessage({ type: 'error', text: 'Analysis failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (disabled) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-green text-center">
                <div className="text-cyber-green text-lg font-mono mb-2">✓ ROOT CAUSE CONFIRMED</div>
                <p className="text-cyber-muted text-sm">Investigation complete - Human Error (Manual Mode)</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyber-dark rounded border border-cyber-border">
                <p className="text-cyber-muted text-sm font-mono mb-4">
                    Someone accessed the system shortly before the blackout. What was the most likely reason the system failed to record the incident?
                </p>

                {/* Admin log viewer */}
                <div className="bg-cyber-darker rounded border border-cyber-border p-3 mb-4 font-mono text-xs">
                    <div className="text-cyber-muted mb-2 border-b border-cyber-border pb-1">SYSTEM LOGS:</div>
                    {adminLogs.map((log, index) => (
                        <div
                            key={index}
                            className="py-1"
                        >
                            <span className="text-cyber-orange">[{log.time}]</span>
                            <span className="text-cyber-cyan mx-2">{log.user}</span>
                            <span className="text-cyber-text">{log.action}</span>
                            {log.action.includes('Mode') && <span className="text-cyber-red ml-2">&lt; WARNING</span>}
                        </div>
                    ))}
                    <div className="mt-2 text-cyber-muted italic">... Recording Mode: Manual ...</div>
                </div>

                {/* Choice buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button
                        onClick={() => setSelectedChoice('system-crash')}
                        className={`
              p-4 rounded-lg border-2 text-left transition-all duration-300
              ${selectedChoice === 'system-crash'
                                ? 'border-cyber-cyan bg-[rgba(0,255,255,0.2)] text-cyber-cyan'
                                : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5'}
            `}
                    >
                        <div className={`text-lg font-bold ${selectedChoice === 'system-crash' ? 'text-cyber-cyan' : ''}`}>💥 System Crash</div>
                        <p className="text-cyber-muted text-xs">Hardware or software failure caused the outage</p>
                    </button>

                    <button
                        onClick={() => setSelectedChoice('manual-mode')}
                        className={`
              p-4 rounded-lg border-2 text-left transition-all duration-300
              ${selectedChoice === 'manual-mode'
                                ? 'border-cyber-cyan bg-[rgba(0,255,255,0.2)] text-cyber-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                                : 'border-cyber-border hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5'}
            `}
                    >
                        <div className={`text-lg font-bold mb-1 ${selectedChoice === 'manual-mode' ? 'text-cyber-cyan' : ''}`}>🔐 Manual Mode</div>
                        <p className="text-cyber-muted text-xs">Recording was set to Manual Mode (Human Error)</p>
                    </button>
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

            <button
                onClick={handleSubmit}
                disabled={!selectedChoice || submitting}
                className="btn-neon w-full"
            >
                {submitting ? 'ANALYZING...' : 'CONFIRM ROOT CAUSE'}
            </button>
        </div>
    );
}

// Escape Code Input Component
function EscapeCodeInput({
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
            const response = await api.submitEscapeCode(code) as {
                success: boolean;
                message: string;
                roundComplete?: boolean;
            };
            if (response.success) {
                setMessage({ type: 'success', text: response.message });
                setTimeout(onComplete, 2000);
            } else {
                setMessage({ type: 'error', text: response.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Escape code validation failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!unlocked) {
        return (
            <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-border">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-orbitron text-cyber-muted mb-2">ESCAPE CODE LOCKED</h3>
                    <p className="text-cyber-muted text-sm font-mono">
                        Complete Evidence 2, 3, and 4 to unlock the escape code
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-cyber-dark rounded-lg border border-cyber-cyan animate-pulse-slow">
            <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔓</div>
                <h3 className="text-xl font-orbitron text-cyber-cyan mb-2">ESCAPE CODE UNLOCKED</h3>
                <p className="text-cyber-muted text-sm font-mono">
                    Enter the escape code to complete Round 1
                </p>
            </div>

            <div className="flex gap-4">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ENTER ESCAPE CODE"
                    className="input-cyber flex-1 text-center text-lg tracking-widest"
                />
                <button
                    onClick={handleSubmit}
                    disabled={!code.trim() || submitting}
                    className="btn-neon success"
                >
                    {submitting ? '...' : 'SUBMIT'}
                </button>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded border ${message.type === 'success'
                    ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                    : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
                    } font-mono text-sm text-center`}>
                    {message.text}
                </div>
            )}

            <div className="mt-6 p-3 bg-cyber-darker rounded border border-cyber-border">
                <p className="text-cyber-muted text-xs font-mono text-center">
                    HINT: Combine the answers from Levels 2, 3, and 4 (First letters: C, D, M).
                </p>
            </div>
        </div>
    );
}

// Main Round 1 Page
export default function Round1Page() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<RoundStatus | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [activeEvidence, setActiveEvidence] = useState<number>(1);
    const [showAccessMessage, setShowAccessMessage] = useState<{ type: 'granted' | 'denied'; message: string } | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            console.log('Fetching Round 1 status...');
            const [statusData, timerData] = await Promise.all([
                api.getRound1Status() as Promise<RoundStatus>,
                api.getTimer() as Promise<{ expiresAt: string }>
            ]);
            console.log('Round 1 status received:', statusData);
            console.log('Evidence statuses:', {
                evidence1: statusData.evidence1,
                evidence2: statusData.evidence2,
                evidence3: statusData.evidence3,
                evidence4: statusData.evidence4,
                escapeCodeUnlocked: statusData.escapeCodeUnlocked,
                points: statusData.points
            });
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

    const handleEvidenceComplete = (evidenceNum: number) => {
        console.log(`Evidence ${evidenceNum} completed, refreshing status...`);
        setShowAccessMessage({ type: 'granted', message: `Evidence ${evidenceNum} Verified` });

        // Immediate status refresh
        fetchStatus().then(() => {
            console.log('Status refreshed after evidence completion');
        });

        setTimeout(() => {
            setShowAccessMessage(null);
            // Force another refresh to ensure state is updated
            fetchStatus();
            if (evidenceNum < 4) {
                setActiveEvidence(evidenceNum + 1);
            } else {
                // Evidence 4 complete -> Scroll to escape code input
                const escapeInput = document.getElementById('escape-code-section');
                if (escapeInput) {
                    escapeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    escapeInput.classList.add('animate-pulse');
                }
            }
        }, 2000);
    };

    const handleRoundComplete = () => {
        setShowAccessMessage({ type: 'granted', message: 'Round 1 Complete! Proceeding to Round 2...' });
        setTimeout(() => {
            router.push('/round2');
        }, 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mx-auto mb-4" />
                    <p className="text-cyber-muted font-mono">Loading Evidence...</p>
                </div>
            </div>
        );
    }

    const evidences = [
        { num: 1, title: 'System Flow Reconstruction', complete: status?.evidence1 },
        { num: 2, title: 'Failure Location', complete: status?.evidence2 },
        { num: 3, title: 'Corrupted Evidence Analysis', complete: status?.evidence3 },
        { num: 4, title: 'Root Cause & Human Involvement', complete: status?.evidence4 },
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
                        ROUND 1: THE SILENT CONTROL ROOM MURDER
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
                {/* Evidence Tabs */}
                <div className="lg:col-span-1">
                    <div className="card-cyber sticky top-4">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">EVIDENCE</h2>
                        <div className="space-y-2">
                            {evidences.map((ev) => (
                                <button
                                    key={ev.num}
                                    onClick={() => setActiveEvidence(ev.num)}
                                    className={`
                    w-full p-3 rounded-lg border text-left transition-all font-mono text-sm
                    ${activeEvidence === ev.num
                                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                                            : ev.complete
                                                ? 'border-cyber-green bg-cyber-green/5 text-cyber-green'
                                                : 'border-cyber-border hover:border-cyber-blue text-cyber-muted'}
                  `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${ev.complete ? 'border-cyber-green bg-cyber-green/20' : 'border-current'
                                            }`}>
                                            {ev.complete ? '✓' : ev.num}
                                        </span>
                                        <span>{ev.title}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Escape Code Section */}
                    <div id="escape-code-section" className="mt-6 scroll-mt-20">
                        <EscapeCodeInput
                            unlocked={status?.escapeCodeUnlocked || false}
                            onComplete={handleRoundComplete}
                        />
                    </div>
                </div>

                {/* Active Evidence Panel */}
                <div className="lg:col-span-3">
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-orbitron font-bold text-cyber-text">
                                EVIDENCE {activeEvidence}: {evidences[activeEvidence - 1].title}
                            </h2>
                            {evidences[activeEvidence - 1].complete && (
                                <span className="badge badge-complete">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            {activeEvidence === 1 && (
                                <SystemFlowPuzzle
                                    onComplete={() => handleEvidenceComplete(1)}
                                    disabled={status?.evidence1 || false}
                                />
                            )}

                            {activeEvidence === 2 && (
                                <FailurePointPuzzle
                                    onComplete={() => handleEvidenceComplete(2)}
                                    disabled={status?.evidence2 || false}
                                />
                            )}

                            {activeEvidence === 3 && (
                                <CorruptedLogsPuzzle
                                    onComplete={() => handleEvidenceComplete(3)}
                                    disabled={status?.evidence3 || false}
                                />
                            )}

                            {activeEvidence === 4 && (
                                <RootCausePuzzle
                                    onComplete={() => handleEvidenceComplete(4)}
                                    onEscapeUnlock={fetchStatus}
                                    disabled={status?.evidence4 || false}
                                />
                            )}
                        </div>
                    </div>

                    {/* Terminal Output */}
                    <div className="mt-6">
                        <Terminal
                            title="ANALYSIS_LOG"
                            lines={[
                                { type: 'prompt', text: 'Initializing evidence analysis...' },
                                { type: 'output', text: `[STATUS] Evidence 1: ${status?.evidence1 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[STATUS] Evidence 2: ${status?.evidence2 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[STATUS] Evidence 3: ${status?.evidence3 ? 'VERIFIED' : 'PENDING'}` },
                                { type: 'output', text: `[STATUS] Evidence 4: ${status?.evidence4 ? 'VERIFIED' : 'PENDING'}` },
                                {
                                    type: status?.escapeCodeUnlocked ? 'success' : 'output',
                                    text: status?.escapeCodeUnlocked
                                        ? '>>> ESCAPE CODE UNLOCKED - ENTER CODE TO PROCEED <<<'
                                        : '[LOCKED] Complete Evidence 2, 3, 4 to unlock escape code'
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
