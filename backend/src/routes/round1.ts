import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// ──────────────────────────────────────────────────────────
// Round 1 – Attack on BlackRidge Airfield
// ──────────────────────────────────────────────────────────

// Correct answers
const CORRECT_ANSWERS = {
    // Level 1: Map puzzle
    airfield: 'BLACKRIDGE AIRFIELD',
    // Level 2: Bunker sequence (drag-and-drop ordering)
    bunkerSequence: ['barracks', 'armory', 'control-room', 'radar-unit', 'signal-room', 'war-archive', 'escape-tunnel'],
    // Level 3: Caesar cipher decryption (shift-3)
    cipherAnswer: 'bombing has been planned on black ridge airfield',
    // Level 4: Binary decoding
    binaryAnswer: '7359',
    // Level 5 Q1: Regiment identification (MCQ)
    regiment: 'communication field',
    // Level 5 Q2: Traitor's ID
    traitorId: 'CF-8735962',
};

// Points constants
const POINTS = {
    CORRECT: 25,
    WRONG_PENALTY: 10,
    HINT_PENALTY: 15,
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

// Helper to award points
async function awardPoints(sessionId: string, pointsToAdd: number) {
    const { data: currentProgress } = await supabase
        .from('round_progress')
        .select('points')
        .eq('session_id', sessionId)
        .eq('round_number', 1)
        .single();
    const newPoints = (currentProgress?.points || 0) + pointsToAdd;
    await supabase
        .from('round_progress')
        .update({ points: newPoints })
        .eq('session_id', sessionId)
        .eq('round_number', 1);
    return newPoints;
}

// Helper to deduct points
async function deductPoints(sessionId: string, pointsToDeduct: number) {
    const { data: currentProgress } = await supabase
        .from('round_progress')
        .select('points')
        .eq('session_id', sessionId)
        .eq('round_number', 1)
        .single();
    const newPoints = Math.max(0, (currentProgress?.points || 0) - pointsToDeduct);
    await supabase
        .from('round_progress')
        .update({ points: newPoints })
        .eq('session_id', sessionId)
        .eq('round_number', 1);
    return newPoints;
}

// ──────────────────── Level 1: Jigsaw Puzzle ────────────────────
router.post('/evidence/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { answer } = req.body;
        console.log(`[Level 1] Session ${req.sessionId} submitted answer: ${answer}`);

        if (!answer || typeof answer !== 'string') {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.trim().toUpperCase() === CORRECT_ANSWERS.airfield;

        await logAttempt(req.sessionId!, 1, 1, { answer }, isCorrect);

        if (isCorrect) {
            await supabase
                .from('round_progress')
                .update({ evidence_1_complete: true } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            const newPoints = await awardPoints(req.sessionId!, POINTS.CORRECT);

            res.json({
                success: true,
                message: 'MAP FRAGMENT RECONSTRUCTED. Strike coordinates recovered. (+25 Points)',
                accessGranted: true,
                pointsEarned: POINTS.CORRECT,
                totalPoints: newPoints,
            });
        } else {
            const newPoints = await deductPoints(req.sessionId!, POINTS.WRONG_PENALTY);
            res.json({
                success: false,
                message: 'INCORRECT LOCATION. The identified target does not match tactical projections. (-10 Points)',
                accessGranted: false,
                pointsDeducted: POINTS.WRONG_PENALTY,
                totalPoints: newPoints,
            });
        }
    } catch (error) {
        console.error('Level 1 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ──────────────────── Level 2: Bunker Sequence ────────────────────
router.post('/evidence/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { order } = req.body; // Array of strings
        console.log(`[Level 2] Session ${req.sessionId} submitted order:`, order);

        if (!Array.isArray(order) || order.length !== 7) {
            return res.status(400).json({ error: 'Invalid submission format. Expected 7 items.' });
        }

        const isCorrect = JSON.stringify(order) === JSON.stringify(CORRECT_ANSWERS.bunkerSequence);
        console.log(`[Level 2] Correct: ${isCorrect}`);

        await logAttempt(req.sessionId!, 1, 2, { order }, isCorrect);

        if (isCorrect) {
            await supabase
                .from('round_progress')
                .update({ evidence_2_complete: true } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            const newPoints = await awardPoints(req.sessionId!, POINTS.CORRECT);

            res.json({
                success: true,
                message: 'BUNKER ROUTE CONFIRMED. Internal progression verified. (+25 Points)',
                accessGranted: true,
                pointsEarned: POINTS.CORRECT,
                totalPoints: newPoints,
            });
        } else {
            const newPoints = await deductPoints(req.sessionId!, POINTS.WRONG_PENALTY);
            res.json({
                success: false,
                message: 'SEQUENCE MISMATCH. The bunker route does not follow standard progression. (-10 Points)',
                accessGranted: false,
                pointsDeducted: POINTS.WRONG_PENALTY,
                totalPoints: newPoints,
            });
        }
    } catch (error) {
        console.error('Level 2 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ──────────────────── Level 3: Caesar Cipher Decryption ────────────────────
router.post('/evidence/3', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { answer } = req.body;

        if (!answer || typeof answer !== 'string') {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.trim().toLowerCase() === CORRECT_ANSWERS.cipherAnswer;

        await logAttempt(req.sessionId!, 1, 3, { answer }, isCorrect);

        if (isCorrect) {
            await supabase
                .from('round_progress')
                .update({ evidence_3_complete: true } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            const newPoints = await awardPoints(req.sessionId!, POINTS.CORRECT);

            res.json({
                success: true,
                message: 'TRANSMISSION DECRYPTED. Contents of the leaked message confirmed. (+25 Points)',
                accessGranted: true,
                pointsEarned: POINTS.CORRECT,
                totalPoints: newPoints,
            });
        } else {
            const newPoints = await deductPoints(req.sessionId!, POINTS.WRONG_PENALTY);
            res.json({
                success: false,
                message: 'DECRYPTION FAILED. The decoded message does not match expected format. (-10 Points)',
                accessGranted: false,
                pointsDeducted: POINTS.WRONG_PENALTY,
                totalPoints: newPoints,
            });
        }
    } catch (error) {
        console.error('Level 3 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ──────────────────── Level 4: Binary Decoding ────────────────────
router.post('/evidence/4', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { answer } = req.body;
        console.log(`[Level 4] Session ${req.sessionId} submitted:`, answer);

        if (!answer || typeof answer !== 'string') {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.trim() === CORRECT_ANSWERS.binaryAnswer;
        console.log(`[Level 4] Correct: ${isCorrect}`);

        await logAttempt(req.sessionId!, 1, 4, { answer }, isCorrect);

        if (isCorrect) {
            await supabase
                .from('round_progress')
                .update({ evidence_4_complete: true } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            const newPoints = await awardPoints(req.sessionId!, POINTS.CORRECT);

            res.json({
                success: true,
                message: 'BINARY FRAGMENT DECODED. Authentication code fragment recovered. (+25 Points)',
                accessGranted: true,
                pointsEarned: POINTS.CORRECT,
                totalPoints: newPoints,
            });
        } else {
            const newPoints = await deductPoints(req.sessionId!, POINTS.WRONG_PENALTY);
            res.json({
                success: false,
                message: 'DECODE ERROR. The binary imprint does not resolve to a valid code. (-10 Points)',
                accessGranted: false,
                pointsDeducted: POINTS.WRONG_PENALTY,
                totalPoints: newPoints,
            });
        }
    } catch (error) {
        console.error('Level 4 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ──────────────────── Level 5: Traitor Identification (Two-Part) ────────────────────
router.post('/evidence/5', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { regiment, traitorId } = req.body;
        console.log(`[Level 5] Session ${req.sessionId} submitted regiment: "${regiment}", traitorId: "${traitorId}"`);

        if (!regiment || !traitorId) {
            return res.status(400).json({ error: 'Both regiment and traitor ID are required.' });
        }

        const regimentCorrect = regiment.trim().toLowerCase() === CORRECT_ANSWERS.regiment;
        const idCorrect = traitorId.trim().toUpperCase() === CORRECT_ANSWERS.traitorId;
        const isCorrect = regimentCorrect && idCorrect;

        await logAttempt(req.sessionId!, 1, 5, { regiment, traitorId }, isCorrect);

        if (isCorrect) {
            // Mark evidence 5 complete
            await supabase
                .from('round_progress')
                .update({
                    evidence_5_complete: true,
                    completed_at: new Date().toISOString(),
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);

            const newPoints = await awardPoints(req.sessionId!, POINTS.CORRECT);

            res.json({
                success: true,
                message: 'TRAITOR IDENTIFIED. Investigation complete. Round 1 cleared. (+25 Points)',
                accessGranted: true,
                roundComplete: true,
                pointsEarned: POINTS.CORRECT,
                totalPoints: newPoints,
            });
        } else {
            const newPoints = await deductPoints(req.sessionId!, POINTS.WRONG_PENALTY);

            let feedback = '';
            if (!regimentCorrect && !idCorrect) {
                feedback = 'IDENTIFICATION FAILED. Both the regiment and ID are incorrect. An innocent officer may pay the price. (-10 Points)';
            } else if (!regimentCorrect) {
                feedback = 'REGIMENT MISMATCH. The identified regiment does not match the evidence. (-10 Points)';
            } else {
                feedback = 'ID MISMATCH. The traitor ID does not match any officer in the identified regiment. (-10 Points)';
            }

            res.json({
                success: false,
                message: feedback,
                accessGranted: false,
                pointsDeducted: POINTS.WRONG_PENALTY,
                totalPoints: newPoints,
            });
        }
    } catch (error) {
        console.error('Level 5 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ──────────────────── Hint Request ────────────────────
router.post('/hint/:level', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const level = parseInt(req.params.level);
        if (isNaN(level) || level < 1 || level > 5) {
            return res.status(400).json({ error: 'Invalid level.' });
        }

        const newPoints = await deductPoints(req.sessionId!, POINTS.HINT_PENALTY);

        const hints: Record<number, string> = {
            1: 'Arrange the puzzle to find the Red circle.',
            2: 'An officer enters through the Entry Gate first. Equipment is checked before operations. Surveillance before signals. The exit is always last.',
            3: 'This is a simple letter-shift cipher. Try shifting each letter back by 3 positions in the alphabet. A becomes X, B becomes Y, etc.',
            4: 'Convert the binary string to decimal. Split the binary sequence into meaningful groups.',
            5: 'Think about who had access to the Signal Chamber. The information was shared with specific groups – which group includes communication capabilities?',
        };

        await logAttempt(req.sessionId!, 1, level, { hintRequested: true }, false);

        res.json({
            success: true,
            hint: hints[level],
            pointsDeducted: POINTS.HINT_PENALTY,
            totalPoints: newPoints,
            message: `Hint revealed. (-${POINTS.HINT_PENALTY} Points)`,
        });
    } catch (error) {
        console.error('Hint error:', error);
        res.status(500).json({ error: 'Failed to retrieve hint.' });
    }
});

// ──────────────────── Get Round 1 Status ────────────────────
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
            evidence5: progress?.evidence_5_complete || false,
            points: progress?.points || 0,
            completed: !!progress?.completed_at,
        };

        console.log(`[Status] Sending response:`, statusResponse);

        res.json(statusResponse);
    } catch (error) {
        console.error('[Status] Error:', error);
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

export default router;
