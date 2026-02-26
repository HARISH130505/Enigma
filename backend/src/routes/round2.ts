import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers
const CORRECT_ANSWERS = {
    key2: process.env.R2_KEY2 || '428',             // Row ID (IOU)
    key3: process.env.R2_KEY3 || 'CIPHER',            // Riddle answer
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

// Helper: check if both levels are done and mark round as complete
async function checkRoundComplete(sessionId: string) {
    const { data: progress } = await supabase
        .from('round_progress')
        .select('evidence_1_complete, evidence_2_complete')
        .eq('session_id', sessionId)
        .eq('round_number', 2)
        .single();

    if (progress?.evidence_1_complete && progress?.evidence_2_complete) {
        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('round_number', 2);

        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Level 1: Holy Trinity — System Map (50 Rows)
// ═══════════════════════════════════════════════════════════════

const SYSTEM_MAP = [
    { rowId: 101, folder: 'AIP', size: 21 },
    { rowId: 102, folder: 'DOG', size: 25 },
    { rowId: 103, folder: 'SUN', size: 12 },
    { rowId: 104, folder: 'NET', size: 18 },
    { rowId: 105, folder: 'ARC', size: 30 },
    { rowId: 106, folder: 'SYS', size: 14 },
    { rowId: 107, folder: 'APP', size: 17 },
    { rowId: 108, folder: 'TMP', size: 9 },
    { rowId: 109, folder: 'DEV', size: 20 },
    { rowId: 110, folder: 'LOG', size: 11 },
    { rowId: 111, folder: 'RAW', size: 16 },
    { rowId: 112, folder: 'BIN', size: 22 },
    { rowId: 113, folder: 'SEC', size: 19 },
    { rowId: 114, folder: 'API', size: 28 },
    { rowId: 115, folder: 'CPU', size: 33 },
    { rowId: 116, folder: 'RAM', size: 27 },
    { rowId: 117, folder: 'DBX', size: 40 },
    { rowId: 118, folder: 'XYZ', size: 24 },
    { rowId: 119, folder: 'EON', size: 26 },
    { rowId: 120, folder: 'OIL', size: 32 },
    { rowId: 121, folder: 'ICE', size: 18 },
    { rowId: 122, folder: 'WEB', size: 15 },
    { rowId: 123, folder: 'UIX', size: 39 },
    { rowId: 124, folder: 'KRN', size: 41 },
    { rowId: 125, folder: 'LNX', size: 12 },
    { rowId: 126, folder: 'IMG', size: 17 },
    { rowId: 127, folder: 'DOC', size: 23 },
    { rowId: 128, folder: 'TXT', size: 21 },
    { rowId: 129, folder: 'CSV', size: 14 },
    { rowId: 130, folder: 'XML', size: 45 },
    { rowId: 131, folder: 'JSON', size: 30 },
    { rowId: 132, folder: 'AUTH', size: 36 },
    { rowId: 133, folder: 'CORE', size: 27 },
    { rowId: 134, folder: 'MAIL', size: 19 },
    { rowId: 135, folder: 'HASH', size: 42 },
    { rowId: 136, folder: 'KEY', size: 18 },
    { rowId: 137, folder: 'BOT', size: 13 },
    { rowId: 138, folder: 'OPS', size: 29 },
    { rowId: 139, folder: 'RUN', size: 22 },
    { rowId: 140, folder: 'QRY', size: 31 },
    { rowId: 141, folder: 'CFG', size: 34 },
    { rowId: 142, folder: 'TMP2', size: 21 },
    { rowId: 143, folder: 'MOD', size: 16 },
    { rowId: 144, folder: 'ENV', size: 15 },
    { rowId: 145, folder: 'AAA', size: 10 },
    { rowId: 146, folder: 'OOO', size: 14 },
    { rowId: 147, folder: 'UUU', size: 17 },
    { rowId: 148, folder: 'AEO', size: 50 },
    { rowId: 149, folder: 'EIU', size: 52 },
    { rowId: 428, folder: 'IOU', size: 45 },
];

// ═══════════════════════════════════════════════════════════════
// Level 2: The Hexa Vault — Encrypted String
// ═══════════════════════════════════════════════════════════════

const ENCRYPTED_STRING = '$$492068696465207365637265747320696e20636f64652e205768617420616d20493f##';

// Decoded: "I hide secrets in code. What am I?"
// Answer: CIPHER

// ═══════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════

// GET Level 1 data (System Map)
router.get('/phase/1/data', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        res.json({ systemMap: SYSTEM_MAP });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system map.' });
    }
});

// POST Level 1 submission (Holy Trinity)
router.post('/phase/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { rowId } = req.body;

        if (!rowId) {
            return res.status(400).json({ error: 'No row ID provided.' });
        }

        const isComplete = String(rowId).trim() === String(CORRECT_ANSWERS.key2);

        await logAttempt(req.sessionId!, 2, 1, { rowId }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        let pointsEarned = 0;

        if (isComplete) {
            pointsEarned = 50;
            await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);

            const roundComplete = await checkRoundComplete(req.sessionId!);

            res.json({
                success: true,
                message: `BREACH KEY 1 UNLOCKED: Row ${rowId} — IOU identified. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                roundComplete,
                nextRound: roundComplete ? 3 : undefined
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

// POST Level 2 submission (Hexa Vault)
router.post('/phase/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { riddleAnswer } = req.body;

        if (!riddleAnswer) {
            return res.status(400).json({ error: 'No riddle answer provided.' });
        }

        const isCorrectAnswer = riddleAnswer.toUpperCase().trim() === CORRECT_ANSWERS.key3.toUpperCase();
        const isComplete = isCorrectAnswer;

        await logAttempt(req.sessionId!, 2, 2, { riddleAnswer }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        let pointsEarned = 0;

        if (isComplete) {
            pointsEarned = 50;
            await supabase
                .from('round_progress')
                .update({
                    evidence_2_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);

            const roundComplete = await checkRoundComplete(req.sessionId!);

            res.json({
                success: true,
                message: `BREACH KEY 2 UNLOCKED: The Hexa Vault decrypted. Answer: ${riddleAnswer}. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                roundComplete,
                nextRound: roundComplete ? 3 : undefined
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
            level1: progress?.evidence_1_complete || false,
            level2: progress?.evidence_2_complete || false,
            points: progress?.points || 0,
            completed: !!progress?.completed_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

export default router;
