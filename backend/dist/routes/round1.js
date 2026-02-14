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
    systemFlow: (process.env.R1_SYSTEM_FLOW_ORDER || 'sensors,server,monitoring,logs').split(','),
    failurePoint: process.env.R1_FAILURE_POINT || 'monitoring-node',
    logsSequence: (process.env.R1_CORRUPTED_LOGS_SEQUENCE || '3,1,4,2').split(','),
    rootCause: process.env.R1_ROOT_CAUSE || 'manual-override',
    escapeCode: process.env.R1_ESCAPE_CODE || 'DELTA-7X-OVERRIDE'
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
// Evidence 1: System Flow (drag-and-drop ordering)
router.post('/evidence/1', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { order } = req.body; // Array of strings
        if (!Array.isArray(order) || order.length !== 4) {
            return res.status(400).json({ error: 'Invalid submission format.' });
        }
        const isCorrect = JSON.stringify(order) === JSON.stringify(CORRECT_ANSWERS.systemFlow);
        await logAttempt(req.sessionId, 1, 1, { order }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_1_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);
            res.json({
                success: true,
                message: 'SYSTEM FLOW VERIFIED. Data path confirmed.',
                accessGranted: true
            });
        }
        else {
            res.json({
                success: false,
                message: 'SEQUENCE MISMATCH. Re-analyze the data flow.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        console.error('Evidence 1 error:', error);
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Evidence 2: Failure Point (node selection)
router.post('/evidence/2', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { selectedNode } = req.body;
        if (!selectedNode) {
            return res.status(400).json({ error: 'No node selected.' });
        }
        const isCorrect = selectedNode === CORRECT_ANSWERS.failurePoint;
        await logAttempt(req.sessionId, 1, 2, { selectedNode }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_2_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);
            res.json({
                success: true,
                message: 'FAILURE POINT IDENTIFIED. Critical node isolated.',
                accessGranted: true
            });
        }
        else {
            res.json({
                success: false,
                message: 'INCORRECT NODE. The anomaly persists elsewhere.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Evidence 3: Corrupted Logs (timeline alignment)
router.post('/evidence/3', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { sequence } = req.body; // Array of positions
        if (!Array.isArray(sequence) || sequence.length !== 4) {
            return res.status(400).json({ error: 'Invalid sequence format.' });
        }
        const isCorrect = JSON.stringify(sequence.map(String)) === JSON.stringify(CORRECT_ANSWERS.logsSequence);
        await logAttempt(req.sessionId, 1, 3, { sequence }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_3_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);
            res.json({
                success: true,
                message: 'TIMELINE RECONSTRUCTED. Log integrity restored.',
                accessGranted: true
            });
        }
        else {
            res.json({
                success: false,
                message: 'TEMPORAL ANOMALY DETECTED. Sequence inconsistent.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Evidence 4: Root Cause
router.post('/evidence/4', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { choice } = req.body; // 'system-crash' or 'manual-override'
        if (!choice || !['system-crash', 'manual-override'].includes(choice)) {
            return res.status(400).json({ error: 'Invalid choice.' });
        }
        const isCorrect = choice === CORRECT_ANSWERS.rootCause;
        await logAttempt(req.sessionId, 1, 4, { choice }, isCorrect);
        if (isCorrect) {
            await supabase_1.default
                .from('round_progress')
                .update({ evidence_4_complete: true })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);
            // Check if escape code should be unlocked
            const { data: progress } = await supabase_1.default
                .from('round_progress')
                .select('*')
                .eq('session_id', req.sessionId)
                .eq('round_number', 1)
                .single();
            const escapeUnlocked = progress?.evidence_2_complete &&
                progress?.evidence_3_complete &&
                progress?.evidence_4_complete;
            if (escapeUnlocked) {
                await supabase_1.default
                    .from('round_progress')
                    .update({ escape_code_unlocked: true })
                    .eq('session_id', req.sessionId)
                    .eq('round_number', 1);
            }
            res.json({
                success: true,
                message: 'ROOT CAUSE CONFIRMED. The truth emerges.',
                accessGranted: true,
                escapeCodeUnlocked: escapeUnlocked
            });
        }
        else {
            res.json({
                success: false,
                message: 'ANALYSIS INCONCLUSIVE. Re-examine the evidence.',
                accessGranted: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Escape Code validation
router.post('/escape-code', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { code } = req.body;
        // Check if escape code is unlocked
        const { data: progress } = await supabase_1.default
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
        await logAttempt(req.sessionId, 1, 5, { code }, isCorrect);
        if (isCorrect) {
            // Mark round 1 complete
            await supabase_1.default
                .from('round_progress')
                .update({ completed_at: new Date().toISOString() })
                .eq('session_id', req.sessionId)
                .eq('round_number', 1);
            // Unlock round 2
            await supabase_1.default
                .from('game_sessions')
                .update({ current_round: 2 })
                .eq('id', req.sessionId);
            res.json({
                success: true,
                message: 'ESCAPE CODE ACCEPTED. Round 1 Complete. Proceeding to Data Leak Investigation.',
                roundComplete: true,
                nextRound: 2
            });
        }
        else {
            res.json({
                success: false,
                message: 'INVALID ESCAPE CODE. Access denied.',
                roundComplete: false
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Validation failed.' });
    }
});
// Get Round 1 status
router.get('/status', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { data: progress } = await supabase_1.default
            .from('round_progress')
            .select('*')
            .eq('session_id', req.sessionId)
            .eq('round_number', 1)
            .single();
        res.json({
            evidence1: progress?.evidence_1_complete || false,
            evidence2: progress?.evidence_2_complete || false,
            evidence3: progress?.evidence_3_complete || false,
            evidence4: progress?.evidence_4_complete || false,
            escapeCodeUnlocked: progress?.escape_code_unlocked || false,
            completed: !!progress?.completed_at
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Status fetch failed.' });
    }
});
exports.default = router;
//# sourceMappingURL=round1.js.map