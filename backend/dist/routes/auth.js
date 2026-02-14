"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const supabase_1 = __importDefault(require("../utils/supabase"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Team login
router.post('/login', async (req, res) => {
    try {
        const { teamName, accessCode } = req.body;
        if (!teamName || !accessCode) {
            return res.status(400).json({ error: 'Team name and access code are required.' });
        }
        // Find team
        const { data: team, error: teamError } = await supabase_1.default
            .from('teams')
            .select('*')
            .eq('team_name', teamName.toLowerCase())
            .single();
        if (teamError || !team) {
            return res.status(401).json({ error: 'Invalid team credentials.' });
        }
        // Verify access code
        const validCode = await bcryptjs_1.default.compare(accessCode, team.access_code);
        if (!validCode) {
            return res.status(401).json({ error: 'Invalid team credentials.' });
        }
        // Check for existing active session
        const { data: existingSession } = await supabase_1.default
            .from('game_sessions')
            .select('*')
            .eq('team_id', team.id)
            .eq('status', 'active')
            .single();
        let sessionId;
        if (existingSession) {
            sessionId = existingSession.id;
        }
        else {
            // Create new session if none exists
            sessionId = (0, uuid_1.v4)();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
            const { error: sessionError } = await supabase_1.default
                .from('game_sessions')
                .insert({
                id: sessionId,
                team_id: team.id,
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                status: 'active',
                current_round: 1
            });
            if (sessionError) {
                console.error('Session creation error:', sessionError);
                return res.status(500).json({ error: 'Failed to create game session.' });
            }
            // Initialize round progress
            for (let round = 1; round <= 3; round++) {
                await supabase_1.default.from('round_progress').insert({
                    id: (0, uuid_1.v4)(),
                    session_id: sessionId,
                    round_number: round,
                    evidence_1_complete: false,
                    evidence_2_complete: false,
                    evidence_3_complete: false,
                    evidence_4_complete: false,
                    escape_code_unlocked: false
                });
            }
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ teamId: team.id, sessionId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        res.json({
            success: true,
            token,
            team: {
                id: team.id,
                name: team.team_name
            },
            sessionId,
            isResuming: !!existingSession
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});
// Validate session
router.get('/session', auth_1.authenticateTeam, async (req, res) => {
    try {
        const { data: session, error } = await supabase_1.default
            .from('game_sessions')
            .select('*')
            .eq('id', req.sessionId)
            .single();
        if (error || !session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        res.json({ valid: true, session });
    }
    catch (error) {
        res.status(500).json({ error: 'Session validation failed.' });
    }
});
// Logout
router.post('/logout', auth_1.authenticateTeam, async (req, res) => {
    try {
        // Don't end the session, just acknowledge logout
        // Session persists for refresh protection
        res.json({ success: true, message: 'Logged out. Progress saved.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Logout failed.' });
    }
});
// Register new team (for setup purposes)
router.post('/register', async (req, res) => {
    try {
        const { teamName, accessCode, adminKey } = req.body;
        // Require admin key for registration
        if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
            return res.status(403).json({ error: 'Registration requires admin authorization.' });
        }
        if (!teamName || !accessCode) {
            return res.status(400).json({ error: 'Team name and access code are required.' });
        }
        // Hash access code
        const hashedCode = await bcryptjs_1.default.hash(accessCode, 10);
        const { data, error } = await supabase_1.default
            .from('teams')
            .insert({
            id: (0, uuid_1.v4)(),
            team_name: teamName.toLowerCase(),
            access_code: hashedCode
        })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Team name already exists.' });
            }
            throw error;
        }
        res.status(201).json({
            success: true,
            team: { id: data.id, name: data.team_name }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed.' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map