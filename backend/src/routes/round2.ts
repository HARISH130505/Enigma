import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers
const CORRECT_ANSWERS = {
    key1: parseInt(process.env.R2_KEY1 || '11'),   // Index of second timestamp in 120-second gap
    key2: process.env.R2_KEY2 || '428',             // Row ID (IOU)
    key3: process.env.R2_KEY3 || 'CIPHER',            // Riddle answer
    finalToken: process.env.R2_FINAL_TOKEN || '11-428-CIPHER', // Combined audit token
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

// ═══════════════════════════════════════════════════════════════
// Phase 1: The 120-Second Shadow
// ═══════════════════════════════════════════════════════════════

// Log A
const LOG_A: string[] = [
    '35400', '35610', '35970', '36330', '36750', '37110'
];

// Log B
const LOG_B: string[] = [
    '35520', '35820', '36090', '36510', '37020'
];

// Log C
const LOG_C: string[] = [
    '09:50:30', '10:01:30', '10:08:30', '10:18:30'
];

// Convert AM/PM to 24-hour format
function convertAmPmTo24(timeStr: string): string {
    const parts = timeStr.trim().split(' ');
    const period = parts[1].toUpperCase();
    const [h, m, s] = parts[0].split(':').map(Number);
    let hours = h;
    if (period === 'AM' && hours === 12) hours = 0;
    else if (period === 'PM' && hours !== 12) hours += 12;
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Convert HH:MM:SS to total seconds
function timeToSeconds(time: string): number {
    const [h, m, s] = time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
}

// Pre-compute: Convert Log C, merge, sort, and find the gap
const logCConverted = LOG_C.map(timeToSeconds).map(String);
const allTimestamps = [...LOG_A, ...LOG_B, ...logCConverted].sort(
    (a, b) => parseInt(a) - parseInt(b)
);

// Find the 120-second gap
let gapIndex = -1;
for (let i = 1; i < allTimestamps.length; i++) {
    const diff = parseInt(allTimestamps[i]) - parseInt(allTimestamps[i - 1]);
    if (diff === 120) {
        gapIndex = i;
        break;
    }
}

// Pick a conversion challenge from Log C
const CONVERSION_CHALLENGE = '10:01:30';
const CONVERSION_ANSWER = timeToSeconds(CONVERSION_CHALLENGE).toString();

// Pick a sorted index challenge
const SORTED_INDEX_CHALLENGE = 6;

const PHASE1_ANSWERS = {
    conversionAnswer: CONVERSION_ANSWER,
    sortedTimestamp: allTimestamps[SORTED_INDEX_CHALLENGE],
    breachKey: gapIndex + (gapIndex - 1), // sum of indexes
};

// Log the computed answers at startup for debugging
console.log('[Phase 1] Computed answers:', {
    conversionAnswer: PHASE1_ANSWERS.conversionAnswer,
    sortedTimestamp: PHASE1_ANSWERS.sortedTimestamp,
    sortedIndexChallenge: SORTED_INDEX_CHALLENGE,
    breachKey: PHASE1_ANSWERS.breachKey,
    gapTimestamps: gapIndex >= 0
        ? `${allTimestamps[gapIndex - 1]} → ${allTimestamps[gapIndex]}`
        : 'NO GAP FOUND',
    totalTimestamps: allTimestamps.length,
});

// Also log the full sorted array for verification
console.log('[Phase 1] Full sorted array:');
allTimestamps.forEach((t, i) => {
    const marker = i === gapIndex ? ' <<< GAP' : '';
    console.log(`  [${i}] ${t}${marker}`);
});

// ═══════════════════════════════════════════════════════════════
// Phase 2: Holy Trinity — System Map (50 Rows)
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
// Phase 3: The Hexa Vault — Encrypted String
// ═══════════════════════════════════════════════════════════════

const ENCRYPTED_STRING = '$$492068696465207365637265747320696e20636f64652e205768617420616d20493f##';

// Decoded: "I hide secrets in code. What am I?"
// Answer: CIPHER

// ═══════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════

// GET Phase 1 data
router.get('/phase/1/data', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        res.json({
            logA: LOG_A,
            logB: LOG_B,
            logC: LOG_C,
            conversionChallenge: CONVERSION_CHALLENGE,
            sortedIndexChallenge: SORTED_INDEX_CHALLENGE,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data.' });
    }
});

// POST Phase 1 submission
// POST Phase 1 submission
router.post('/phase/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { breachKey } = req.body;

        if (breachKey === undefined) {
            return res.status(400).json({ error: 'Provide the breach key.' });
        }

        const isCorrect = parseInt(breachKey, 10) === PHASE1_ANSWERS.breachKey;

        await logAttempt(req.sessionId!, 2, 1, { breachKey }, isCorrect);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        let pointsEarned = 0;
        const feedback: string[] = [];

        if (isCorrect) {
            pointsEarned = 30;
            feedback.push('✓ Key 1 Unlocked (+30)');

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
                message: `KEY 1 UNLOCKED: The 120-second shadow revealed. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                feedback
            });
        } else {
            const deduction = 5;
            const newPoints = Math.max(0, currentPoints - deduction);
            await supabase.from('round_progress').update({ points: newPoints } as any).eq('session_id', req.sessionId).eq('round_number', 2);

            res.json({
                success: false,
                message: `ANALYSIS INCOMPLETE. 0/30 points earned. (-${deduction} Points penalty)`,
                accessGranted: false,
                pointsDeducted: deduction,
                pointsEarned: 0,
                feedback: ['✗ Breach Key incorrect']
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// GET Phase 2 data (System Map)
router.get('/phase/2/data', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        res.json({ systemMap: SYSTEM_MAP });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system map.' });
    }
});

// POST Phase 2 submission
router.post('/phase/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound2Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }

        const { rowId } = req.body;

        if (!rowId) {
            return res.status(400).json({ error: 'No row ID provided.' });
        }

        const isComplete = String(rowId).trim() === String(CORRECT_ANSWERS.key2);

        await logAttempt(req.sessionId!, 2, 2, { rowId }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        let pointsEarned = 0;

        if (isComplete) {
            pointsEarned = 35;
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
                message: `KEY 2 UNLOCKED: Row ${rowId} — IOU identified. (+${pointsEarned} Points)`,
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

// POST Phase 3 submission
router.post('/phase/3', authenticateTeam, async (req: AuthRequest, res: Response) => {
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

        await logAttempt(req.sessionId!, 2, 3, { riddleAnswer }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 2).single();
        let currentPoints = currentProgress?.points || 0;

        let pointsEarned = 0;

        if (isComplete) {
            pointsEarned = 35;
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

// Final Challenge: Form the Audit Token
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

        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', req.sessionId)
            .eq('round_number', 2);

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

// Checkpoint route
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

        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', req.sessionId)
            .eq('round_number', 2);

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
            message: 'ROUND 2 COMPLETE. Proceeding to Round 3.',
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
