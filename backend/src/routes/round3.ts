import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Correct answers (from environment)
const CORRECT_ANSWERS = {
    key3: process.env.R2_KEY3 || 'VOID',
    finalCheckpoint: process.env.R3_FINAL_CHECKPOINT || 'ENIGMA-SOLVED'
};

// Morse code mapping
const MORSE_CODE: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', ' ': '/'
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

// Check if Round 3 is unlocked
async function checkRound3Access(sessionId: string): Promise<boolean> {
    const { data: session } = await supabase
        .from('game_sessions')
        .select('current_round')
        .eq('id', sessionId)
        .single();

    return session?.current_round >= 3;
}

// Phase 1: Hexa Vault Filtering and Decoding
router.post('/phase/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        const { filtered, decoded, keyword } = req.body;

        if (!keyword) {
            return res.status(400).json({ error: 'No keyword provided.' });
        }

        const isCorrectKeyword = keyword.toUpperCase() === CORRECT_ANSWERS.key3.toUpperCase();

        let pointsEarned = 0;
        if (filtered) pointsEarned += 10;
        if (decoded) pointsEarned += 10;
        if (isCorrectKeyword) pointsEarned += 10;

        const isComplete = isCorrectKeyword && filtered && decoded;

        await logAttempt(req.sessionId!, 3, 1, { filtered, decoded, keyword }, isComplete);

        const { data: currentProgress } = await supabase.from('round_progress').select('points').eq('session_id', req.sessionId).eq('round_number', 3).single();
        let currentPoints = currentProgress?.points || 0;

        if (isComplete) {
            await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);

            res.json({
                success: true,
                message: `HEXA VAULT UNLOCKED. The truth is revealed. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned
            });
        } else {
            const deduction = 5;
            const newPoints = Math.max(0, currentPoints - deduction);
            await supabase.from('round_progress').update({ points: newPoints }).eq('session_id', req.sessionId).eq('round_number', 3);

            res.json({
                success: false,
                message: `DECODING FAILED. Check the hexadecimal translation. (-${deduction} Points)`,
                accessGranted: false,
                pointsDeducted: deduction
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// Final Checkpoint: Complete Game
router.post('/complete', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'No checkpoint code provided.' });
        }

        const isCorrect = code.toUpperCase() === CORRECT_ANSWERS.finalCheckpoint.toUpperCase();

        if (!isCorrect) {
            return res.json({
                success: false,
                message: 'CHECKPOINT FAILED. The enigma remains unsolved.',
                gameComplete: false
            });
        }

        // Mark round and game complete
        await supabase
            .from('round_progress')
            .update({
                evidence_3_complete: true,
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', req.sessionId)
            .eq('round_number', 3);

        await supabase
            .from('game_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', req.sessionId);

        // Calculate total points
        const { data: allProgress } = await supabase
            .from('round_progress')
            .select('points')
            .eq('session_id', req.sessionId);

        const totalPoints = (allProgress || []).reduce((sum, p) => sum + (p.points || 0), 0);

        await supabase
            .from('game_sessions')
            .update({ total_points: totalPoints } as any)
            .eq('id', req.sessionId);

        res.json({
            success: true,
            message: 'ENIGMA SOLVED. Case closed.',
            gameComplete: true,
            finalPoints: totalPoints
        });
    } catch (error) {
        res.status(500).json({ error: 'Checkpoint validation failed.' });
    }
});

// Get Round 3 status
router.get('/status', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { data: session } = await supabase
            .from('game_sessions')
            .select('current_round')
            .eq('id', req.sessionId)
            .single();

        if (session && session.current_round < 3) {
            return res.json({ locked: true, message: 'Complete Round 2 to unlock.' });
        }

        const { data: progress } = await supabase
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();

        res.json({
            locked: false,
            phase1: progress?.evidence_1_complete || false,
            points: progress?.points || 0,
            completed: !!progress?.completed_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

// Levenshtein distance for similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
}

export default router;
