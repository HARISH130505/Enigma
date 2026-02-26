'use client';

import { useEffect, useState, useRef } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    onComplete?: () => void;
    className?: string;
    cursor?: boolean;
}

export function Typewriter({
    text,
    speed = 50,
    delay = 0,
    onComplete,
    className = '',
    cursor = true
}: TypewriterProps) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayText('');
        indexRef.current = 0;
        setIsComplete(false);

        const startTyping = setTimeout(() => {
            const interval = setInterval(() => {
                if (indexRef.current < text.length) {
                    setDisplayText(text.slice(0, indexRef.current + 1));
                    indexRef.current++;
                } else {
                    clearInterval(interval);
                    setIsComplete(true);
                    onComplete?.();
                }
            }, speed);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTyping);
    }, [text, speed, delay, onComplete]);

    return (
        <span className={className}>
            {displayText}
            {cursor && !isComplete && <span className="typing-cursor" />}
        </span>
    );
}

interface TerminalProps {
    lines: Array<{
        type: 'prompt' | 'command' | 'output' | 'error' | 'success';
        text: string;
    }>;
    title?: string;
    className?: string;
    animate?: boolean;
}

export function Terminal({
    lines,
    title = 'ENIGMA_TERMINAL',
    className = '',
    animate = false
}: TerminalProps) {
    const [visibleLines, setVisibleLines] = useState<typeof lines>(animate ? [] : lines);

    useEffect(() => {
        if (!animate) {
            setVisibleLines(lines);
            return;
        }

        setVisibleLines([]);
        let index = 0;

        const interval = setInterval(() => {
            if (index < lines.length) {
                setVisibleLines(prev => [...prev, lines[index]]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [lines, animate]);

    const getLineClass = (type: string) => {
        switch (type) {
            case 'prompt': return 'terminal-prompt';
            case 'command': return 'terminal-command';
            case 'error': return 'terminal-error';
            case 'success': return 'terminal-success';
            default: return 'terminal-output';
        }
    };

    return (
        <div className={`terminal ${className}`}>
            <div className="terminal-header">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="ml-4 text-cyber-muted text-sm font-mono">{title}</span>
            </div>
            <div className="terminal-body">
                {visibleLines.map((line, index) => {
                    if (!line) return null;
                    return (
                        <div key={index} className={`terminal-line ${getLineClass(line.type)}`}>
                            {line.type === 'prompt' && <span className="mr-2">❯</span>}
                            {line.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface GlitchTextProps {
    text: string;
    className?: string;
    intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ text, className = '', intensity = 'medium' }: GlitchTextProps) {
    return (
        <span className={`glitch ${className}`} data-text={text}>
            {text}
        </span>
    );
}

interface CountdownProps {
    expiresAt: string;
    onExpire?: () => void;
    className?: string;
}

export function Countdown({ expiresAt, onExpire, className = '' }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ minutes: 60, seconds: 0 });
    const [status, setStatus] = useState<'normal' | 'warning' | 'danger'>('normal');
    const expiredRef = useRef(false);

    useEffect(() => {
        expiredRef.current = false;
    }, [expiresAt]);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const target = new Date(expiresAt);
            const diff = Math.max(0, target.getTime() - now.getTime());

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setTimeLeft({ minutes, seconds });

            if (minutes < 5) {
                setStatus('danger');
            } else if (minutes < 15) {
                setStatus('warning');
            } else {
                setStatus('normal');
            }

            if (diff <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpire?.();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpire]);

    return (
        <div className={`countdown ${status} ${className} tracking-widest`}>
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </div>
    );
}

interface ProgressTrackerProps {
    rounds: Array<{
        number: number;
        name: string;
        status: 'locked' | 'active' | 'complete';
        evidenceComplete?: number;
        evidenceTotal?: number;
    }>;
    className?: string;
}

export function ProgressTracker({ rounds, className = '' }: ProgressTrackerProps) {
    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {rounds.map((round, index) => (
                <div key={round.number} className="flex items-center gap-4">
                    <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold
            ${round.status === 'complete' ? 'bg-cyber-green/20 text-cyber-green border-2 border-cyber-green' :
                            round.status === 'active' ? 'bg-cyber-cyan/20 text-cyber-cyan border-2 border-cyber-cyan' :
                                'bg-cyber-dark text-cyber-muted border border-cyber-border'}
          `}>
                        {round.status === 'complete' ? '✓' : round.number}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className={`font-medium ${round.status === 'locked' ? 'text-cyber-muted' : 'text-cyber-text'
                                }`}>
                                {round.name}
                            </span>
                            <span className={`badge ${round.status === 'complete' ? 'badge-complete' :
                                round.status === 'active' ? 'badge-active' : 'badge-locked'
                                }`}>
                                {round.status === 'complete' ? 'COMPLETE' :
                                    round.status === 'active' ? 'ACTIVE' : 'LOCKED'}
                            </span>
                        </div>

                        {round.status !== 'locked' && round.evidenceTotal && (
                            <div className="mt-2">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${((round.evidenceComplete || 0) / round.evidenceTotal) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {index < rounds.length - 1 && (
                        <div className={`absolute left-5 w-0.5 h-8 ${rounds[index + 1].status !== 'locked' ? 'bg-cyber-cyan' : 'bg-cyber-border'
                            }`} style={{ top: '100%' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

interface SystemIntegrityProps {
    level: number; // 0-100
    className?: string;
}

export function SystemIntegrity({ level, className = '' }: SystemIntegrityProps) {
    const getColor = () => {
        if (level > 70) return 'cyber-green';
        if (level > 40) return 'cyber-orange';
        return 'cyber-red';
    };

    const getLabel = () => {
        if (level > 70) return 'OPERATIONAL';
        if (level > 40) return 'DEGRADED';
        return 'CRITICAL';
    };

    return (
        <div className={`${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyber-muted font-mono">SYSTEM INTEGRITY</span>
                <span className={`text-sm font-bold text-${getColor()}`}>{getLabel()}</span>
            </div>
            <div className="h-3 bg-cyber-dark rounded-full overflow-hidden border border-cyber-border">
                <div
                    className={`h-full bg-${getColor()} transition-all duration-500`}
                    style={{ width: `${level}%` }}
                />
            </div>
            <div className="flex justify-between mt-1">
                {[0, 25, 50, 75, 100].map(mark => (
                    <div key={mark} className="w-0.5 h-1 bg-cyber-border" />
                ))}
            </div>
        </div>
    );
}

interface AccessMessageProps {
    type: 'granted' | 'denied';
    message?: string;
    onComplete?: () => void;
}

export function AccessMessage({ type, message, onComplete }: AccessMessageProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete?.();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`
      fixed inset-0 flex items-center justify-center z-50
      bg-cyber-black/90 backdrop-blur-sm
    `}>
            <div className={`
        text-center p-8 rounded-lg border-2
        ${type === 'granted'
                    ? 'border-cyber-green access-granted'
                    : 'border-cyber-red access-denied'}
      `}>
                <div className={`
          text-6xl font-orbitron font-black mb-4
          ${type === 'granted' ? 'text-cyber-green' : 'text-cyber-red'}
        `}>
                    {type === 'granted' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </div>
                {message && (
                    <p className="text-cyber-muted font-mono">{message}</p>
                )}
            </div>
        </div>
    );
}
