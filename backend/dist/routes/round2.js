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
    suspiciousIp: process.env.R2_SUSPICIOUS_IP || '192.168.1.147',
    breachTime: process.env.R2_BREACH_TIME || '03:47:22',
    anomalousFile: process.env.R2_ANOMALOUS_FILE || 'config_backup_modified.sys',
    decodedMessage: process.env.R2_DECODED_MESSAGE || 'INSIDER-ACCESS-GRANTED',
    morseStarter: process.env.R2_MORSE_STARTER || 'THE SIGNAL IS CLEAR'
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
// Check if Round 2 is unlocked
async function checkRound2Access(sessionId) {
    const { data: session } = await supabase_1.default
        .from('game_sessions')
        .select('current_round')
        .eq('id', sessionId)
        .single();
    return session?.current_round >= 2;
}
// Phase 1: Log Analysis
router.post('/phase/1', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound2Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 2 is locked. Complete Round 1 first.' });
        }
        const { ip, timestamp } = req.body;
        if (!ip && !timestamp) {
            return res.status(400).json({ error: 'Provide IP address or breach timestamp.' });
        }
        const ipCorrect = ip === CORRECT_ANSWERS.suspiciousIp;
        const timeCorrect = timestamp === CORRECT_ANSWERS.breachTime;
        const isCorrect = ipCorrect || timeCorrect;
        await logAttempt(req.sessionId, 2, 1, { ip, timestamp }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_1_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);
            res.json({
                success: true,
                message: ipCorrect
                    ? 'SUSPICIOUS IP CONFIRMED. Source identified: Internal network.'
                    : 'BREACH TIMESTAMP VERIFIED. Incident window established.',
                accessGranted: true,
                detail: ipCorrect ? 'ip_match' : 'timestamp_match'
            });
        }
        else {
            res.json({
                success: false,
                message: 'NO MATCH FOUND. Continue analyzing the logs.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Phase 2: File Trace
router.post('/phase/2', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound2Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'No file selected.' });
        }
        const isCorrect = filename === CORRECT_ANSWERS.anomalousFile;
        await logAttempt(req.sessionId, 2, 2, { filename }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_2_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);
            res.json({
                success: true,
                message: 'ANOMALOUS FILE DETECTED. Modified timestamp does not match creation date.',
                accessGranted: true,
                metadata: {
                    created: '2026-01-15T14:32:00',
                    modified: '2026-02-03T03:45:17',
                    size: '2.4KB → 847KB',
                    warning: 'FILE SIZE DISCREPANCY DETECTED'
                }
            });
        }
        else {
            res.json({
                success: false,
                message: 'FILE APPEARS NORMAL. Keep searching.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Phase 3: Communication Leak (cipher decoding)
router.post('/phase/3', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound2Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        const { decoded } = req.body;
        if (!decoded) {
            return res.status(400).json({ error: 'No decoded message provided.' });
        }
        const isCorrect = decoded.toUpperCase().replace(/[^A-Z]/g, '') ===
            CORRECT_ANSWERS.decodedMessage.replace(/[^A-Z]/g, '');
        await logAttempt(req.sessionId, 2, 3, { decoded }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_3_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 2);
            res.json({
                success: true,
                message: 'MESSAGE DECRYPTED. Insider threat confirmed.',
                accessGranted: true
            });
        }
        else {
            res.json({
                success: false,
                message: 'DECRYPTION FAILED. The cipher pattern is different.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Enigma Phase: Combine all evidence
router.post('/enigma', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound2Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        // Check all phases complete
        const { data: progress } = await supabase_1.default
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 2)
            .single();
        if (!progress?.evidence_1_complete ||
            !progress?.evidence_2_complete ||
            !progress?.evidence_3_complete) {
            return res.status(403).json({
                error: 'ENIGMA LOCKED. Complete all investigation phases first.',
                required: {
                    phase1: progress?.evidence_1_complete || false,
                    phase2: progress?.evidence_2_complete || false,
                    phase3: progress?.evidence_3_complete || false
                }
            });
        }
        // Mark round 2 complete
        await supabase_1.default
            .from('round_progress')
            .update({
            escape_code_unlocked: true,
            completed_at: new Date().toISOString()
        })
            .eq('session_id', req.sessionId)
            .eq('round_number', 2);
        // Unlock round 3
        await supabase_1.default
            .from('game_sessions')
            .update({ current_round: 3 })
            .eq('id', req.sessionId);
        res.json({
            success: true,
            message: 'ENIGMA PHASE COMPLETE. All evidence linked.',
            roundComplete: true,
            nextRound: 3,
            morseStarter: CORRECT_ANSWERS.morseStarter,
            hint: 'A signal awaits in the static. Listen carefully.'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Enigma validation failed.' });
    }
});
// Get Round 2 status
router.get('/status', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { data: session } = await supabase_1.default
            .from('game_sessions')
            .select('current_round')
            .eq('id', req.sessionId)
            .single();
        if (session?.current_round < 2) {
            return res.json({ locked: true, message: 'Complete Round 1 to unlock.' });
        }
        const { data: progress } = await supabase_1.default
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
            enigmaUnlocked: progress?.evidence_1_complete &&
                progress?.evidence_2_complete &&
                progress?.evidence_3_complete,
            completed: !!progress?.completed_at
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});
// Get encrypted message for Phase 3
router.get('/cipher', auth_1.authenticateTeam, async (req, res) => {
    try {
        if (!await checkRound2Access(req.sessionId)) {
            return res.status(403).json({ error: 'Round 2 is locked.' });
        }
        // Simple Caesar cipher (shift 3) of the message
        const message = CORRECT_ANSWERS.decodedMessage;
        const encrypted = message.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode(((char.charCodeAt(0) - 65 + 3) % 26) + 65);
            }
            return char;
        }).join('');
        res.json({
            encryptedMessage: encrypted,
            hint: 'The alphabet holds the key. Count backwards from where you stand.',
            cipherType: 'substitution'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch cipher.' });
    }
});
exports.default = router;
//# sourceMappingURL=round2.js.map