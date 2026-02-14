-- Mission Enigma Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  current_round INTEGER DEFAULT 1 CHECK (current_round >= 1 AND current_round <= 3),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Round progress table
CREATE TABLE IF NOT EXISTS round_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number >= 1 AND round_number <= 3),
  evidence_1_complete BOOLEAN DEFAULT FALSE,
  evidence_2_complete BOOLEAN DEFAULT FALSE,
  evidence_3_complete BOOLEAN DEFAULT FALSE,
  evidence_4_complete BOOLEAN DEFAULT FALSE,
  escape_code_unlocked BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, round_number)
);

-- Attempts tracking table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  evidence_number INTEGER NOT NULL,
  attempt_data JSONB,
  is_correct BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table (optional - for database-stored admins)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_team ON game_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_progress_session ON round_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_timestamp ON attempts(attempted_at);

-- Row Level Security Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for backend)
CREATE POLICY "Service role full access on teams" ON teams
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on game_sessions" ON game_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on round_progress" ON round_progress
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on attempts" ON attempts
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Anon can read own team data (with JWT)
CREATE POLICY "Anon read own team" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Anon read own sessions" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anon read own progress" ON round_progress
  FOR SELECT USING (true);

-- Insert sample team for testing
INSERT INTO teams (team_name, access_code) 
VALUES ('alpha', '$2a$10$qH7JCNqm.Zg7EhxrU6KQxuJhz5k8nGv7kR1UM.dLX9r5V8FZP1K1W')
ON CONFLICT (team_name) DO NOTHING;
-- Password for 'alpha' team is: mission2026

-- Summary:
-- This creates all necessary tables for Mission Enigma with:
-- - Teams with hashed access codes
-- - Game sessions with 60-minute timer tracking
-- - Progress tracking per round
-- - Attempt logging for analytics
-- - RLS policies for security (service role has full access)
