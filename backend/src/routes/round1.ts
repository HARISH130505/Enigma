import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers (from environment)
const CORRECT_ANSWERS = {
    systemFlow: (process.env.R1_SYSTEM_FLOW_ORDER || 'biometric,cctv,server,db,monitoring').split(','),
    failurePoint: process.env.R1_FAILURE_POINT || 'server',
    corruptedCause: process.env.R1_CORRUPTED_CAUSE || 'datetime',
    rootCause: process.env.R1_ROOT_CAUSE || 'manual-mode',
    escapeCode: process.env.R1_ESCAPE_CODE || 'CDM'
};

// Helper to log attempt
async function logAttempt(sessionId: string, roundNumber: number, evidenceNumber: number, attemptData: any, isCorrect: boolean) {
    await supabase.from('attempts').insert({
        id: uuidv4(),
        session_id: sessionId,
        round_number: roundNumber,
        evidence_number: evidenceNumber,
        attempt_data: attemptData,
        is_correct: isCorrect,
        attempted_at: new Date().toISOString()
    });
}

// Evidence 1: System Flow (drag-and-drop ordering)
router.post('/evidence/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { order } = req.body; // Array of strings
        console.log(`[Evidence 1] Session ${req.sessionId} submitted order:`, order);

        if (!Array.isArray(order) || order.length !== 5) {
            return res.status(400).json({ error: 'Invalid submission format.' });
        }

        const isCorrect = JSON.stringify(order) === JSON.stringify(CORRECT_ANSWERS.systemFlow);
        console.log(`[Evidence 1] Correct: ${isCorrect}`);

        await logAttempt(req.sessionId!, 1, 1, { order }, isCorrect);

        if (isCorrect) {
            // Get current points
            const { data: currentProgress } = await supabase
                .from('round_progress')
                .select('points')
                .eq('session_id', req.sessionId)
                .eq('round_number', 1)
                .single();

            const newPoints = (currentProgress?.points || 0) + 20;

            // Update evidence completion and points in single query
            const updateResult = await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    points: newPoints
                })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            console.log(`[Evidence 1] Database update result:`, updateResult);
            console.log(`[Evidence 1] Updated database - evidence_1_complete: true, points: ${newPoints}`);

            res.json({
                success: true,
                message: 'SYSTEM FLOW VERIFIED. Operational sequence confirmed. (+20 Points)',
                accessGranted: true,
                pointsEarned: 20
            });
        } else {
            res.json({
                success: false,
                message: 'FLOW MISMATCH. Re-analyze component sequence. (No penalty for Level 1)',
                accessGranted: false
            });
        }
    } catch (error) {
        console.error('Evidence 1 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Evidence 2: Failure Point (selection)
router.post('/evidence/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { selectedNode } = req.body;

        if (!selectedNode) {
            return res.status(400).json({ error: 'No node selected.' });
        }

        const isCorrect = selectedNode === CORRECT_ANSWERS.failurePoint;

        await logAttempt(req.sessionId!, 1, 2, { selectedNode }, isCorrect);

        if (isCorrect) {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = (currentProgress?.points || 0) + 30;

            const updateResult = await supabase
                .from('round_progress')
                .update({
                    evidence_2_complete: true,
                    points: newPoints
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            console.log(`[Evidence 2] Database update result:`, updateResult);
            console.log(`[Evidence 2] Updated - evidence_2_complete: true, points: ${newPoints}`);

            res.json({
                success: true,
                message: 'FAILURE POINT CONFIRMED. Control Server identified. (+30 Points)',
                accessGranted: true,
                pointsEarned: 30
            });
        } else {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = Math.max(0, (currentProgress?.points || 0) - 10);
            await supabase.from('round_progress').update({ points: newPoints }).eq('session_id', req.sessionId).eq('round_number', 1);

            res.json({
                success: false,
                message: 'INCORRECT LOCATION. Analysis does not match incident data. (-10 Points)',
                accessGranted: false,
                pointsDeducted: 10
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Evidence 3: Corrupted Evidence (Reason Multiple Choice)
router.post('/evidence/3', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'No reason provided.' });
        }

        const isCorrect = reason === CORRECT_ANSWERS.corruptedCause;

        await logAttempt(req.sessionId!, 1, 3, { reason }, isCorrect);

        if (isCorrect) {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = (currentProgress?.points || 0) + 30;

            const updateResult = await supabase
                .from('round_progress')
                .update({
                    evidence_3_complete: true,
                    points: newPoints
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            console.log(`[Evidence 3] Database update result:`, updateResult);
            console.log(`[Evidence 3] Updated - evidence_3_complete: true, points: ${newPoints}`);

            res.json({
                success: true,
                message: 'CORRUPTION SOURCE IDENTIFIED. Timestamps realigned. (+30 Points)',
                accessGranted: true,
                pointsEarned: 30
            });
        } else {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = Math.max(0, (currentProgress?.points || 0) - 10);
            await supabase.from('round_progress').update({ points: newPoints }).eq('session_id', req.sessionId).eq('round_number', 1);

            res.json({
                success: false,
                message: 'INCORRECT ANALYSIS. That does not explain the logs. (-10 Points)',
                accessGranted: false,
                pointsDeducted: 10
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Evidence 4: Root Cause (Human Error)
router.post('/evidence/4', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { choice } = req.body;
        console.log(`[Evidence 4] Session ${req.sessionId} submitted choice:`, choice);

        if (!choice) {
            return res.status(400).json({ error: 'Invalid choice.' });
        }

        const isCorrect = choice === CORRECT_ANSWERS.rootCause;
        console.log(`[Evidence 4] Correct: ${isCorrect}, Expected: ${CORRECT_ANSWERS.rootCause}`);

        await logAttempt(req.sessionId!, 1, 4, { choice }, isCorrect);

        if (isCorrect) {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = (currentProgress?.points || 0) + 30;

            const updateResult = await supabase
                .from('round_progress')
                .update({
                    evidence_4_complete: true,
                    points: newPoints
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            console.log(`[Evidence 4] Database update result:`, updateResult);
            console.log(`[Evidence 4] Updated - evidence_4_complete: true, points: ${newPoints}`);

            // Check if escape code should be unlocked
            const { data: progress } = await supabase
                .from('round_progress')
                .select('*')
                .eq('session_id', req.sessionId)
                .eq('round_number', 1)
                .single();

            console.log(`[Evidence 4] Current progress after update:`, progress);

            const escapeUnlocked = progress?.evidence_2_complete &&
                progress?.evidence_3_complete &&
                progress?.evidence_4_complete;

            console.log(`[Evidence 4] Escape unlock check - E2: ${progress?.evidence_2_complete}, E3: ${progress?.evidence_3_complete}, E4: ${progress?.evidence_4_complete}, Unlocked: ${escapeUnlocked}`);

            if (escapeUnlocked) {
                await supabase
                    .from('round_progress')
                    .update({ escape_code_unlocked: true })
                    .eq('session_id', req.sessionId)
                    .eq('round_number', 1);
                console.log(`[Evidence 4] Escape code unlocked`);
            }

            res.json({
                success: true,
                message: 'ROOT CAUSE CONFIRMED. The truth emerges. (+30 Points)',
                accessGranted: true,
                escapeCodeUnlocked: escapeUnlocked,
                pointsEarned: 30
            });
        } else {
            const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 1).single();
            const newPoints = Math.max(0, (currentProgress?.points || 0) - 10);
            await supabase.from('round_progress').update({ points: newPoints }).eq('session_id', req.sessionId).eq('round_number', 1);

            res.json({
                success: false,
                message: 'ANALYSIS INCONCLUSIVE. Re-examine the evidence. (-10 Points)',
                accessGranted: false,
                pointsDeducted: 10
            });
        }
    } catch (error) {
        console.error('Evidence 4 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Escape Code validation
router.post('/escape-code', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.body;

        // Check if escape code is unlocked
        const { data: progress } = await supabase
            .from('round_progress')
            .select('escape_code_unlocked')
            .eq('session_id', req.sessionId)
            .eq('round_number', 1)
            .single();

        if (!progress?.escape_code_unlocked) {
            return res.status(403).json({
                error: 'ESCAPE CODE LOCKED. Complete required evidence first.'
            });
        }

        const isCorrect = code?.toUpperCase() === CORRECT_ANSWERS.escapeCode;

        await logAttempt(req.sessionId!, 1, 5, { code }, isCorrect);

        if (isCorrect) {
            // Mark round 1 complete
            await supabase
                .from('round_progress')
                .update({ completed_at: new Date().toISOString() })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            // Unlock round 2 and reset timer to 60 minutes
            const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            await supabase
                .from('game_sessions')
                .update({ current_round: 2, expires_at: newExpiresAt })
                .eq('id', req.sessionId);

            res.json({
                success: true,
                message: 'ESCAPE CODE ACCEPTED. Round 1 Complete. Proceeding to Data Leak Investigation.',
                roundComplete: true,
                nextRound: 2
            });
        } else {
            res.json({
                success: false,
                message: 'INVALID ESCAPE CODE. Access denied.',
                roundComplete: false
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Get Round 1 status
router.get('/status', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        console.log(`[Status] Fetching status for session ${req.sessionId}`);
        const { data: progress, error } = await supabase
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 1)
            .single();

        if (error) {
            console.error(`[Status] Database error:`, error);
        }

        console.log(`[Status] Raw progress data:`, progress);

        const statusResponse = {
            evidence1: progress?.evidence_1_complete || false,
            evidence2: progress?.evidence_2_complete || false,
            evidence3: progress?.evidence_3_complete || false,
            evidence4: progress?.evidence_4_complete || false,
            escapeCodeUnlocked: progress?.escape_code_unlocked || false,
            points: progress?.points || 0,
            completed: !!progress?.completed_at
        };

        console.log(`[Status] Sending response:`, statusResponse);

        res.json(statusResponse);
    } catch (error) {
        console.error('[Status] Error:', error);
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

export default router;
