'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal } from '@/components/ui';
import api from '@/lib/api';

interface RoundScore {
    round: number;
    points: number;
    completedAt: string | null;
}

interface Team {
    id: string;
    team_name: string;
    access_code: string;
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
    roundScores: RoundScore[];
    totalScore: number;
    lastCompletedAt: string | null;
    attemptCount: number;
}

interface LeaderboardEntry {
    teamId: string;
    teamName: string;
    totalScore: number;
    roundScores: RoundScore[];
    lastCompletedAt: string | null;
    status: string;
    currentRound: number;
    startedAt: string | null;
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

type TabId = 'overview' | 'teams' | 'leaderboard' | 'manage';

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [teams, setTeams] = useState<Team[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Team creation form
    const [newTeamName, setNewTeamName] = useState('');
    const [newAccessCode, setNewAccessCode] = useState('');
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [teamsData, dashData, lbData] = await Promise.all([
                api.getTeams() as Promise<{ teams: Team[] }>,
                api.getDashboard() as Promise<DashboardStats>,
                api.getLeaderboard() as Promise<{ leaderboard: LeaderboardEntry[] }>
            ]);
            setTeams(teamsData.teams);
            setDashboardData(dashData);
            setLeaderboard(lbData.leaderboard);
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

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');
        setActionLoading(true);

        try {
            await api.createTeam(newTeamName, newAccessCode);
            setCreateSuccess(`Team "${newTeamName}" created successfully!`);
            setNewTeamName('');
            setNewAccessCode('');
            await fetchData();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create team');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Delete team "${teamName}"? This will remove all their data.`)) return;
        setActionLoading(true);
        try {
            await api.deleteTeam(teamId);
            await fetchData();
        } catch {
            alert('Delete failed');
        } finally {
            setActionLoading(false);
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

    const getRemainingTime = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) return 'EXPIRED';
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const formatTimestamp = (ts: string | null) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: 'short'
        });
    };

    const getRankMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    const getRankClass = (index: number) => {
        if (index === 0) return 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_20px_rgba(250,204,21,0.15)]';
        if (index === 1) return 'border-gray-300 bg-gray-300/5 shadow-[0_0_15px_rgba(209,213,219,0.1)]';
        if (index === 2) return 'border-amber-600 bg-amber-600/5 shadow-[0_0_15px_rgba(217,119,6,0.1)]';
        return 'border-cyber-border';
    };

    const tabs: { id: TabId; label: string; icon: string }[] = [
        { id: 'overview', label: 'OVERVIEW', icon: '📊' },
        { id: 'teams', label: 'SCORE MONITOR', icon: '🎯' },
        { id: 'leaderboard', label: 'LEADERBOARD', icon: '🏆' },
        { id: 'manage', label: 'TEAM MANAGER', icon: '⚙️' },
    ];

    // Login form
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #0d1117 0%, #0a0a0f 70%)' }}>
                <div className="card-cyber w-full max-w-md" style={{ border: '1px solid rgba(0,255,255,0.2)' }}>
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.5))' }}>🔐</div>
                        <h1 className="text-2xl font-orbitron font-bold" style={{ color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
                            MISSION CONTROL
                        </h1>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                            Administrator Authorization Required
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '2px' }}>
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
                            <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '2px' }}>
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
                            <div className="p-3 rounded text-sm font-mono" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                                {loginError}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-neon w-full">
                            {loading ? 'AUTHENTICATING...' : 'ACCESS CONTROL PANEL'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm font-mono transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
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
        <div className="min-h-screen p-4 md:p-6" style={{ background: 'radial-gradient(ellipse at top, #0d1117 0%, #0a0a0f 70%)' }}>
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-orbitron font-bold" style={{ color: 'var(--accent-cyan)', textShadow: '0 0 30px rgba(0,255,255,0.3)' }}>
                        MISSION CONTROL
                    </h1>
                    <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                        Admin Dashboard • Live Monitoring • {new Date().toLocaleTimeString()}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button onClick={handleExport} className="btn-neon text-xs" style={{ padding: '8px 16px' }}>
                        📥 EXPORT CSV
                    </button>
                    <button
                        onClick={() => handleTimerControl('pause')}
                        disabled={actionLoading}
                        className="btn-neon danger text-xs"
                        style={{ padding: '8px 16px' }}
                    >
                        ⏸ PAUSE ALL
                    </button>
                    <button
                        onClick={() => handleTimerControl('resume')}
                        disabled={actionLoading}
                        className="btn-neon success text-xs"
                        style={{ padding: '8px 16px' }}
                    >
                        ▶ RESUME ALL
                    </button>
                    <button
                        onClick={() => {
                            api.clearToken();
                            setIsAuthenticated(false);
                        }}
                        className="text-sm font-mono transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            {/* Tab navigation */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="px-4 py-3 font-mono text-sm font-semibold whitespace-nowrap transition-all rounded-t-lg"
                        style={{
                            color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            background: activeTab === tab.id ? 'rgba(0,255,255,0.05)' : 'transparent',
                            borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                            letterSpacing: '1px',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
                <div>
                    {/* Stats overview */}
                    {dashboardData && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="card-cyber text-center">
                                <div className="text-4xl font-orbitron" style={{ color: 'var(--accent-cyan)' }}>
                                    {dashboardData.stats.totalTeams}
                                </div>
                                <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>TOTAL TEAMS</div>
                            </div>
                            <div className="card-cyber text-center">
                                <div className="text-4xl font-orbitron" style={{ color: 'var(--accent-green)' }}>
                                    {dashboardData.stats.activeSessions}
                                </div>
                                <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>ACTIVE SESSIONS</div>
                            </div>
                            <div className="card-cyber text-center">
                                <div className="text-4xl font-orbitron" style={{ color: 'var(--warning)' }}>
                                    {dashboardData.stats.completedSessions}
                                </div>
                                <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>COMPLETED</div>
                            </div>
                            <div className="card-cyber text-center">
                                <div className="text-4xl font-orbitron" style={{ color: '#a78bfa' }}>
                                    {leaderboard.length > 0 ? leaderboard[0].totalScore : 0}
                                </div>
                                <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>TOP SCORE</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick team status */}
                        <div className="lg:col-span-2">
                            <div className="card-cyber">
                                <h2 className="text-lg font-orbitron font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                    TEAM STATUS
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-mono">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                <th className="text-left py-2">Team</th>
                                                <th className="text-center py-2">Status</th>
                                                <th className="text-center py-2">Round</th>
                                                <th className="text-center py-2">Total Score</th>
                                                <th className="text-center py-2">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teams.map((team) => (
                                                <tr key={team.id} style={{ borderBottom: '1px solid rgba(48,54,61,0.5)' }}>
                                                    <td className="py-3" style={{ color: 'var(--text-primary)' }}>{team.team_name}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`badge ${team.session?.status === 'completed' ? 'badge-complete' :
                                                            team.session?.status === 'active' ? 'badge-active' :
                                                                team.session?.status === 'paused' ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange' :
                                                                    'badge-locked'
                                                            }`}>
                                                            {team.session?.status?.toUpperCase() || 'NOT STARTED'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center" style={{ color: 'var(--accent-cyan)' }}>
                                                        {team.session?.currentRound || '-'}
                                                    </td>
                                                    <td className="py-3 text-center font-bold" style={{ color: 'var(--accent-green)' }}>
                                                        {team.totalScore}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        {team.session?.expiresAt ? (
                                                            <span style={{ color: getRemainingTime(team.session.expiresAt) === 'EXPIRED' ? 'var(--danger)' : 'var(--accent-green)' }}>
                                                                {getRemainingTime(team.session.expiresAt)}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {teams.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
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
                                <h2 className="text-lg font-orbitron font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                    RECENT ACTIVITY
                                </h2>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {dashboardData?.recentActivity.map((activity, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded text-xs font-mono"
                                            style={{
                                                border: `1px solid ${activity.is_correct ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
                                                background: activity.is_correct ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,102,0.05)'
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span style={{ color: activity.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                                                    {activity.is_correct ? '✓' : '✗'} R{activity.round_number}E{activity.evidence_number}
                                                </span>
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(activity.attempted_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                                        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                            No activity yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terminal log */}
                    <div className="mt-6">
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
            )}

            {/* ==================== SCORE MONITOR TAB ==================== */}
            {activeTab === 'teams' && (
                <div>
                    <div className="card-cyber">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-orbitron font-bold" style={{ color: 'var(--text-primary)' }}>
                                INDIVIDUAL ROUND SCORES
                            </h2>
                            <span className="text-xs font-mono px-3 py-1 rounded-full" style={{ background: 'rgba(0,255,255,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,255,255,0.3)' }}>
                                Auto-refresh: 5s
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-mono">
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <th className="text-left py-3 px-2">TEAM</th>
                                        <th className="text-center py-3 px-2">STATUS</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#60a5fa' }}>R1 SCORE</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#60a5fa' }}>R1 DONE</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#a78bfa' }}>R2 SCORE</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#a78bfa' }}>R2 DONE</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#f472b6' }}>R3 SCORE</th>
                                        <th className="text-center py-3 px-2" style={{ color: '#f472b6' }}>R3 DONE</th>
                                        <th className="text-center py-3 px-2" style={{ color: 'var(--accent-green)' }}>TOTAL</th>
                                        <th className="text-center py-3 px-2">ATTEMPTS</th>
                                        <th className="text-center py-3 px-2">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr
                                            key={team.id}
                                            className="transition-colors cursor-pointer"
                                            style={{
                                                borderBottom: '1px solid rgba(48,54,61,0.5)',
                                                background: selectedTeam === team.id ? 'rgba(0,255,255,0.05)' : 'transparent'
                                            }}
                                            onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                                            onMouseEnter={(e) => { if (selectedTeam !== team.id) e.currentTarget.style.background = 'rgba(22,27,34,0.8)'; }}
                                            onMouseLeave={(e) => { if (selectedTeam !== team.id) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td className="py-3 px-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{team.team_name}</td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={`badge ${team.session?.status === 'completed' ? 'badge-complete' :
                                                    team.session?.status === 'active' ? 'badge-active' :
                                                        team.session?.status === 'paused' ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange' :
                                                            'badge-locked'
                                                    }`}>
                                                    {team.session?.status?.toUpperCase() || 'IDLE'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center font-bold" style={{ color: '#60a5fa' }}>
                                                {team.roundScores?.[0]?.points ?? 0}
                                            </td>
                                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {formatTimestamp(team.roundScores?.[0]?.completedAt)}
                                            </td>
                                            <td className="py-3 px-2 text-center font-bold" style={{ color: '#a78bfa' }}>
                                                {team.roundScores?.[1]?.points ?? 0}
                                            </td>
                                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {formatTimestamp(team.roundScores?.[1]?.completedAt)}
                                            </td>
                                            <td className="py-3 px-2 text-center font-bold" style={{ color: '#f472b6' }}>
                                                {team.roundScores?.[2]?.points ?? 0}
                                            </td>
                                            <td className="py-3 px-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {formatTimestamp(team.roundScores?.[2]?.completedAt)}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className="font-bold text-lg" style={{ color: 'var(--accent-green)', textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
                                                    {team.totalScore}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center" style={{ color: 'var(--text-muted)' }}>
                                                {team.attemptCount}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {[2, 3].map(round => (
                                                        <button
                                                            key={round}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUnlock(team.id, round);
                                                            }}
                                                            disabled={actionLoading || !team.session}
                                                            className="text-xs px-2 py-1 rounded transition-all disabled:opacity-30"
                                                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
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
                                            <td colSpan={11} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                                                No teams registered. Go to Team Manager to add teams.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Selected team details */}
                    {selectedTeam && (() => {
                        const team = teams.find(t => t.id === selectedTeam);
                        if (!team) return null;

                        return (
                            <div className="mt-6 card-cyber">
                                <h2 className="text-lg font-orbitron font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                    TEAM DETAILS — {team.team_name.toUpperCase()}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((r) => {
                                        const roundData = team.roundProgress?.find(p => p.round_number === r);
                                        const score = team.roundScores?.[r - 1];
                                        return (
                                            <div key={r} className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                                <div className="text-sm font-mono font-bold mb-3" style={{ color: r === 1 ? '#60a5fa' : r === 2 ? '#a78bfa' : '#f472b6' }}>
                                                    ROUND {r}
                                                </div>
                                                <div className="space-y-2 text-xs font-mono">
                                                    <div className="flex justify-between">
                                                        <span style={{ color: 'var(--text-muted)' }}>Points:</span>
                                                        <span className="font-bold" style={{ color: 'var(--accent-green)' }}>{score?.points ?? 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{ color: 'var(--text-muted)' }}>Completed:</span>
                                                        <span style={{ color: score?.completedAt ? 'var(--success)' : 'var(--text-muted)' }}>
                                                            {score?.completedAt ? '✓ YES' : '✗ NO'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{formatTimestamp(score?.completedAt ?? null)}</span>
                                                    </div>
                                                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Evidence:</div>
                                                        <div className="flex gap-1 mt-1">
                                                            {[1, 2, 3, 4].map(e => (
                                                                <div
                                                                    key={e}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-xs"
                                                                    style={{
                                                                        background: roundData?.[`evidence_${e}_complete` as keyof typeof roundData]
                                                                            ? 'rgba(0,255,136,0.2)'
                                                                            : 'rgba(48,54,61,0.5)',
                                                                        border: `1px solid ${roundData?.[`evidence_${e}_complete` as keyof typeof roundData]
                                                                            ? 'var(--success)'
                                                                            : 'var(--border-color)'}`,
                                                                        color: roundData?.[`evidence_${e}_complete` as keyof typeof roundData]
                                                                            ? 'var(--success)'
                                                                            : 'var(--text-muted)'
                                                                    }}
                                                                >
                                                                    E{e}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => team.session && handleTimerControl('pause', team.id)}
                                        disabled={actionLoading}
                                        className="btn-neon danger text-xs"
                                        style={{ padding: '6px 16px' }}
                                    >
                                        ⏸ PAUSE
                                    </button>
                                    <button
                                        onClick={() => team.session && handleTimerControl('resume', team.id)}
                                        disabled={actionLoading}
                                        className="btn-neon success text-xs"
                                        style={{ padding: '6px 16px' }}
                                    >
                                        ▶ RESUME
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ==================== LEADERBOARD TAB ==================== */}
            {activeTab === 'leaderboard' && (
                <div>
                    {/* Winner announcement hero */}
                    {leaderboard.length > 0 && leaderboard[0].totalScore > 0 && (
                        <div className="card-cyber text-center mb-6" style={{
                            border: '1px solid rgba(250,204,21,0.3)',
                            background: 'linear-gradient(135deg, rgba(250,204,21,0.03), rgba(13,17,23,0.9))',
                            boxShadow: '0 0 40px rgba(250,204,21,0.08)'
                        }}>
                            <div className="text-6xl mb-2">🏆</div>
                            <div className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '4px' }}>
                                CURRENT LEADER
                            </div>
                            <div className="text-3xl font-orbitron font-bold mb-1" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(250,204,21,0.4)' }}>
                                {leaderboard[0].teamName.toUpperCase()}
                            </div>
                            <div className="text-xl font-orbitron" style={{ color: 'var(--accent-green)' }}>
                                {leaderboard[0].totalScore} POINTS
                            </div>
                            {leaderboard[0].lastCompletedAt && (
                                <div className="text-xs font-mono mt-2" style={{ color: 'var(--text-muted)' }}>
                                    Last completed: {formatTimestamp(leaderboard[0].lastCompletedAt)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leaderboard table */}
                    <div className="space-y-3">
                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry.teamId}
                                className={`card-cyber p-4 transition-all border ${getRankClass(index)}`}
                            >
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="text-3xl min-w-[60px] text-center">
                                        {getRankMedal(index)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-orbitron font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                            {entry.teamName.toUpperCase()}
                                        </div>
                                        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                            {entry.status === 'not_started' ? 'Not started' :
                                                entry.status === 'completed' ? 'Game completed' :
                                                    `Round ${entry.currentRound} • ${entry.status}`}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="text-center">
                                            <div className="text-xs font-mono" style={{ color: '#60a5fa' }}>R1</div>
                                            <div className="font-bold" style={{ color: '#60a5fa' }}>{entry.roundScores[0].points}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-mono" style={{ color: '#a78bfa' }}>R2</div>
                                            <div className="font-bold" style={{ color: '#a78bfa' }}>{entry.roundScores[1].points}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-mono" style={{ color: '#f472b6' }}>R3</div>
                                            <div className="font-bold" style={{ color: '#f472b6' }}>{entry.roundScores[2].points}</div>
                                        </div>
                                        <div className="text-center px-3 py-1 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                                            <div className="text-xs font-mono" style={{ color: 'var(--accent-green)' }}>TOTAL</div>
                                            <div className="font-bold text-xl" style={{ color: 'var(--accent-green)', textShadow: '0 0 10px rgba(0,255,136,0.4)' }}>
                                                {entry.totalScore}
                                            </div>
                                        </div>
                                    </div>
                                    {entry.lastCompletedAt && (
                                        <div className="text-xs font-mono text-right min-w-[120px]" style={{ color: 'var(--text-muted)' }}>
                                            Last done:<br />{formatTimestamp(entry.lastCompletedAt)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {leaderboard.length === 0 && (
                            <div className="card-cyber text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                <div className="text-4xl mb-4">🏁</div>
                                <div className="font-mono">No teams to rank yet. Create teams to get started.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ==================== TEAM MANAGER TAB ==================== */}
            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create team form */}
                    <div className="card-cyber">
                        <h2 className="text-xl font-orbitron font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            ➕ CREATE NEW TEAM
                        </h2>
                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '2px' }}>
                                    TEAM NAME
                                </label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="input-cyber"
                                    placeholder="e.g. alpha, bravo, charlie"
                                    required
                                />
                                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                                    Will be stored as lowercase
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-mono mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '2px' }}>
                                    ACCESS CODE
                                </label>
                                <input
                                    type="text"
                                    value={newAccessCode}
                                    onChange={(e) => setNewAccessCode(e.target.value)}
                                    className="input-cyber"
                                    placeholder="e.g. mission2026"
                                    required
                                />
                                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                                    Teams will use this code to login
                                </p>
                            </div>

                            {createError && (
                                <div className="p-3 rounded text-sm font-mono" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                                    {createError}
                                </div>
                            )}
                            {createSuccess && (
                                <div className="p-3 rounded text-sm font-mono" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                                    {createSuccess}
                                </div>
                            )}

                            <button type="submit" disabled={actionLoading} className="btn-neon success w-full">
                                {actionLoading ? 'CREATING...' : 'CREATE TEAM'}
                            </button>
                        </form>
                    </div>

                    {/* Registered teams list */}
                    <div className="card-cyber">
                        <h2 className="text-xl font-orbitron font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            📋 REGISTERED TEAMS ({teams.length})
                        </h2>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="p-4 rounded-lg flex items-center justify-between transition-all"
                                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                                >
                                    <div>
                                        <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {team.team_name}
                                        </div>
                                        <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                                            Code: <span style={{ color: 'var(--accent-cyan)' }}>{team.access_code}</span>
                                        </div>
                                        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                            Created: {formatTimestamp(team.created_at)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTeam(team.id, team.team_name)}
                                        disabled={actionLoading}
                                        className="text-xs px-3 py-2 rounded font-mono transition-all disabled:opacity-30"
                                        style={{
                                            background: 'rgba(255,51,102,0.1)',
                                            border: '1px solid var(--danger)',
                                            color: 'var(--danger)'
                                        }}
                                    >
                                        🗑 DELETE
                                    </button>
                                </div>
                            ))}
                            {teams.length === 0 && (
                                <div className="text-center py-8 font-mono" style={{ color: 'var(--text-muted)' }}>
                                    No teams registered yet. Create one above.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
