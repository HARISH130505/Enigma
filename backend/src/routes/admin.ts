import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

        // Check against environment config (simple setup)
        // In production, query admin_users table
        const validUsername = username === process.env.ADMIN_USERNAME;

        // For demo, use simple password check
        // In production: bcrypt.compare(password, storedHash)
        const validPassword = password === 'enigma2026!';

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

// Get all teams with progress
router.get('/teams', authenticateAdmin, async (req: Request, res: Response) => {
    try {
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, team_name, created_at');

        if (teamsError) throw teamsError;

        // Get sessions for each team
        const teamsWithProgress = await Promise.all(teams.map(async (team) => {
            const { data: session } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('team_id', team.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let roundProgress = null;
            let attemptCount = 0;

            if (session) {
                const { data: progress } = await supabase
                    .from('round_progress')
                    .select('*')
                    .eq('session_id', session.id);

                const { count } = await supabase
                    .from('attempts')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', session.id);

                roundProgress = progress;
                attemptCount = count || 0;
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
                attemptCount
            };
        }));

        res.json({ teams: teamsWithProgress });
    } catch (error) {
        console.error('Teams fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch teams.' });
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

        // Get active session
        const { data: session } = await supabase
            .from('game_sessions')
            .select('id')
            .eq('team_id', teamId)
            .eq('status', 'active')
            .single();

        if (!session) {
            return res.status(404).json({ error: 'No active session for this team.' });
        }

        // Unlock the round
        await supabase
            .from('game_sessions')
            .update({ current_round: round })
            .eq('id', session.id);

        // If unlocking a round, mark previous rounds as complete
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
        const { action, teamId } = req.body; // 'pause' or 'resume'

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
                    total_attempts: 0,
                    correct_attempts: 0,
                    time_elapsed: 0
                };
            }

            const { data: attempts } = await supabase
                .from('attempts')
                .select('is_correct')
                .eq('session_id', session.id);

            const timeElapsed = session.status === 'completed'
                ? Math.floor((new Date(session.completed_at || session.expires_at).getTime() -
                    new Date(session.started_at).getTime()) / 1000)
                : Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

            return {
                team_name: team.team_name,
                status: session.status,
                current_round: session.current_round,
                total_attempts: attempts?.length || 0,
                correct_attempts: attempts?.filter(a => a.is_correct).length || 0,
                time_elapsed: timeElapsed
            };
        }));

        // Generate CSV
        const headers = ['Team Name', 'Status', 'Current Round', 'Total Attempts', 'Correct Attempts', 'Time Elapsed (s)'];
        const rows = results.map(r => [
            r.team_name,
            r.status,
            r.current_round,
            r.total_attempts,
            r.correct_attempts,
            r.time_elapsed
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
