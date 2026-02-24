import { Router, Response } from 'express';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current game progress
router.get('/progress', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        // Get session
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', req.sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        // Get round progress
        const { data: roundProgress, error: progressError } = await supabase
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .order('round_number');

        if (progressError) {
            throw progressError;
        }

        // Get attempt statistics (without revealing answers)
        const { data: attempts } = await supabase
            .from('attempts')
            .select('round_number, evidence_number, is_correct')
            .eq('session_id', req.sessionId);

        const attemptStats = attempts?.reduce((acc: any, attempt) => {
            const key = `r${attempt.round_number}e${attempt.evidence_number}`;
            if (!acc[key]) {
                acc[key] = { total: 0, correct: 0 };
            }
            acc[key].total++;
            if (attempt.is_correct) acc[key].correct++;
            return acc;
        }, {});

        res.json({
            session: {
                id: session.id,
                status: session.status,
                currentRound: session.current_round,
                startedAt: session.started_at,
                expiresAt: session.expires_at
            },
            rounds: roundProgress,
            attemptStats
        });
    } catch (error) {
        console.error('Progress fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch progress.' });
    }
});

// Get server-authoritative timer
router.get('/timer', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { data: session, error } = await supabase
            .from('game_sessions')
            .select('started_at, expires_at, status')
            .eq('id', req.sessionId)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());

        res.json({
            serverTime: now.toISOString(),
            expiresAt: session.expires_at,
            remainingMs,
            remainingSeconds: Math.floor(remainingMs / 1000),
            isPaused: session.status === 'paused',
            isExpired: remainingMs <= 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Timer fetch failed.' });
    }
});

// Start new game (only if no active session)
router.post('/start', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { data: existingSession } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('team_id', req.teamId)
            .eq('status', 'active')
            .single();

        if (existingSession) {
            return res.status(409).json({
                error: 'Active session exists.',
                sessionId: existingSession.id
            });
        }

        // Mark any old sessions as completed
        await supabase
            .from('game_sessions')
            .update({ status: 'completed' })
            .eq('team_id', req.teamId);

        res.json({ success: true, message: 'Ready to start new game. Re-login to begin.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start game.' });
    }
});

// Get case file briefing
router.get('/briefing', authenticateTeam, async (req: AuthRequest, res: Response) => {
    res.json({
        title: "ATTACK ON BLACKRIDGE AIRFIELD",
        classification: "WAR BRIEFING – CLASSIFIED",
        briefing: `
      Year: 1943. Eastern Front.

      For weeks, our division has studied an enemy-controlled airfield 
      believed to dominate the skies over this region. Destroying it 
      would shift the balance of the war.

      At 0300 hours, High Command approved a covert AirStrike.
      The strike coordinates, deployment timings, and confirmation 
      protocol were secured inside our underground command bunker.

      Yet at 04:17 hours, a silent alert was triggered.
      Internal data breach detected.
      Unauthorized signal activity logged.

      The traitor is inside the bunker.

      Investigators — your task is to reconstruct what happened 
      inside these walls… and identify the officer responsible.

      Time is critical. You have 60 minutes.
    `,
        objectives: [
            "Reconstruct the torn map fragment recovered from the furnace",
            "Map the bunker's internal progression route",
            "Decrypt the intercepted transmission",
            "Decode the binary authentication fragment",
            "Identify the traitor among the officers"
        ]
    });
});

export default router;
