-- Create round_progress table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS round_progress (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    evidence_1_complete BOOLEAN DEFAULT FALSE,
    evidence_2_complete BOOLEAN DEFAULT FALSE,
    evidence_3_complete BOOLEAN DEFAULT FALSE,
    evidence_4_complete BOOLEAN DEFAULT FALSE,
    escape_code_unlocked BOOLEAN DEFAULT FALSE,
    points INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, round_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_round_progress_session ON round_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_round_progress_round ON round_progress(round_number);

-- Enable Row Level Security (RLS)
ALTER TABLE round_progress ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on round_progress" ON round_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON round_progress TO anon, authenticated;

COMMENT ON TABLE round_progress IS 'Tracks progress for each round in a game session';
