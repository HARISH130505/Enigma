import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Admin login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Credentials required.' });
        }

        const validUsername = username === process.env.ADMIN_USERNAME;
        const validPassword = password === process.env.ADMIN_PASSWORD;

        if (!validUsername || !validPassword) {
            return res.status(401).json({ error: 'Invalid admin credentials.' });
        }

        const token = jwt.sign(
            { isAdmin: true, username },
            process.env.JWT_SECRET!,
            { expiresIn: '4h' } as jwt.SignOptions
        );

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ error: 'Admin login failed.' });
    }
});

// Create a new team (admin registers teams with name + access code)
router.post('/teams/create', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { teamName, accessCode } = req.body;

        if (!teamName || !accessCode) {
            return res.status(400).json({ error: 'Team name and access code are required.' });
        }

        // Check if team already exists
        const { data: existing } = await supabase
            .from('teams')
            .select('id')
            .eq('team_name', teamName.toLowerCase())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Team name already exists.' });
        }

        const teamId = uuidv4();
        const { error } = await supabase
            .from('teams')
            .insert({
                id: teamId,
                team_name: teamName.toLowerCase(),
                access_code: accessCode
            });

        if (error) throw error;

        res.status(201).json({
            success: true,
            team: { id: teamId, name: teamName.toLowerCase(), accessCode }
        });
    } catch (error) {
        console.error('Team creation error:', error);
        res.status(500).json({ error: 'Failed to create team.' });
    }
});

// Delete a team
router.delete('/teams/:teamId', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { teamId } = req.params;

        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;

        res.json({ success: true, message: 'Team deleted.' });
    } catch (error) {
        console.error('Team deletion error:', error);
        res.status(500).json({ error: 'Failed to delete team.' });
    }
});

// Get all teams with progress, scores, and timestamps
router.get('/teams', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, team_name, access_code, created_at');

        if (teamsError) throw teamsError;

        const teamsWithProgress = await Promise.all((teams || []).map(async (team) => {
            const { data: session } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('team_id', team.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let roundProgress = null;
            let attemptCount = 0;
            let roundScores: Array<{ round: number; points: number; completedAt: string | null }> = [];
            let totalScore = 0;
            let lastCompletedAt: string | null = null;

            if (session) {
                const { data: progress } = await supabase
                    .from('round_progress')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('round_number');

                const { count } = await supabase
                    .from('attempts')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', session.id);

                roundProgress = progress;
                attemptCount = count || 0;

                // Build per-round scores
                for (let r = 1; r <= 3; r++) {
                    const rp = progress?.find((p: any) => p.round_number === r);
                    const pts = rp?.points || 0;
                    const completedAt = rp?.completed_at || null;
                    roundScores.push({ round: r, points: pts, completedAt });
                    totalScore += pts;
                    if (completedAt && (!lastCompletedAt || completedAt > lastCompletedAt)) {
                        lastCompletedAt = completedAt;
                    }
                }
            }

            return {
                ...team,
                session: session ? {
                    id: session.id,
                    status: session.status,
                    currentRound: session.current_round,
                    startedAt: session.started_at,
                    expiresAt: session.expires_at
                } : null,
                roundProgress,
                roundScores,
                totalScore,
                lastCompletedAt,
                attemptCount
            };
        }));

        res.json({ teams: teamsWithProgress });
    } catch (error) {
        console.error('Teams fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch teams.' });
    }
});

// Get leaderboard data (sorted by total score desc, then earliest completion asc)
router.get('/leaderboard', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, team_name');

        if (teamsError) throw teamsError;

        const leaderboard = await Promise.all((teams || []).map(async (team) => {
            const { data: session } = await supabase
                .from('game_sessions')
                .select('id, status, current_round, started_at, completed_at')
                .eq('team_id', team.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!session) {
                return {
                    teamId: team.id,
                    teamName: team.team_name,
                    totalScore: 0,
                    roundScores: [
                        { round: 1, points: 0, completedAt: null },
                        { round: 2, points: 0, completedAt: null },
                        { round: 3, points: 0, completedAt: null },
                    ],
                    lastCompletedAt: null,
                    status: 'not_started',
                    currentRound: 0,
                    startedAt: null
                };
            }

            const { data: progress } = await supabase
                .from('round_progress')
                .select('round_number, points, completed_at')
                .eq('session_id', session.id)
                .order('round_number');

            let totalScore = 0;
            let lastCompletedAt: string | null = null;
            const roundScores = [1, 2, 3].map(r => {
                const rp = progress?.find((p: any) => p.round_number === r);
                const pts = rp?.points || 0;
                const completedAt = rp?.completed_at || null;
                totalScore += pts;
                if (completedAt && (!lastCompletedAt || completedAt > lastCompletedAt)) {
                    lastCompletedAt = completedAt;
                }
                return { round: r, points: pts, completedAt };
            });

            return {
                teamId: team.id,
                teamName: team.team_name,
                totalScore,
                roundScores,
                lastCompletedAt,
                status: session.status,
                currentRound: session.current_round,
                startedAt: session.started_at
            };
        }));

        // Sort: highest score first, then earliest last completion
        leaderboard.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            // For same score, earlier completion wins
            if (a.lastCompletedAt && b.lastCompletedAt) {
                return new Date(a.lastCompletedAt).getTime() - new Date(b.lastCompletedAt).getTime();
            }
            if (a.lastCompletedAt) return -1;
            if (b.lastCompletedAt) return 1;
            return 0;
        });

        res.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard.' });
    }
});

// Manual unlock for a team
router.post('/team/:teamId/unlock', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { teamId } = req.params;
        const { round } = req.body;

        if (!round || round < 1 || round > 3) {
            return res.status(400).json({ error: 'Invalid round number.' });
        }

        const { data: session } = await supabase
            .from('game_sessions')
            .select('id')
            .eq('team_id', teamId)
            .eq('status', 'active')
            .single();

        if (!session) {
            return res.status(404).json({ error: 'No active session for this team.' });
        }

        await supabase
            .from('game_sessions')
            .update({ current_round: round })
            .eq('id', session.id);

        for (let r = 1; r < round; r++) {
            await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    evidence_2_complete: true,
                    evidence_3_complete: true,
                    evidence_4_complete: true,
                    escape_code_unlocked: true,
                    completed_at: new Date().toISOString()
                })
                .eq('session_id', session.id)
                .eq('round_number', r);
        }

        res.json({ success: true, message: `Unlocked Round ${round} for team.` });
    } catch (error) {
        res.status(500).json({ error: 'Unlock failed.' });
    }
});

// Global timer control
router.post('/timer', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { action, teamId } = req.body;

        if (!['pause', 'resume'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Use pause or resume.' });
        }

        const query = supabase
            .from('game_sessions')
            .update({ status: action === 'pause' ? 'paused' : 'active' });

        if (teamId) {
            query.eq('team_id', teamId);
        } else {
            query.eq('status', action === 'pause' ? 'active' : 'paused');
        }

        await query;

        res.json({
            success: true,
            message: teamId
                ? `Timer ${action}d for team.`
                : `Global timer ${action}d.`
        });
    } catch (error) {
        res.status(500).json({ error: 'Timer control failed.' });
    }
});

// Export results as CSV
router.get('/export', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { data: teams } = await supabase
            .from('teams')
            .select('id, team_name');

        const results = await Promise.all((teams || []).map(async (team) => {
            const { data: session } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('team_id', team.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!session) {
                return {
                    team_name: team.team_name,
                    status: 'not_started',
                    current_round: 0,
                    r1_score: 0, r2_score: 0, r3_score: 0,
                    total_score: 0,
                    total_attempts: 0,
                    correct_attempts: 0,
                    time_elapsed: 0
                };
            }

            const { data: progress } = await supabase
                .from('round_progress')
                .select('round_number, points')
                .eq('session_id', session.id);

            const { data: attempts } = await supabase
                .from('attempts')
                .select('is_correct')
                .eq('session_id', session.id);

            const r1 = progress?.find((p: any) => p.round_number === 1)?.points || 0;
            const r2 = progress?.find((p: any) => p.round_number === 2)?.points || 0;
            const r3 = progress?.find((p: any) => p.round_number === 3)?.points || 0;

            const timeElapsed = session.status === 'completed'
                ? Math.floor((new Date(session.completed_at || session.expires_at).getTime() -
                    new Date(session.started_at).getTime()) / 1000)
                : Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

            return {
                team_name: team.team_name,
                status: session.status,
                current_round: session.current_round,
                r1_score: r1, r2_score: r2, r3_score: r3,
                total_score: r1 + r2 + r3,
                total_attempts: attempts?.length || 0,
                correct_attempts: attempts?.filter(a => a.is_correct).length || 0,
                time_elapsed: timeElapsed
            };
        }));

        const headers = ['Team Name', 'Status', 'Current Round', 'R1 Score', 'R2 Score', 'R3 Score', 'Total Score', 'Total Attempts', 'Correct Attempts', 'Time Elapsed (s)'];
        const rows = results.map(r => [
            r.team_name, r.status, r.current_round,
            r.r1_score, r.r2_score, r.r3_score, r.total_score,
            r.total_attempts, r.correct_attempts, r.time_elapsed
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=mission-enigma-results.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Export failed.' });
    }
});

// Get live dashboard data
router.get('/dashboard', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { count: totalTeams } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });

        const { count: activeSessions } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: completedSessions } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { data: recentAttempts } = await supabase
            .from('attempts')
            .select('*')
            .order('attempted_at', { ascending: false })
            .limit(20);

        res.json({
            stats: {
                totalTeams: totalTeams || 0,
                activeSessions: activeSessions || 0,
                completedSessions: completedSessions || 0
            },
            recentActivity: recentAttempts || []
        });
    } catch (error) {
        res.status(500).json({ error: 'Dashboard data fetch failed.' });
    }
});

export default router;
