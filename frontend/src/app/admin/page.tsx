'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal } from '@/components/ui';
import api from '@/lib/api';

interface Team {
    id: string;
    team_name: string;
    created_at: string;
    session: {
        id: string;
        status: string;
        currentRound: number;
        startedAt: string;
        expiresAt: string;
    } | null;
    roundProgress: Array<{
        round_number: number;
        evidence_1_complete: boolean;
        evidence_2_complete: boolean;
        evidence_3_complete: boolean;
        evidence_4_complete: boolean;
        completed_at: string | null;
    }> | null;
    attemptCount: number;
}

interface DashboardStats {
    stats: {
        totalTeams: number;
        activeSessions: number;
        completedSessions: number;
    };
    recentActivity: Array<{
        session_id: string;
        round_number: number;
        evidence_number: number;
        is_correct: boolean;
        attempted_at: string;
    }>;
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const [teams, setTeams] = useState<Team[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [teamsData, dashData] = await Promise.all([
                api.getTeams() as Promise<{ teams: Team[] }>,
                api.getDashboard() as Promise<DashboardStats>
            ]);
            setTeams(teamsData.teams);
            setDashboardData(dashData);
        } catch {
            // Handle error silently
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchData]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);

        try {
            const response = await api.adminLogin(username, password);
            if (response.success) {
                setIsAuthenticated(true);
            }
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (teamId: string, round: number) => {
        setActionLoading(true);
        try {
            await api.unlockTeamRound(teamId, round);
            await fetchData();
        } catch {
            alert('Unlock failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTimerControl = async (action: 'pause' | 'resume', teamId?: string) => {
        setActionLoading(true);
        try {
            await api.controlTimer(action, teamId);
            await fetchData();
        } catch {
            alert('Timer control failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.exportResults();
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mission-enigma-results.csv';
            a.click();
        } catch {
            alert('Export failed');
        }
    };

    const getProgressCount = (progress: Team['roundProgress'], roundNum: number) => {
        const round = progress?.find(r => r.round_number === roundNum);
        if (!round) return 0;
        let count = 0;
        if (round.evidence_1_complete) count++;
        if (round.evidence_2_complete) count++;
        if (round.evidence_3_complete) count++;
        if (round.evidence_4_complete) count++;
        return count;
    };

    const getRemainingTime = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) return 'EXPIRED';
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    // Login form
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card-cyber w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-4">🔐</div>
                        <h1 className="text-2xl font-orbitron font-bold text-cyber-cyan">
                            ADMIN ACCESS
                        </h1>
                        <p className="text-cyber-muted text-sm mt-2">
                            Mission Control Authorization Required
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-cyber-muted text-xs font-mono mb-2">
                                USERNAME
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-cyber"
                                placeholder="Enter admin username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-cyber-muted text-xs font-mono mb-2">
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-cyber"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {loginError && (
                            <div className="p-3 bg-cyber-red/10 border border-cyber-red rounded text-cyber-red text-sm font-mono">
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-neon w-full"
                        >
                            {loading ? 'AUTHENTICATING...' : 'ACCESS CONTROL PANEL'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-cyber-border text-center">
                        <button
                            onClick={() => router.push('/')}
                            className="text-cyber-muted hover:text-cyber-cyan text-sm font-mono"
                        >
                            ← Back to Main
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Admin dashboard
    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-orbitron font-bold text-cyber-cyan">
                        MISSION CONTROL
                    </h1>
                    <p className="text-cyber-muted font-mono text-sm">
                        Admin Panel • Live Monitoring
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="btn-neon text-sm"
                    >
                        📥 EXPORT CSV
                    </button>
                    <button
                        onClick={() => handleTimerControl('pause')}
                        disabled={actionLoading}
                        className="btn-neon danger text-sm"
                    >
                        ⏸ PAUSE ALL
                    </button>
                    <button
                        onClick={() => handleTimerControl('resume')}
                        disabled={actionLoading}
                        className="btn-neon success text-sm"
                    >
                        ▶ RESUME ALL
                    </button>
                    <button
                        onClick={() => {
                            api.clearToken();
                            setIsAuthenticated(false);
                        }}
                        className="text-cyber-muted hover:text-cyber-red text-sm font-mono"
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            {/* Stats overview */}
            {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="card-cyber text-center">
                        <div className="text-4xl font-orbitron text-cyber-cyan">
                            {dashboardData.stats.totalTeams}
                        </div>
                        <div className="text-cyber-muted text-sm font-mono">TOTAL TEAMS</div>
                    </div>
                    <div className="card-cyber text-center">
                        <div className="text-4xl font-orbitron text-cyber-green">
                            {dashboardData.stats.activeSessions}
                        </div>
                        <div className="text-cyber-muted text-sm font-mono">ACTIVE SESSIONS</div>
                    </div>
                    <div className="card-cyber text-center">
                        <div className="text-4xl font-orbitron text-cyber-orange">
                            {dashboardData.stats.completedSessions}
                        </div>
                        <div className="text-cyber-muted text-sm font-mono">COMPLETED</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Teams list */}
                <div className="lg:col-span-2">
                    <div className="card-cyber">
                        <h2 className="text-xl font-orbitron font-bold text-cyber-text mb-4">
                            TEAM MONITORING
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-mono">
                                <thead>
                                    <tr className="border-b border-cyber-border text-cyber-muted">
                                        <th className="text-left py-2">Team</th>
                                        <th className="text-center py-2">Status</th>
                                        <th className="text-center py-2">Round</th>
                                        <th className="text-center py-2">Progress</th>
                                        <th className="text-center py-2">Time</th>
                                        <th className="text-center py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr
                                            key={team.id}
                                            className={`border-b border-cyber-border/50 hover:bg-cyber-darker cursor-pointer ${selectedTeam === team.id ? 'bg-cyber-cyan/10' : ''
                                                }`}
                                            onClick={() => setSelectedTeam(team.id)}
                                        >
                                            <td className="py-3 text-cyber-text">{team.team_name}</td>
                                            <td className="py-3 text-center">
                                                <span className={`badge ${team.session?.status === 'completed' ? 'badge-complete' :
                                                        team.session?.status === 'active' ? 'badge-active' :
                                                            team.session?.status === 'paused' ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange' :
                                                                'badge-locked'
                                                    }`}>
                                                    {team.session?.status?.toUpperCase() || 'NOT STARTED'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center text-cyber-cyan">
                                                {team.session?.currentRound || '-'}
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {[1, 2, 3].map(r => (
                                                        <div
                                                            key={r}
                                                            className={`w-4 h-4 rounded-full border ${team.roundProgress?.find(p => p.round_number === r)?.completed_at
                                                                    ? 'bg-cyber-green border-cyber-green'
                                                                    : team.session?.currentRound === r
                                                                        ? 'bg-cyber-cyan/50 border-cyber-cyan'
                                                                        : 'border-cyber-border'
                                                                }`}
                                                            title={`Round ${r}: ${getProgressCount(team.roundProgress, r)}/4`}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                {team.session?.expiresAt ? (
                                                    <span className={
                                                        getRemainingTime(team.session.expiresAt) === 'EXPIRED'
                                                            ? 'text-cyber-red'
                                                            : 'text-cyber-green'
                                                    }>
                                                        {getRemainingTime(team.session.expiresAt)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {[2, 3].map(round => (
                                                        <button
                                                            key={round}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUnlock(team.id, round);
                                                            }}
                                                            disabled={actionLoading || !team.session}
                                                            className="text-xs px-2 py-1 bg-cyber-darker border border-cyber-border rounded hover:border-cyber-cyan disabled:opacity-50"
                                                            title={`Unlock Round ${round}`}
                                                        >
                                                            R{round}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {teams.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-cyber-muted">
                                                No teams registered yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Activity feed */}
                <div>
                    <div className="card-cyber">
                        <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">
                            RECENT ACTIVITY
                        </h2>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {dashboardData?.recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded border text-xs font-mono ${activity.is_correct
                                            ? 'border-cyber-green/30 bg-cyber-green/5'
                                            : 'border-cyber-red/30 bg-cyber-red/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={activity.is_correct ? 'text-cyber-green' : 'text-cyber-red'}>
                                            {activity.is_correct ? '✓' : '✗'} R{activity.round_number}E{activity.evidence_number}
                                        </span>
                                        <span className="text-cyber-muted">
                                            {new Date(activity.attempted_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                                <div className="text-center text-cyber-muted py-4">
                                    No activity yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected team details */}
                    {selectedTeam && (
                        <div className="mt-6 card-cyber">
                            <h2 className="text-lg font-orbitron font-bold text-cyber-text mb-4">
                                TEAM DETAILS
                            </h2>

                            {(() => {
                                const team = teams.find(t => t.id === selectedTeam);
                                if (!team) return null;

                                return (
                                    <div className="space-y-4 text-sm font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-cyber-muted">Name:</span>
                                            <span className="text-cyber-text">{team.team_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-cyber-muted">Attempts:</span>
                                            <span className="text-cyber-cyan">{team.attemptCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-cyber-muted">Current Round:</span>
                                            <span className="text-cyber-green">{team.session?.currentRound || 'N/A'}</span>
                                        </div>

                                        <div className="pt-4 border-t border-cyber-border space-y-2">
                                            <button
                                                onClick={() => team.session && handleTimerControl('pause', team.id)}
                                                disabled={actionLoading}
                                                className="btn-neon danger w-full text-xs"
                                            >
                                                PAUSE TEAM
                                            </button>
                                            <button
                                                onClick={() => team.session && handleTimerControl('resume', team.id)}
                                                disabled={actionLoading}
                                                className="btn-neon success w-full text-xs"
                                            >
                                                RESUME TEAM
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Terminal log */}
            <div className="mt-8">
                <Terminal
                    title="SYSTEM_LOG"
                    lines={[
                        { type: 'prompt', text: 'Admin session active' },
                        { type: 'output', text: `[INFO] ${teams.length} teams registered` },
                        { type: 'output', text: `[INFO] ${dashboardData?.stats.activeSessions || 0} active sessions` },
                        { type: 'success', text: '>>> MONITORING ENABLED <<<' },
                    ]}
                />
            </div>
        </div>
    );
}
