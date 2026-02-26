import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// Morse Code Transmissions — Round 3: The Intercepted Transmissions
// ═══════════════════════════════════════════════════════════════

// Morse code transmission strings (with noise/special char prefixes)
const TRANSMISSIONS = {
    question1: {
        morse: `@..  ^..-.  /  #-.--  $---  %..-  /  &.--.  *---  !...  ~...  +.  =...  /  =9?-  ^  /  @-.--  #- ---  $..-  /  %--  &.-  *-.--  /  !..-.  ~.  +.  =.-..  /  ?-  ^  /  @-  #.  $--  %.--.  &-  *  /  !-..  ~  /  =  ^-  @---  #  /  $...  %....  &.-  *.-.  !.  /  ~--  +.  =  /  ?  ^  /  @--  #  /  $--.  %  /  &..  *-  !....  /  ~...  +---  =--  ?  /  ^  @.  #---  $-.  %  /  &.  *  /  !..  ~.-..  +...  =.  /  ?-...  ^..-  @-  #  /  $  %  /  &-  *....  !.  /  ~  +--  =---  ?--  /  ^-  @  #  /  $-.--  %---  &..-  /  *-..  !---  /  ~  +..  =  /  ?  ^-.  @---  #  /  $  %.-..  &---  *-.  !--.  /  ~  +.  =.-.  ?  /  ^  @-  #.-.  $..-  %.-..  &-.--  /  *-...  !.  ~.-..  +---  =-.  --.  /  ?  ^-  @  #  /  $-.--  %---  &..-  /  *  !.--  ~....  +.-  =-  /  ?..  ^..`,
        decodedRiddle: 'If you possess me you may feel tempted to share me with someone else But the moment you do I no longer truly belong to you What am I',
        answer: process.env.R3_Q1_ANSWER as string
    },
    question2: {
        morse: `$*@..  / ^*$* ^....  #.-  $...-  (()%#&%.  /  &-.  *---  !  /  ~--  +---  =..-  -  /  $*)e*?-  ^---  /  !@#$^*(@...  #.--.  $.  %.  &.-  *-.-  /  !-  ~.-  @#^*(^&+-.  =-..  /  %&*)%&?-.  ^---  /  %&(^$^(l@.  #.-  !@#$%^$.  %.-.  &...  /  *-  !---  %&($!~#%&(~....  +.  =.-  !@#$%^?.-.  /  ^-  @.  #  /  $**$#!@#$%^$-.-.  %.  &.-  *-.  /  !.  ~.--.  +.  =.-  #$%%^*(&$-  /  ?.  %&*(^&(*^...-  @.  #.-.  -.--  /  @#$%$--  %.  &.-.  *-..  /  %&(&%$&*!-.--  ~---  +..-  /  ?...  ^.-  @-.--  /  #..  $.  % -..-  %^((%&9&..  *...  -  /  $^*()%$^%&(*!---  ~-.  +.-..  =-.--  /  ?--  ^....  @#$%@.  /  #-.--  !@#$%^&(*&^$---  %..-  /  @#$%)(*&^&-.-.  *.-  !.-..  ~.-..  /  @#$%^(*+---  =..-  -  /  @#$%*&^?  ^  /  @#$%@--  #.  /  #$%^)(*&^$  %.--  &....  *.-  -  /  ?.  ^..  @#$%)(*&^@..`,
        decodedRiddle: 'I have no mouth to speak and no ears to hear yet I can repeat every word you say I exist only when you call out to me What am I',
        answer: process.env.R3_Q2_ANSWER as string
    },
    question3: {
        morse: `@-  ^....  #.  $---  %-.  &.  /  *.--  !....  ~---  +  /  =-.-.  ?.  ^.-.  @.  #.-  $-  %.  &...  /  *--  !.  /  ~-..  +---  =.  ?...  /  ^...  @---  #  /  $.  %-..  &---  *  /  !..-.  ~---  +.  =.-.  /  ?--.  ^.-.  @---  #..-.  $..  %-  /  &.-  *-.  !..  ~-..  +  /  =.-.  ?.  ^...-  @.  #.-.  /  $-.-  %.  &.  *  /  !..  ~.--.  +...  =  /  ?-  ^....  @.  /  #---  $-.  %.  &.  *  /  !.--  ~....  +---  =  /  ?-  ^.--.  @..-  #.-.  $-.-.  %....  &.-  *...  /.  !--  ~.  +  /  =-.-.  ?.  ^.-.  @.  /  #....  $.-  %...  /  &-.  *---  !  /  ~..  +-.  =-  ?.  ^-.  @-..  #-.  /  $---  %-.  &  /  *.  !...-  ~.  +.-.  /  =..-  ?...  ^..  @-.  --.  /  #--  $  /  %.  &-.  *  /  !--  ~-..  +  /  =-.-.  ?.  ^.-.  @.  #  /  $..-.  %..  &-.  *.-  !.  ~.-..  +.-..  =-.--  /  ?..-  ^...  @.  #...  /  $--  %  /  &.--  *..  !.-..  ~.-..  +  /  =-.  ?.  ^...-  @.  #.-.  /  $-.-  %.  &-.  *---  !.--  /  ~..  +  /  =-.  ?.  ^-.-.  @  /  #-.  $---  %  /  &..  *-  /  !.--  ~....  +.-  =-  /  ?..  ^..`,
        decodedRiddle: 'The one who creates me does so for profit and never keeps me The one who purchases me has no intention of ever using me And the one who finally uses me will never know it What am I',
        answer: process.env.R3_Q3_ANSWER as string
    }
};

// Helper: check if all 3 transmissions are done and auto-complete the game
async function checkAndCompleteGame(sessionId: string) {
    const { data: progress } = await supabase
        .from('round_progress')
        .select('evidence_1_complete, evidence_2_complete, evidence_3_complete')
        .eq('session_id', sessionId)
        .eq('round_number', 3)
        .single();

    if (progress?.evidence_1_complete && progress?.evidence_2_complete && progress?.evidence_3_complete) {
        await supabase
            .from('round_progress')
            .update({
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('round_number', 3);

        // Calculate total points
        const { data: allProgress } = await supabase
            .from('round_progress')
            .select('points')
            .eq('session_id', sessionId);

        const totalPoints = (allProgress || []).reduce((sum, p) => sum + (p.points || 0), 0);

        await supabase
            .from('game_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                total_points: totalPoints
            } as any)
            .eq('id', sessionId);

        return { complete: true, totalPoints };
    }
    return { complete: false, totalPoints: 0 };
}

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

// ═══════════════════════════════════════════════════════════════
// Phase 1: Transmission 1 — Riddle Answer: COFFIN
// ═══════════════════════════════════════════════════════════════
router.post('/phase/1', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.toUpperCase().trim() === TRANSMISSIONS.question1.answer;

        await logAttempt(req.sessionId!, 3, 1, { answer }, isCorrect);

        const { data: currentProgress } = await supabase
            .from('round_progress')
            .select('points')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();
        let currentPoints = currentProgress?.points || 0;

        if (isCorrect) {
            const pointsEarned = 15;
            await supabase
                .from('round_progress')
                .update({
                    evidence_1_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);

            const gameResult = await checkAndCompleteGame(req.sessionId!);

            res.json({
                success: true,
                message: `TRANSMISSION 1 DECODED. Target identified. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                gameComplete: gameResult.complete,
                finalPoints: gameResult.complete ? gameResult.totalPoints : undefined
            });
        } else {
            res.json({
                success: false,
                message: `DECRYPTION FAILED. Re-examine the intercepted signal.`,
                accessGranted: false,
                pointsDeducted: 0
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ═══════════════════════════════════════════════════════════════
// Phase 2: Transmission 2 — Riddle Answer: SECRET
// ═══════════════════════════════════════════════════════════════
router.post('/phase/2', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.toUpperCase().trim() === TRANSMISSIONS.question2.answer;

        await logAttempt(req.sessionId!, 3, 2, { answer }, isCorrect);

        const { data: currentProgress } = await supabase
            .from('round_progress')
            .select('points')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();
        let currentPoints = currentProgress?.points || 0;

        if (isCorrect) {
            const pointsEarned = 15;
            await supabase
                .from('round_progress')
                .update({
                    evidence_2_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);

            const gameResult = await checkAndCompleteGame(req.sessionId!);

            res.json({
                success: true,
                message: `TRANSMISSION 2 DECODED. Intelligence confirmed. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                gameComplete: gameResult.complete,
                finalPoints: gameResult.complete ? gameResult.totalPoints : undefined
            });
        } else {
            res.json({
                success: false,
                message: `DECRYPTION FAILED. Noise interference detected.`,
                accessGranted: false,
                pointsDeducted: 0
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});

// ═══════════════════════════════════════════════════════════════
// Phase 3: Transmission 3 — Riddle Answer: ECHO
// ═══════════════════════════════════════════════════════════════
router.post('/phase/3', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ error: 'No answer provided.' });
        }

        const isCorrect = answer.toUpperCase().trim() === TRANSMISSIONS.question3.answer;

        await logAttempt(req.sessionId!, 3, 3, { answer }, isCorrect);

        const { data: currentProgress } = await supabase
            .from('round_progress')
            .select('points')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();
        let currentPoints = currentProgress?.points || 0;

        if (isCorrect) {
            const pointsEarned = 15;
            await supabase
                .from('round_progress')
                .update({
                    evidence_3_complete: true,
                    points: currentPoints + pointsEarned
                } as any)
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);

            const gameResult = await checkAndCompleteGame(req.sessionId!);

            res.json({
                success: true,
                message: `TRANSMISSION 3 DECODED. Final coordinates locked. (+${pointsEarned} Points)`,
                accessGranted: true,
                pointsEarned,
                gameComplete: gameResult.complete,
                finalPoints: gameResult.complete ? gameResult.totalPoints : undefined
            });
        } else {
            res.json({
                success: false,
                message: `DECRYPTION FAILED. Signal degradation detected.`,
                accessGranted: false,
                pointsDeducted: 0
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});


// ═══════════════════════════════════════════════════════════════
// Get Transmission Data (Morse strings for the frontend)
// ═══════════════════════════════════════════════════════════════
router.get('/transmissions', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        if (!await checkRound3Access(req.sessionId!)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }

        res.json({
            transmission1: { morse: TRANSMISSIONS.question1.morse },
            transmission2: { morse: TRANSMISSIONS.question2.morse },
            transmission3: { morse: TRANSMISSIONS.question3.morse }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transmissions.' });
    }
});

// ═══════════════════════════════════════════════════════════════
// Get Round 3 Status
// ═══════════════════════════════════════════════════════════════
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
            phase2: progress?.evidence_2_complete || false,
            phase3: progress?.evidence_3_complete || false,
            points: progress?.points || 0,
            completed: !!progress?.completed_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});

export default router;
