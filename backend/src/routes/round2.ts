import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers
const CORRECT_ANSWERS = {
    key1: parseInt(process.env.R2_KEY1 || '45'),   // Index of second timestamp in 120-second gap
    key2: process.env.R2_KEY2 || '149',             // Row ID for COIN (the one that passes all 3 rules)
    key3: process.env.R2_KEY3 || 'COIN',            // Riddle answer
    finalToken: process.env.R2_FINAL_TOKEN || '45-149-COIN', // Combined audit token
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

// Log A: 24-Hour Format (20 Entries)
const LOG_A: string[] = [
    '08:00:15', '08:12:45', '08:22:10', '08:35:00', '08:45:30',
    '09:10:00', '09:25:15', '09:40:00', '10:05:20', '10:15:00',
    '11:00:00', '11:15:45', '11:30:10', '11:45:00', '12:00:30',
    '13:15:00', '13:30:45', '13:45:10', '14:10:00', '14:25:30',
];

// Log B: 24-Hour Format (15 Entries)
const LOG_B: string[] = [
    '08:05:00', '08:15:30', '08:30:00', '08:50:00', '09:05:45',
    '09:30:10', '09:55:00', '10:20:30', '10:45:00', '11:10:15',
    '11:55:00', '12:15:45', '12:45:10', '13:00:00', '14:00:30',
];

// Log C: AM/PM Format (15 Entries)
const LOG_C_AMPM: string[] = [
    '08:02:30 AM', '08:20:00 AM', '08:32:15 AM', '08:40:45 AM', '09:00:00 AM',
    '10:00:00 AM', '10:30:00 AM', '11:05:00 AM', '12:30:00 PM', '01:05:00 PM',
    '02:00:00 PM', '02:05:00 PM', '02:07:00 PM', '02:15:45 PM', '02:30:00 PM',
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
const logCConverted = LOG_C_AMPM.map(convertAmPmTo24);
const allTimestamps = [...LOG_A, ...LOG_B, ...logCConverted].sort(
    (a, b) => timeToSeconds(a) - timeToSeconds(b)
);

// Find the 120-second gap
let gapIndex = -1;
for (let i = 1; i < allTimestamps.length; i++) {
    const diff = timeToSeconds(allTimestamps[i]) - timeToSeconds(allTimestamps[i - 1]);
    if (diff === 120) {
        gapIndex = i;
        break;
    }
}

// Pick a conversion challenge from Log C — use "02:07:00 PM" (index 12)
const CONVERSION_CHALLENGE = '02:07:00 PM';
const CONVERSION_ANSWER = convertAmPmTo24(CONVERSION_CHALLENGE); // "14:07:00"

// Pick a sorted index challenge — use index 25 (middle area)
const SORTED_INDEX_CHALLENGE = 25;

const PHASE1_ANSWERS = {
    conversionAnswer: CONVERSION_ANSWER,
    sortedTimestamp: allTimestamps[SORTED_INDEX_CHALLENGE],
    breachKey: gapIndex,
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
    { rowId: 101, folder: 'DATA', size: 12 },
    { rowId: 102, folder: 'FILE', size: 15 },
    { rowId: 103, folder: 'NODE', size: 20 },
    { rowId: 104, folder: 'BASE', size: 33 },
    { rowId: 105, folder: 'LINK', size: 18 },
    { rowId: 106, folder: 'USER', size: 21 },
    { rowId: 107, folder: 'PASS', size: 10 },
    { rowId: 108, folder: 'CODE', size: 45 },
    { rowId: 109, folder: 'TEST', size: 12 },
    { rowId: 110, folder: 'HOST', size: 30 },
    { rowId: 111, folder: 'PORT', size: 22 },
    { rowId: 112, folder: 'PATH', size: 14 },
    { rowId: 113, folder: 'META', size: 27 },
    { rowId: 114, folder: 'NULL', size: 11 },
    { rowId: 115, folder: 'TRUE', size: 36 },
    { rowId: 116, folder: 'VOID', size: 19 },
    { rowId: 117, folder: 'ROOT', size: 42 },
    { rowId: 118, folder: 'BLOC', size: 25 },
    { rowId: 119, folder: 'SYNC', size: 13 },
    { rowId: 120, folder: 'BYTE', size: 50 },
    { rowId: 121, folder: 'BITS', size: 15 },
    { rowId: 122, folder: 'WORK', size: 24 },
    { rowId: 123, folder: 'TASK', size: 31 },
    { rowId: 124, folder: 'ZONE', size: 18 },
    { rowId: 125, folder: 'AREA', size: 20 },
    { rowId: 126, folder: 'PLUG', size: 33 },
    { rowId: 127, folder: 'FLOW', size: 27 },
    { rowId: 128, folder: 'GRID', size: 16 },
    { rowId: 129, folder: 'COIN', size: 44 },
    { rowId: 130, folder: 'BACK', size: 12 },
    { rowId: 131, folder: 'SAVE', size: 15 },
    { rowId: 132, folder: 'OPEN', size: 18 },
    { rowId: 133, folder: 'SEND', size: 21 },
    { rowId: 134, folder: 'READ', size: 30 },
    { rowId: 135, folder: 'EDIT', size: 22 },
    { rowId: 136, folder: 'LOCK', size: 14 },
    { rowId: 137, folder: 'CHAT', size: 27 },
    { rowId: 138, folder: 'MAIL', size: 33 },
    { rowId: 139, folder: 'LOGS', size: 18 },
    { rowId: 140, folder: 'LIST', size: 10 },
    { rowId: 141, folder: 'MENU', size: 45 },
    { rowId: 142, folder: 'VIEW', size: 12 },
    { rowId: 143, folder: 'JOIN', size: 32 },
    { rowId: 144, folder: 'PINS', size: 22 },
    { rowId: 145, folder: 'TEMP', size: 14 },
    { rowId: 146, folder: 'TIME', size: 27 },
    { rowId: 147, folder: 'DATE', size: 11 },
    { rowId: 148, folder: 'POST', size: 36 },
    { rowId: 149, folder: 'COIN', size: 39 },
    { rowId: 150, folder: 'QUIT', size: 19 },
];

// ═══════════════════════════════════════════════════════════════
// Phase 3: The Hexa Vault — Encrypted String
// ═══════════════════════════════════════════════════════════════

const ENCRYPTED_STRING = '#4%3@!4^5&*(4)9$4#e%2@0!2^0&*(4)8$4#6%6@1!6^3&*(6)b$2@0!7^4&*(6)8$6@1!7^3&*(2)0$6@1!2^0&*(6)8$6@5!6^1&*(6)4$2@0!6^1&*(6)e$6@4!2^0&*(6)1$2@0!7^4&*(6)1$6@9!6^c$2@0!6^2&*(6)5$7@4!2^0&*(6)e$6@f!2^0&*(6)6$6@f!6^4&*(7)9$3@f';

// Cleaned hex: 434f494e20204861636b207468612061206865616420616e642061207461696c20626574206e6f20626f64793f
// Decoded: "COIN  Hack tha a head and a tail bet no body?"
// The riddle: "Has a head and a tail but no body?" → Answer: COIN

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
            logC: LOG_C_AMPM,
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
                message: `KEY 2 UNLOCKED: Row ${rowId} — COIN identified. (+${pointsEarned} Points)`,
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
