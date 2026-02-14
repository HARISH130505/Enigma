import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers (from environment)
const CORRECT_ANSWERS = {
    key1: parseInt(process.env.R2_KEY1 || '7'), // Index of second timestamp in 120-second gap
    key2: process.env.R2_KEY2 || 'ROW-42', // Row ID for folder "COIN"
    key3: process.env.R2_KEY3 || 'COIN', // Riddle answer
    finalToken: process.env.R2_FINAL_TOKEN || '7-ROW-42-COIN', // Combined format
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

// Check if Round 2 is unlocked
async function checkRound2Access(sessionId: string): Promise<boolean> {
    const { data: session } = await supabase
        .from('game_sessions')
        .select('current_round')
        .eq('id', sessionId)
        .single();

    return (session?.current_round || 0) >= 2;
}

// Phase 1: The 120-Second Shadow (30 Points)
router.post('/phase/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { indicesSum, conversionComplete, sortingComplete, gapIdentified } = req.body;

        if (indicesSum === undefined) {
            return res.status(400).json({ error: 'Provide the sum of indices.' });
        }

        const isCorrectSum = parseInt(indicesSum) === CORRECT_ANSWERS.key1;

        // Scoring breakdown (30 points total)
        let pointsEarned = 0;
        if (conversionComplete) pointsEarned += 10; // AM/PM to 24-hour conversion
        if (sortingComplete) pointsEarned += 10; // Sorting algorithm
        if (isCorrectSum && gapIdentified) pointsEarned += 10; // Gap identification

        const isCorrect = isCorrectSum && conversionComplete && sortingComplete && gapIdentified;

        await logAttempt(req.sessionId!, 2, 1, { indicesSum, conversionComplete, sortingComplete, gapIdentified }, isCorrect);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        if (isCorrect) {
            await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);

            res.json({
                success: true,
                message: `KEY 1 UNLOCKED: The 120-second gap identified. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned
            });
        } else {
            const deduction = 5;
            const newPoints = Math.max(0, currentPoints - deduction);
            await supabase.from('round_progress').update({ points: newPoints } as any).eq('session_id', req.sessionId).eq('round_number', 2);

            res.json({
                success: false,
                message: `INCORRECT. Analyze the timestamps again. (-${deduction} Points)`,
                accessGranted: false,
                pointsDeducted: deduction
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Phase 2: Holy Trinity (35 Points)
router.post('/phase/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { rowId, vowelCheckComplete, lengthMathCheckComplete } = req.body;

        if (!rowId) {
            return res.status(400).json({ error: 'No row ID provided.' });
        }

        const isCorrectRow = rowId === CORRECT_ANSWERS.key2;

        // Scoring breakdown (35 points total)
        let pointsEarned = 0;
        if (vowelCheckComplete) pointsEarned += 10; // Vowel count logic (exactly 2 vowels: O, I)
        if (lengthMathCheckComplete) pointsEarned += 10; // Length (4 chars) and Math (multiple of 3) rules
        if (isCorrectRow) pointsEarned += 15; // Correct row ID for "COIN"

        const isComplete = isCorrectRow && vowelCheckComplete && lengthMathCheckComplete;

        await logAttempt(req.sessionId!, 2, 2, { rowId, vowelCheckComplete, lengthMathCheckComplete }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        if (isComplete) {
            await supabase
                .from('round_progress')
                .update({
                    evidence_2_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);

            res.json({
                success: true,
                message: `KEY 2 UNLOCKED: Row ID ${rowId} identified. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned
            });
        } else {
            const deduction = 5;
            const newPoints = Math.max(0, currentPoints - deduction);
            await supabase.from('round_progress').update({ points: newPoints } as any).eq('session_id', req.sessionId).eq('round_number', 2);

            res.json({
                success: false,
                message: `INCORRECT ROW ID. Re-apply the Holy Trinity rules. (-${deduction} Points)`,
                accessGranted: false,
                pointsDeducted: deduction
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Phase 3: The Hexa Vault (35 Points)
router.post('/phase/3', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { riddleAnswer, base64CleaningComplete, hexConversionComplete } = req.body;

        if (!riddleAnswer) {
            return res.status(400).json({ error: 'No riddle answer provided.' });
        }

        const isCorrectAnswer = riddleAnswer.toUpperCase().trim() === CORRECT_ANSWERS.key3.toUpperCase();

        // Scoring breakdown (35 points total)
        let pointsEarned = 0;
        if (base64CleaningComplete) pointsEarned += 10; // Base64 cleaning script
        if (hexConversionComplete) pointsEarned += 10; // Hex to ASCII conversion
        if (isCorrectAnswer) pointsEarned += 15; // Correct riddle answer

        const isComplete = isCorrectAnswer && base64CleaningComplete && hexConversionComplete;

        await logAttempt(req.sessionId!, 2, 3, { riddleAnswer, base64CleaningComplete, hexConversionComplete }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        if (isComplete) {
            await supabase
                .from('round_progress')
                .update({
                    evidence_3_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);

            res.json({
                success: true,
                message: `KEY 3 UNLOCKED: The Hexa Vault decrypted. Answer: ${riddleAnswer}. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned
            });
        } else {
            const deduction = 5;
            const newPoints = Math.max(0, currentPoints - deduction);
            await supabase.from('round_progress').update({ points: newPoints } as any).eq('session_id', req.sessionId).eq('round_number', 2);

            res.json({
                success: false,
                message: `INCORRECT ANSWER. Re-examine the decryption layers. (-${deduction} Points)`,
                accessGranted: false,
                pointsDeducted: deduction
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Final Challenge: Form the Audit Token (Proceeds to Round 3)
router.post('/complete', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { auditToken } = req.body;

        if (!auditToken) {
            return res.status(400).json({ error: 'No Audit Token provided.' });
        }

        const isCorrect = auditToken.toUpperCase().trim() === CORRECT_ANSWERS.finalToken.toUpperCase();

        if (!isCorrect) {
            return res.json({
                success: false,
                message: 'INVALID AUDIT TOKEN. Combine all three keys correctly (KEY1-KEY2-KEY3).',
                accessGranted: false
            });
        }

        // Mark round 2 complete
        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', req.sessionId)
            .eq('round_number', 2);

        // Unlock round 3 and RESET TIMER
        const newExpiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
        await supabase
            .from('game_sessions')
            .update({
                current_round: 3,
                expires_at: newExpiresAt
            })
            .eq('id', req.sessionId);

        res.json({
            success: true,
            message: 'ROUND 2 COMPLETE. The Mischief Triathlon conquered. Proceeding to Round 3.',
            roundComplete: true,
            nextRound: 3,
            expiresAt: newExpiresAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Audit Token validation failed.' });
    }
});

// Checkpoint route (called by frontend with { code } field)
router.post('/checkpoint', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'No checkpoint code provided.' });
        }

        const isCorrect = code.toUpperCase().trim() === CORRECT_ANSWERS.finalToken.toUpperCase();

        if (!isCorrect) {
            return res.json({
                success: false,
                message: 'INVALID TOKEN. Combine all three keys correctly (KEY1-KEY2-KEY3).',
                accessGranted: false
            });
        }

        // Mark round 2 complete
        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', req.sessionId)
            .eq('round_number', 2);

        // Unlock round 3 and RESET TIMER
        const newExpiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
        await supabase
            .from('game_sessions')
            .update({
                current_round: 3,
                expires_at: newExpiresAt
            })
            .eq('id', req.sessionId);

        res.json({
            success: true,
            message: 'ROUND 2 COMPLETE. Proceeding to The Hexa Vault.',
            roundComplete: true,
            nextRound: 3,
            expiresAt: newExpiresAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Checkpoint validation failed.' });
    }
});

// Get Round 2 status
router.get('/status', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { data: session } = await supabase
            .from('game_sessions')
            .select('current_round')
            .eq('id', req.sessionId)
            .single();

        if (session && session.current_round < 2) {
            return res.json({ locked: true, message: 'Complete Round 1 to unlock.' });
        }

        const { data: progress } = await supabase
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 2)
            .single();

        res.json({
            locked: false,
            phase1: progress?.evidence_1_complete || false,
            phase2: progress?.evidence_2_complete || false,
            phase3: progress?.evidence_3_complete || false,
            points: progress?.points || 0,
            checkpointUnlocked: !!(progress?.evidence_1_complete && progress?.evidence_2_complete && progress?.evidence_3_complete),
            completed: !!progress?.completed_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

export default router;
