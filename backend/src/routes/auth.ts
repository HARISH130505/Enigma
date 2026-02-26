import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../utils/supabase';
import { authenticateTeam, AuthRequest } from '../middleware/auth';

const router = Router();

// Team login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { teamName, accessCode } = req.body;

        if (!teamName || !accessCode) {
            console.log('Login attempt missing credentials');
            return res.status(400).json({ error: 'Team name and access code are required.' });
        }

        console.log(`Attempting login for team: ${teamName}`);

        // Find team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('team_name', teamName.toLowerCase())
            .single();

        if (teamError) {
            console.error('Supabase team lookup error:', teamError);
        }

        if (!team) {
            console.log('Team not found in database');
            return res.status(401).json({ error: 'Invalid team credentials.' });
        }

        console.log('Team found, verifying password...');

        // Verify access code (Plain text check as requested)
        // const validCode = await bcrypt.compare(accessCode, team.access_code);
        const validCode = accessCode === team.access_code;

        if (!validCode) {
            console.log('Password verification failed');
            return res.status(401).json({ error: 'Invalid team credentials.' });
        }

        // Check for existing active session
        const { data: existingSession } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('team_id', team.id)
            .eq('status', 'active')
            .single();

        let sessionId: string;

        if (existingSession) {
            sessionId = existingSession.id;
        } else {
            // Create new session if none exists
            sessionId = uuidv4();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 40 * 60 * 1000); // 40 minutes for Round 1

            const { error: sessionError } = await supabase
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
            console.log(`[Login] Creating round_progress records for session ${sessionId}`);
            for (let round = 1; round <= 3; round++) {
                const progressId = uuidv4();
                const progressData = {
                    id: progressId,
                    session_id: sessionId,
                    round_number: round,
                    evidence_1_complete: false,
                    evidence_2_complete: false,
                    evidence_3_complete: false,
                    evidence_4_complete: false,
                    escape_code_unlocked: false,
                    points: round === 1 ? 25 : 0 // Start Round 1 with 25 points
                };

                console.log(`[Login] Inserting round_progress for round ${round}:`, progressData);
                const { error: progressError } = await supabase.from('round_progress').insert(progressData);

                if (progressError) {
                    console.error(`[Login] Failed to create round_progress for round ${round}:`, progressError);
                    return res.status(500).json({ error: `Failed to initialize round ${round} progress.` });
                }
                console.log(`[Login] Successfully created round_progress for round ${round}`);
            }
            console.log(`[Login] All round_progress records created successfully`);
        }

        // Generate JWT
        const token = jwt.sign(
            { teamId: team.id, sessionId },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
        );

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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Validate session
router.get('/session', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        const { data: session, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', req.sessionId)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.json({ valid: true, session });
    } catch (error) {
        res.status(500).json({ error: 'Session validation failed.' });
    }
});

// Logout
router.post('/logout', authenticateTeam, async (req: AuthRequest, res: Response) => {
    try {
        // Don't end the session, just acknowledge logout
        // Session persists for refresh protection
        res.json({ success: true, message: 'Logged out. Progress saved.' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed.' });
    }
});

// Register new team (for setup purposes)
router.post('/register', async (req: Request, res: Response) => {
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
        const hashedCode = await bcrypt.hash(accessCode, 10);

        const { data, error } = await supabase
            .from('teams')
            .insert({
                id: uuidv4(),
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
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

export default router;
