"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const supabase_1 = __importDefault(require("../utils/supabase"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Correct answers (from environment)
const CORRECT_ANSWERS = {
    morseMessage: process.env.R3_MORSE_MESSAGE || 'TRUTH REVEALED',
    finalCheckpoint: process.env.R3_FINAL_CHECKPOINT || 'ENIGMA-SOLVED'
};
// Morse code mapping
const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', ' ': '/'
};
// Helper to log attempt
async function logAttempt(sessionId, roundNumber, evidenceNumber, attemptData, isCorrect) {
    await supabase_1.default.from('attempts').insert({
        id: (0, uuid_1.v4)(),
        session_id: sessionId,
        round_number: roundNumber,
        evidence_number: evidenceNumber,
        attempt_data: attemptData,
        is_correct: isCorrect,
        attempted_at: new Date().toISOString()
    });
}
// Check if Round 3 is unlocked
async function checkRound3Access(sessionId) {
    const { data: session } = await supabase_1.default
        .from('game_sessions')
        .select('current_round')
        .eq('id', sessionId)
        .single();
    return session?.current_round >= 3;
}
// Get Morse signal data
router.get('/signal', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound3Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 3 is locked. Complete Round 2 first.' });
        }
        // Convert message to Morse
        const message = CORRECT_ANSWERS.morseMessage;
        const morseSequence = message.toUpperCase().split('').map(char => {
            return MORSE_CODE[char] || '';
        }).join(' ');
        // Generate timing data for audio/visual
        const timingData = morseSequence.split('').map((symbol, index) => ({
            type: symbol === '.' ? 'dot' : symbol === '-' ? 'dash' : symbol === '/' ? 'space' : 'gap',
            position: index,
            duration: symbol === '.' ? 100 : symbol === '-' ? 300 : symbol === '/' ? 700 : 100
        }));
        res.json({
            title: 'THE SILENT SIGNAL',
            description: 'A pattern emerges from the static. Filter the noise to reveal the truth.',
            morseSequence, // The actual morse code pattern
            timingData,
            noiseLevel: 0.7, // Initial noise level
            hint: 'Adjust the filter. Listen for the rhythm.',
            audioConfig: {
                dotFrequency: 800,
                dashFrequency: 800,
                sampleRate: 44100
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load signal.' });
    }
});
// Validate Morse pattern extraction
router.post('/pattern', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound3Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }
        const { pattern } = req.body; // User's extracted dot/dash pattern
        if (!pattern) {
            return res.status(400).json({ error: 'No pattern provided.' });
        }
        // Normalize patterns for comparison
        const correctMorse = CORRECT_ANSWERS.morseMessage.toUpperCase().split('').map(char => {
            return MORSE_CODE[char] || '';
        }).join(' ').replace(/\s+/g, ' ').trim();
        const userPattern = pattern.replace(/\s+/g, ' ').trim();
        // Check similarity (allow some tolerance)
        const similarity = calculateSimilarity(correctMorse, userPattern);
        const isCorrect = similarity > 0.85; // 85% accuracy threshold
        await logAttempt(req.sessionId, 3, 1, { pattern }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_1_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);
            res.json({
                success: true,
                message: 'PATTERN EXTRACTED. The signal is clear.',
                accessGranted: true,
                similarity: Math.round(similarity * 100)
            });
        }
        else {
            res.json({
                success: false,
                message: 'PATTERN INCOMPLETE. Adjust the noise filter and try again.',
                accessGranted: false,
                similarity: Math.round(similarity * 100)
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Validate decoded message
router.post('/decode', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound3Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'No message provided.' });
        }
        const normalizedInput = message.toUpperCase().replace(/[^A-Z]/g, '');
        const normalizedAnswer = CORRECT_ANSWERS.morseMessage.replace(/[^A-Z]/g, '');
        const isCorrect = normalizedInput === normalizedAnswer;
        await logAttempt(req.sessionId, 3, 2, { message }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_2_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);
            res.json({
                success: true,
                message: 'MESSAGE DECODED. The truth has been revealed.',
                accessGranted: true
            });
        }
        else {
            res.json({
                success: false,
                message: 'DECODING ERROR. The message still holds secrets.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Final checkpoint
router.post('/checkpoint', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound3Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 3 is locked.' });
        }
        // Check prerequisites
        const { data: progress } = await supabase_1.default
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();
        if (!progress?.evidence_2_complete) {
            return res.status(403).json({
                error: 'CHECKPOINT LOCKED. Decode the message first.'
            });
        }
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'No checkpoint code provided.' });
        }
        const isCorrect = code.toUpperCase() === CORRECT_ANSWERS.finalCheckpoint;
        await logAttempt(req.sessionId, 3, 3, { code }, isCorrect);
        if (isCorrect) {
            // Mark round and game complete
            await supabase_1.default
                .from('round_progress')
                .update({
                evidence_3_complete: true,
                escape_code_unlocked: true,
                completed_at: new Date().toISOString()
            })
                .eq('session_id', req.sessionId)
                .eq('round_number', 3);
            await supabase_1.default
                .from('game_sessions')
                .update({ status: 'completed' })
                .eq('id', req.sessionId);
            // Get final statistics
            const { data: allAttempts } = await supabase_1.default
                .from('attempts')
                .select('*')
                .eq('session_id', req.sessionId);
            const { data: session } = await supabase_1.default
                .from('game_sessions')
                .select('started_at')
                .eq('id', req.sessionId)
                .single();
            const totalTime = session ?
                Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000) : 0;
            res.json({
                success: true,
                message: 'ENIGMA SOLVED. Case closed.',
                gameComplete: true,
                finalStatus: 'CASE_SOLVED',
                stats: {
                    totalTimeSeconds: totalTime,
                    totalAttempts: allAttempts?.length || 0,
                    correctAttempts: allAttempts?.filter(a => a.is_correct).length || 0
                }
            });
        }
        else {
            res.json({
                success: false,
                message: 'CHECKPOINT FAILED. The enigma remains unsolved.',
                gameComplete: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Checkpoint validation failed.' });
    }
});
// Get Round 3 status
router.get('/status', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { data: session } = await supabase_1.default
            .from('game_sessions')
            .select('current_round')
            .eq('id', req.sessionId)
            .single();
        if (session?.current_round < 3) {
            return res.json({ locked: true, message: 'Complete Round 2 to unlock.' });
        }
        const { data: progress } = await supabase_1.default
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 3)
            .single();
        res.json({
            locked: false,
            patternExtracted: progress?.evidence_1_complete || false,
            messageDecoded: progress?.evidence_2_complete || false,
            checkpointReached: progress?.evidence_3_complete || false,
            completed: !!progress?.completed_at
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});
// Levenshtein distance for similarity calculation
function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0)
        return len2 === 0 ? 1 : 0;
    if (len2 === 0)
        return 0;
    const matrix = [];
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
}
exports.default = router;
//# sourceMappingURL=round3.js.map